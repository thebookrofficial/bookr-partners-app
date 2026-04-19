// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Alert } from "react-native";

export interface BookingDetailData {
  id: string;
  total_amount: number;
  paid_amount: number;
  profiles: { full_name: string; phone: string; avatar_url: string };
  sports_slots: { start_time: string; end_time: string; slot_date: string };
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
      const { data: bookingData, error: bookingError } = await supabase
        .from("sports_bookings")
        .select(
          `
          id, total_amount, paid_amount,
          profiles ( full_name, phone, avatar_url ),
          sports_slots ( start_time, end_time, slot_date ),
          venues ( name, vertical )
        `,
        )
        .eq("id", bookingId)
        .single();

      if (bookingError) throw bookingError;
      setBooking(bookingData as any);

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

      // 2. Map "online" from the UI to "upi" for the database ENUM
      const dbPaymentMode = mode === "online" ? "upi" : mode;

      const { error } = await supabase.functions.invoke("log-offline-payment", {
        body: {
          bookingId: bookingId,
          vertical: "sports",
          amount: amount,
          mode: dbPaymentMode, // <-- Send the mapped value here
          loggedBy: userId,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (error) {
        let errorMessage = "Failed to log payment via Edge Function.";
        if (error instanceof Error) errorMessage = error.message;

        if (error.context && error.context.json) {
          try {
            const parsedError = await error.context.json();
            if (parsedError.error) errorMessage = parsedError.error;
          } catch (e) {}
        }
        throw new Error(errorMessage);
      }

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

  useEffect(() => {
    if (bookingId) fetchDetails();
  }, [bookingId, fetchDetails]);

  return { booking, paymentLogs, loading, isSaving, logPayment, refresh: fetchDetails };
};
