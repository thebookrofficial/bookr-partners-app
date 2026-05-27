// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export const useSportsInvoice = (bookingId: string) => {
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase
          .from("sports_bookings")
          .select(
            `
            id,
            guest_name,
            guest_phone,
            paid_amount,
            total_amount,
            discount_amount,
            subtotal,
            platform_fee,
            gateway_fee,
            vendor_payout,
            booking_status,
            profiles (
              full_name,
              phone,
              avatar_url
            ),
            sports_slots (
              slot_date,
              start_time,
              end_time
            ),
            venues (
              name
            )
          `,
          )
          .eq("id", bookingId)
          .single();

        if (fetchError) throw fetchError;
        setBooking(data);
      } catch (err: any) {
        console.error("Error fetching booking invoice:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (bookingId) {
      fetchBooking();
    }
  }, [bookingId]);

  return { loading, booking, error };
};
