// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Alert } from "react-native";
import { SportsService } from "../services/sports.service";

export interface BookingDetailData {
  id: string;
  user_id: string | null;
  venue_id: string;
  total_amount: number;
  paid_amount: number;
  discount_amount: number;
  booking_status: string;
  guest_name: string | null;
  guest_phone: string | null;
  slot_id: string;
  created_at: string;
  profiles: { full_name: string; phone: string; avatar_url: string } | null;
  sports_slots: {
    start_time: string;
    end_time: string;
    slot_date: string;
    ground_id: string;
  };
  venues: { name: string; vertical: string };
  combined_time?: string;
}

export interface PaymentLog {
  id: string;
  amount: number;
  payment_mode: "cash" | "online" | "upi" | "card" | "bank_transfer" | "other";
  note: string;
  created_at: string;
  isInitial?: boolean; // Flag to identify our synthetic log
}

const formatHour = (timeStr: string) => {
  if (!timeStr) return "";
  const [h] = timeStr.split(":");
  const hourInt = parseInt(h, 10);
  const ampm = hourInt >= 12 ? "PM" : "AM";
  const displayHour = hourInt % 12 || 12;
  return `${displayHour} ${ampm}`;
};

export const useBookingDetails = (bookingId: string) => {
  const [booking, setBooking] = useState<BookingDetailData | null>(null);
  const [paymentLogs, setPaymentLogs] = useState<PaymentLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchDetails = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch the original booking first
      const { data: baseBooking, error: baseError } = await supabase
        .from("sports_bookings")
        .select("*, sports_slots!inner(*), profiles(*), venues(*)")
        .eq("id", bookingId)
        .single();

      if (baseError) throw baseError;

      // 2. Fetch ALL related bookings for this user/slot/date (including extensions)
      // We filter by phone/user and date to catch the "Add On" records
      let linkedQuery = supabase
        .from("sports_bookings")
        .select("*, sports_slots!inner(*)")
        .eq("sports_slots.slot_date", baseBooking.sports_slots.slot_date)
        .eq("sports_slots.ground_id", baseBooking.sports_slots.ground_id)
        .order("created_at", { ascending: true });

      if (baseBooking.user_id) {
        linkedQuery = linkedQuery.eq("user_id", baseBooking.user_id);
      } else {
        linkedQuery = linkedQuery.eq("guest_phone", baseBooking.guest_phone);
      }

      const { data: linkedData, error: linkedError } = await linkedQuery;

      if (linkedError) throw linkedError;

      // Ensure we have at least the current booking in the list
      const allLinkedBookings = linkedData && linkedData.length > 0 ? linkedData : [baseBooking];

      // 3. Aggregate data
      const totalAmount = allLinkedBookings.reduce((sum, b) => sum + Number(b.total_amount), 0);
      const paidAmount = allLinkedBookings.reduce((sum, b) => sum + Number(b.paid_amount), 0);
      const discountAmount = allLinkedBookings.reduce(
        (sum, b) => sum + Number(b.discount_amount || 0),
        0,
      );

      // Combine the booking details
      const aggregatedBooking = {
        ...baseBooking,
        total_amount: totalAmount,
        paid_amount: paidAmount,
        discount_amount: discountAmount,
        // Create a combined time string (e.g., 9 AM - 11 AM)
        combined_time: `${formatHour(baseBooking.sports_slots.start_time)} - ${formatHour(
          allLinkedBookings[allLinkedBookings.length - 1].sports_slots.end_time,
        )}`,
      };

      setBooking(aggregatedBooking);

      // 4. Fetch Payment Logs Ledger
      const { data: logsData, error: logsError } = await supabase
        .from("offline_payment_logs")
        .select("id, amount, payment_mode, note, created_at")
        .eq("booking_id", bookingId)
        .eq("booking_vertical", "sports")
        .order("created_at", { ascending: true });

      let fetchedLogs = (logsData as PaymentLog[]) || [];

      if (logsError && logsError.code !== "PGRST116") {
        console.warn("Could not fetch payment logs:", logsError);
      }

      // 5. Reconstruct Initial Advance Payment
      const totalLoggedAmount = fetchedLogs.reduce((sum, log) => sum + Number(log.amount), 0);
      const totalPaidAmount = Number(baseBooking.paid_amount) || 0;

      // If the total paid on the booking is greater than what's in the logs,
      // the difference is the initial advance payment.
      if (totalPaidAmount > totalLoggedAmount) {
        const initialAmount = totalPaidAmount - totalLoggedAmount;
        const initialLog: PaymentLog = {
          id: `initial-${baseBooking.id}`,
          amount: initialAmount,
          // Assume Online/UPI if user_id exists (app booking), otherwise Cash for manual
          payment_mode: baseBooking.user_id ? "online" : "cash",
          note: "Initial Advance Payment",
          created_at: baseBooking.created_at,
          isInitial: true,
        };

        // Unshift to put it at the very top of the list (earliest date)
        fetchedLogs.unshift(initialLog);
      }

      setPaymentLogs(fetchedLogs);
    } catch (error: any) {
      Alert.alert("Error", "Could not fetch booking details.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  const logPayment = async (
    amount: number,
    mode: "cash" | "online" | "upi" | "card" | "bank_transfer" | "other",
  ) => {
    setIsSaving(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      const userId = sessionData?.session?.user?.id;

      if (!token || !userId) {
        throw new Error("You must be logged in to log a payment. Please log out and back in.");
      }

      const dbPaymentMode = mode === "online" ? "upi" : mode;

      const { error } = await supabase.functions.invoke("log-offline-payment", {
        body: {
          bookingId: bookingId,
          vertical: "sports",
          amount: amount,
          mode: dbPaymentMode,
          loggedBy: userId,
        },
      });

      if (error) throw error;

      Alert.alert("Success", "Payment logged successfully.");
      await fetchDetails();
      return true;
    } catch (error: any) {
      Alert.alert("Payment Failed", error.message);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const cancelBooking = async () => {
    if (!booking) return false;
    setIsSaving(true);
    try {
      const { error: bookingError } = await supabase
        .from("sports_bookings")
        .update({ booking_status: "cancelled" })
        .eq("id", bookingId);
      // .select()
      // .single();

      if (bookingError) {
        console.error("Booking Error:", bookingError);
        throw new Error("You do not have permission to cancel this booking (RLS Blocked).");
      }

      const { error: slotError } = await supabase
        .from("sports_slots")
        .update({ status: "available" })
        .eq("id", booking.slot_id);
      // .select()
      // .maybeSingle();

      if (slotError) console.warn("Slot update issue:", slotError);

      Alert.alert("Success", "Booking cancelled successfully.");
      await fetchDetails();
      return true;
    } catch (error: any) {
      Alert.alert("Cancellation Failed", error.message);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const extendBooking = async (additionalMinutes: number, additionalCost: number) => {
    if (!booking) return false;
    setIsSaving(true);
    try {
      const [h, m, s] = booking.sports_slots.end_time.split(":").map(Number);
      let date = new Date();
      date.setHours(h, m + additionalMinutes, s);

      const newEndTime24 = `${date.getHours().toString().padStart(2, "0")}:${date
        .getMinutes()
        .toString()
        .padStart(2, "0")}:00`;

      await SportsService.extendBookingDuration({
        slotId: booking.slot_id,
        bookingId: booking.id,
        newEndTime24,
        extraAmount: additionalCost,
      });

      Alert.alert("Success", "Booking extended successfully.");
      await fetchDetails();
      return true;
    } catch (error: any) {
      Alert.alert("Extension Failed", error.message);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  return {
    booking,
    paymentLogs,
    loading,
    isSaving,
    logPayment,
    cancelBooking,
    extendBooking,
    refresh: fetchDetails,
  };
};
