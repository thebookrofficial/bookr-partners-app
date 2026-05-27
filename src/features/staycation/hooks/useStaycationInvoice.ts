// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export const useStaycationInvoice = (bookingId: string) => {
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase
          .from("staycation_bookings")
          .select(
            `
            id,
            user_id,
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
            check_in_date,
            check_out_date,
            guest_count,
            unit_count,
            profiles (
              full_name,
              phone,
              avatar_url
            ),
            venues (
              name
            ),
            staycation_rooms (
              room_name
            )
          `,
          )
          .eq("id", bookingId)
          .single();

        if (fetchError) throw fetchError;
        setBooking(data);
      } catch (err: any) {
        console.error("Error fetching staycation invoice:", err);
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
