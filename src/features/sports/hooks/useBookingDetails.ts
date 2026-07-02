// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Alert } from "react-native";

export interface BookingDetailData {
  id: string;
  user_id: string | null;
  venue_id: string;
  total_amount: number;
  paid_amount: number;
  subtotal_amount?: number;
  discount_amount: number;
  platform_fee: number;
  gateway_fee: number;
  booking_status: string;
  guest_name: string | null;
  guest_phone: string | null;
  slot_id: string;
  created_at: string;
  profiles: { full_name: string; phone: string; avatar_url: string } | null;
  sports_slots: {
    id: string;
    start_time: string;
    end_time: string;
    slot_date: string;
    ground_id: string;
  };
  venues: {
    name: string;
    vertical: string;
    sports_venues: { sports_type: string }[];
  };
  combined_time?: string;
  idChain: string[];
  slotIdChain: string[];
  lastBookingId: string;
  parent_booking_id?: string | null;
  booking_group_id?: string | null;
  sports_booking_type?: string;
  booking_source?: string;
  payment_type?: string;
  sequence_number?: number;
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

      // 2. Fetch ALL potentially related bookings for this user/slot/date
      let linkedQuery = supabase
        .from("sports_bookings")
        .select("*, sports_slots!inner(*)")
        .eq("sports_slots.slot_date", baseBooking.sports_slots.slot_date)
        .eq("sports_slots.ground_id", baseBooking.sports_slots.ground_id)
        .neq("booking_status", "cancelled")
        .neq("booking_status", "refunded")
        .order("created_at", { ascending: true });

      // Only search for linked if it's part of a group or has a parent/child
      if (baseBooking.booking_group_id) {
        linkedQuery = linkedQuery.eq("booking_group_id", baseBooking.booking_group_id);
      } else if (baseBooking.parent_booking_id) {
        linkedQuery = linkedQuery.or(
          `id.eq.${baseBooking.parent_booking_id},parent_booking_id.eq.${baseBooking.parent_booking_id}`,
        );
      } else {
        // It's a base booking, look for its extensions
        linkedQuery = linkedQuery.or(
          `id.eq.${baseBooking.id},parent_booking_id.eq.${baseBooking.id}`,
        );
      }

      const { data: linkedData, error: linkedError } = await linkedQuery;

      if (linkedError) throw linkedError;

      const finalChain = (linkedData || []).sort((a, b) =>
        a.sports_slots.start_time.localeCompare(b.sports_slots.start_time),
      );

      // 4. Aggregate data
      const totalAmount = finalChain.reduce((sum, b) => sum + Number(b.total_amount), 0);
      const paidAmount = finalChain.reduce((sum, b) => sum + Number(b.paid_amount), 0);
      const subtotalAmount = finalChain.reduce((sum, b) => sum + Number(b.subtotal || 0), 0);
      const discountAmount = finalChain.reduce((sum, b) => sum + Number(b.discount_amount || 0), 0);
      const platformFee = finalChain.reduce((sum, b) => sum + Number(b.platform_fee || 0), 0);
      const gatewayFee = finalChain.reduce((sum, b) => sum + Number(b.gateway_fee || 0), 0);

      const firstBooking = finalChain[0];
      const lastBooking = finalChain[finalChain.length - 1];

      const aggregatedBooking: BookingDetailData = {
        ...baseBooking,
        total_amount: totalAmount,
        paid_amount: paidAmount,
        subtotal_amount: subtotalAmount,
        discount_amount: discountAmount,
        platform_fee: platformFee,
        gateway_fee: gatewayFee,
        booking_source: firstBooking.booking_source,
        sports_slots: {
          ...baseBooking.sports_slots,
          id: lastBooking.sports_slots.id, // Use the last slot ID for extension logic
          start_time: firstBooking.sports_slots.start_time,
          end_time: lastBooking.sports_slots.end_time,
        },
        combined_time: `${formatHour(firstBooking.sports_slots.start_time)} - ${formatHour(
          lastBooking.sports_slots.end_time,
        )}`,
        idChain: finalChain.map(b => b.id),
        slotIdChain: finalChain.map(b => b.slot_id),
        lastBookingId: lastBooking.id,
      };

      setBooking(aggregatedBooking);

      // 5. Fetch Payment Logs Ledger for ALL bookings in the chain
      const { data: logsData, error: logsError } = await supabase
        .from("offline_payment_logs")
        .select("id, amount, payment_mode, note, created_at")
        .in("booking_id", aggregatedBooking.idChain)
        .eq("booking_vertical", "sports")
        .order("created_at", { ascending: true });

      let fetchedLogs = (logsData as PaymentLog[]) || [];

      if (logsError && logsError.code !== "PGRST116") {
        console.warn("Could not fetch payment logs:", logsError);
      }

      // 6. Reconstruct Initial Advance Payment
      const totalLoggedAmount = fetchedLogs.reduce((sum, log) => sum + Number(log.amount), 0);
      const totalPaidInChain = aggregatedBooking.paid_amount;

      if (totalPaidInChain > totalLoggedAmount) {
        const initialAmount = totalPaidInChain - totalLoggedAmount;
        const initialLog: PaymentLog = {
          id: `initial-chain-${bookingId}`,
          amount: initialAmount,
          payment_mode: baseBooking.user_id ? "online" : "cash",
          note: "Initial Advance Payment",
          created_at: baseBooking.created_at,
          isInitial: true,
        };
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

      const vertical = booking?.venues?.vertical || "sports";

      const dbPaymentMode = mode === "online" ? "upi" : mode;

      // Log payment against the main booking ID
      const { error } = await supabase.functions.invoke("log-offline-payment", {
        body: {
          bookingId: bookingId,
          vertical: vertical,
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
      // Cancel ALL bookings in the chain
      const { error: bookingError } = await supabase
        .from("sports_bookings")
        .update({ booking_status: "cancelled" })
        .in("id", booking.idChain);

      if (bookingError) {
        console.error("Booking Cancellation Error:", bookingError);
        throw new Error("You do not have permission to cancel this booking.");
      }

      // Mark ALL slots in the chain as available
      const { error: slotError } = await supabase
        .from("sports_slots")
        .update({ status: "available" })
        .in("id", booking.slotIdChain);

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
    refresh: fetchDetails,
  };
};
