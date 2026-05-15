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
  booking_status: string;
  guest_name: string | null;
  guest_phone: string | null;
  slot_id: string;
  profiles: { full_name: string; phone: string; avatar_url: string } | null;
  sports_slots: {
    start_time: string;
    end_time: string;
    slot_date: string;
    ground_id: string;
  };
  venues: { name: string; vertical: string };
}

export interface PaymentLog {
  id: string;
  amount: number;
  payment_mode: "cash" | "online";
  note: string;
  created_at: string;
}

export const useBookingDetails = (bookingId: string) => {
  const [booking, setBooking] = useState<BookingDetailData | null>(null);
  const [paymentLogs, setPaymentLogs] = useState<PaymentLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchDetails = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch Booking Details
      const { data: rawData, error: bookingError } = await supabase
        .from("sports_bookings")
        .select(
          `
          id, user_id, venue_id, total_amount, paid_amount, booking_status, guest_name, guest_phone, slot_id,
          profiles ( full_name, phone, avatar_url ),
          sports_slots ( start_time, end_time, slot_date, ground_id ),
          venues ( name, vertical )
        `,
        )
        .eq("id", bookingId)
        .single();

      if (bookingError) throw bookingError;

      let bookingData = rawData as any;

      // SECURE FALLBACK
      const profileData = Array.isArray(bookingData.profiles)
        ? bookingData.profiles[0]
        : bookingData.profiles;

      if (!profileData && bookingData.user_id) {
        try {
          const rpcBookings = await SportsService.getBookings(
            bookingData.venue_id,
            bookingData.sports_slots.ground_id,
            bookingData.sports_slots.slot_date,
          );

          const matched = rpcBookings.find((b: any) => b.id === bookingId);
          if (matched && matched.full_name) {
            bookingData.profiles = {
              full_name: matched.full_name,
              phone: matched.phone || "",
              avatar_url: matched.avatar_url || "",
            };
          }
        } catch (rpcErr) {
          console.warn("Secure fallback lookup failed:", rpcErr);
        }
      }

      setBooking(bookingData);

      // 2. Fetch Payment Logs Ledger
      const { data: logsData, error: logsError } = await supabase
        .from("offline_payment_logs")
        .select("id, amount, payment_mode, note, created_at")
        .eq("booking_id", bookingId)
        .eq("booking_vertical", "sports")
        .order("created_at", { ascending: true });

      if (logsError && logsError.code !== "PGRST116") {
        console.warn("Could not fetch payment logs:", logsError);
      } else {
        setPaymentLogs(logsData || []);
      }
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
      // 1. Update booking status (Added .select().single() to catch silent failures)
      const { error: bookingError } = await supabase
        .from("sports_bookings")
        .update({ booking_status: "cancelled" })
        .eq("id", bookingId)
        .select()
        .single();

      if (bookingError) {
        console.error("Booking Error:", bookingError);
        throw new Error("You do not have permission to cancel this booking (RLS Blocked).");
      }

      // 2. Update slot status to available
      const { error: slotError } = await supabase
        .from("sports_slots")
        .update({ status: "available" })
        .eq("id", booking.slot_id)
        .select()
        .maybeSingle();

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
