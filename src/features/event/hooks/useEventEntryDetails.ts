// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export interface EventEntryDetails {
  id: string;
  name: string;
  phone: string;
  passType: string;
  entryDate: string;
  entryTime: string;
  avatarUrl?: string;
  paymentMethod: string;
  transactionId: string;
  transactionDate: string;
  transactionTime: string;
}

export const useEventEntryDetails = (bookingId: string) => {
  const [data, setData] = useState<EventEntryDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetails = useCallback(async () => {
    if (!bookingId) {
      console.warn("DEBUG: No bookingId provided. Aborting fetch.");
      setLoading(false);
      setError("No booking ID provided.");
      return;
    }

    try {
      setLoading(true);

      // 1. Fetch Booking Details
      const { data: booking, error: bookingErr } = await supabase
        .from("event_bookings")
        .select(
          `
          id, ticket_count, guest_name, guest_phone, updated_at,
          profiles (full_name, phone, avatar_url),
          event_passes (name),
          event_zones (zone_name)
        `,
        )
        .eq("id", bookingId)
        .single();

      if (bookingErr) {
        console.error("DEBUG: Error fetching event_bookings:", bookingErr);
        throw bookingErr;
      }

      // 2. Fetch Payment Details
      const { data: payment, error: paymentErr } = await supabase
        .from("payments")
        .select("payment_method, razorpay_payment_id, created_at")
        .eq("booking_id", bookingId)
        .maybeSingle();

      if (paymentErr) {
        console.error("DEBUG: Error fetching payments:", paymentErr);
        // We won't throw here, payments might be legitimately missing for some test data
      }

      // Format Data
      const profile = Array.isArray(booking.profiles) ? booking.profiles[0] : booking.profiles;
      const pass = Array.isArray(booking.event_passes)
        ? booking.event_passes[0]
        : booking.event_passes;
      const zone = Array.isArray(booking.event_zones)
        ? booking.event_zones[0]
        : booking.event_zones;

      const catName = pass?.name || zone?.zone_name || "General";
      const entryDateObj = new Date(booking.updated_at);
      const paymentDateObj = payment?.created_at ? new Date(payment.created_at) : new Date();

      const formattedData = {
        id: booking.id,
        name: booking.guest_name || profile?.full_name || "Guest",
        phone: booking.guest_phone || profile?.phone || "N/A",
        passType: `${catName} x ${booking.ticket_count}`,
        avatarUrl: profile?.avatar_url,

        entryDate: entryDateObj.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "2-digit",
        }),
        entryTime: entryDateObj
          .toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: true })
          .toUpperCase(),

        paymentMethod: payment?.payment_method?.toUpperCase() || "OFFLINE/CASH",
        transactionId:
          payment?.razorpay_payment_id || `OFF-${booking.id.split("-")[0].toUpperCase()}`,
        transactionDate: paymentDateObj.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }),
        transactionTime: paymentDateObj.toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
      };

      setData(formattedData);
    } catch (err: any) {
      console.error("=== DEBUG: FATAL ERROR IN fetchDetails ===", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  return { data, loading, error };
};
