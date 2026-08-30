// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import { supabase } from "@/lib/supabase";
import { PayoutStrategy } from "./payout.types";

const SPORTS_BOOKING_SELECT = `
  id,
  paid_amount,
  subtotal,
  platform_fee,
  total_amount,
  discount_amount,
  payment_type,
  booking_status,
  booking_group_id,
  parent_booking_id,
  sports_slots!inner(
    slot_date,
    start_time,
    end_time,
    ground_id,
    sports_grounds(
      sports_type,
      commission_percentage,
      gateway_percentage
    )
  )
`;

const mapSportsBooking = (b: any) => {
  const slot = Array.isArray(b.sports_slots) ? b.sports_slots[0] : b.sports_slots;

  const ground = Array.isArray(slot?.sports_grounds)
    ? slot.sports_grounds[0]
    : slot?.sports_grounds;

  return {
    id: b.id,
    paid_amount: Number(b.paid_amount || 0),
    subtotal: Number(b.subtotal || 0),
    platform_fee: Number(b.platform_fee || 0),
    total_amount: Number(b.total_amount || 0),
    discount_amount: Number(b.discount_amount || 0),
    payment_type: b.payment_type as "full" | "advance",
    date: slot?.slot_date,
    start_time: slot?.start_time,
    end_time: slot?.end_time,
    sports_type: ground?.sports_type,
    commission_percentage: Number(ground?.commission_percentage ?? 3.5),
    gateway_percentage: Number(ground?.gateway_percentage ?? 2),
    booking_status: b.booking_status,
    booking_group_id: b.booking_group_id,
    parent_booking_id: b.parent_booking_id,
  };
};

export const SportsPayoutStrategy: PayoutStrategy = {
  async getPendingRawData(venueId, dates) {
    const { data, error } = await supabase
      .from("sports_bookings")
      .select(SPORTS_BOOKING_SELECT)
      .eq("venue_id", venueId)
      .in("sports_slots.slot_date", dates)
      .eq("booking_source", "online")
      .not("booking_status", "in", '("cancelled","refunded")');

    if (error) throw error;

    return (data || []).map(mapSportsBooking);
  },

  async getBreakdownRawData(venueId, startDate, endDate) {
    const { data, error } = await supabase
      .from("sports_bookings")
      .select(SPORTS_BOOKING_SELECT)
      .eq("venue_id", venueId)
      .gte("sports_slots.slot_date", startDate)
      .lte("sports_slots.slot_date", endDate)
      .eq("booking_source", "online")
      .not("booking_status", "in", '("cancelled","refunded")');

    if (error) throw error;

    return (data || []).map(mapSportsBooking);
  },

  async getExportRawData(venueId, startDate, endDate) {
    const { data, error } = await supabase
      .from("sports_bookings")
      .select(
        `
        id,
        paid_amount,
        subtotal,
        platform_fee,
        total_amount,
        discount_amount,
        payment_type,
        booking_status,
        booking_group_id,
        parent_booking_id,
        guest_name,
        guest_phone,
        profiles (
          full_name,
          phone
        ),
        sports_slots!inner(
          slot_date,
          start_time,
          end_time,
          ground_id,
          sports_grounds(
            sports_type,
            commission_percentage,
            gateway_percentage
          )
        )
        `,
      )
      .eq("venue_id", venueId)
      .gte("sports_slots.slot_date", startDate)
      .lte("sports_slots.slot_date", endDate)
      .eq("booking_source", "online")
      .not("booking_status", "in", '("cancelled","refunded")');

    if (error) throw error;

    return (data || []).map((b: any) => {
      const mapped = mapSportsBooking(b);

      const profile = Array.isArray(b.profiles) ? b.profiles[0] : b.profiles;

      return {
        ...mapped,
        user_name: b.guest_name || profile?.full_name || "Guest",
        user_phone: b.guest_phone || profile?.phone || "N/A",
      };
    });
  },

  getRpcName() {
    return "get_venue_payouts";
  },

  // Kept for interface compatibility.
  // Actual sports commission is now booking/ground-specific.
  getCommissionRate() {
    return 0.035;
  },
};
