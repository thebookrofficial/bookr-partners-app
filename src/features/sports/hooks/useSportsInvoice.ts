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

        // Fetch the primary booking first to check for groups/parents.
        const { data: baseBooking, error: baseError } = await supabase
          .from("sports_bookings")
          .select("id, booking_group_id, parent_booking_id")
          .eq("id", bookingId)
          .single();

        if (baseError) throw baseError;

        const parentId = baseBooking.parent_booking_id || baseBooking.id;

        let query = supabase.from("sports_bookings").select(`
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
          booking_source,
          payment_type,
          sports_booking_type,
          sport_category,
          venue_id,
          booking_group_id,
          parent_booking_id,
          profiles (
            full_name,
            phone,
            avatar_url
          ),
          sports_slots (
            slot_date,
            start_time,
            end_time,
            ground_id,
            sports_grounds (
              id,
              name,
              commission_percentage,
              gateway_percentage
            )
          ),
          venues (
            name,
            sports_venues (
              sports_type
            )
          )
        `);

        // Fetch all related bookings if it is part of a group or extension chain.
        if (baseBooking.booking_group_id) {
          query = query.eq("booking_group_id", baseBooking.booking_group_id);
        } else if (baseBooking.parent_booking_id) {
          query = query.or(`id.eq.${parentId},parent_booking_id.eq.${parentId}`);
        } else {
          // Check if this is a parent with children.
          const { data: children, error: childrenError } = await supabase
            .from("sports_bookings")
            .select("id")
            .eq("parent_booking_id", baseBooking.id)
            .limit(1);

          if (childrenError) throw childrenError;

          if (children && children.length > 0) {
            query = query.or(`id.eq.${baseBooking.id},parent_booking_id.eq.${baseBooking.id}`);
          } else {
            query = query.eq("id", bookingId);
          }
        }

        const { data: bookings, error: fetchError } = await query.order("created_at", {
          ascending: true,
        });

        if (fetchError) throw fetchError;

        if (!bookings || bookings.length === 0) {
          throw new Error("Booking not found");
        }

        /**
         * Normalize the Supabase nested relation.
         */
        const getSlot = (booking: any) =>
          Array.isArray(booking.sports_slots) ? booking.sports_slots[0] : booking.sports_slots;

        const getGround = (booking: any) => {
          const slot = getSlot(booking);

          return Array.isArray(slot?.sports_grounds)
            ? slot.sports_grounds[0]
            : slot?.sports_grounds;
        };

        /**
         * Aggregate data if multiple bookings were returned.
         *
         * Fee percentages are taken from the booked ground.
         * For grouped bookings, the first booking's configured rates
         * are retained as the display configuration.
         */
        if (bookings.length > 1) {
          const first = bookings[0];
          const firstGround = getGround(first);

          const aggregated = {
            ...first,

            paid_amount: bookings.reduce((sum, b) => sum + (Number(b.paid_amount) || 0), 0),

            total_amount: bookings.reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0),

            subtotal: bookings.reduce((sum, b) => sum + (Number(b.subtotal) || 0), 0),

            platform_fee: bookings.reduce((sum, b) => sum + (Number(b.platform_fee) || 0), 0),

            gateway_fee: bookings.reduce((sum, b) => sum + (Number(b.gateway_fee) || 0), 0),

            vendor_payout: bookings.reduce((sum, b) => sum + (Number(b.vendor_payout) || 0), 0),

            discount_amount: bookings.reduce((sum, b) => sum + (Number(b.discount_amount) || 0), 0),

            // Configured rates from the booked ground.
            commission_percentage: Number(firstGround?.commission_percentage ?? 3.5),

            gateway_percentage: Number(firstGround?.gateway_percentage ?? 2),

            ground_name: firstGround?.name || "Ground",

            // Combine all slots.
            all_slots: bookings
              .map(b => getSlot(b))
              .filter(Boolean)
              .sort((a: any, b: any) => String(a.start_time).localeCompare(String(b.start_time))),
          };

          setBooking(aggregated);
        } else {
          const first = bookings[0];
          const firstSlot = getSlot(first);
          const firstGround = getGround(first);

          setBooking({
            ...first,

            commission_percentage: Number(firstGround?.commission_percentage ?? 3.5),

            gateway_percentage: Number(firstGround?.gateway_percentage ?? 2),

            ground_name: firstGround?.name || "Ground",

            all_slots: firstSlot ? [firstSlot] : [],
          });
        }
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
