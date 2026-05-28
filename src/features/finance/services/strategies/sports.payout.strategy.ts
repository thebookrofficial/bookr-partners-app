// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import { supabase } from "@/lib/supabase";
import { PayoutStrategy } from "./payout.types";

export const SportsPayoutStrategy: PayoutStrategy = {
  async getPendingRawData(venueId, dates) {
    // Fetch sports type separately to avoid join errors (no direct FK between bookings and sports_venues)
    const { data: venueInfo } = await supabase
      .from("sports_venues")
      .select("sports_type")
      .eq("venue_id", venueId)
      .maybeSingle();

    const sportsType = venueInfo?.sports_type;

    const { data, error } = await supabase
      .from("sports_bookings")
      .select(
        `id, paid_amount, total_amount, discount_amount, payment_type, booking_status, booking_group_id, parent_booking_id, sports_slots!inner(slot_date)`,
      )
      .eq("venue_id", venueId)
      .in("sports_slots.slot_date", dates)
      .eq("booking_source", "online")
      .not("booking_status", "in", '("cancelled","refunded")');

    if (error) throw error;

    return (data || []).map(b => ({
      id: b.id,
      paid_amount: Number(b.paid_amount || 0),
      total_amount: Number(b.total_amount || 0),
      discount_amount: Number(b.discount_amount || 0),
      payment_type: b.payment_type as "full" | "advance",
      date: (b.sports_slots as any).slot_date,
      sports_type: sportsType,
      booking_status: b.booking_status,
      booking_group_id: b.booking_group_id,
      parent_booking_id: b.parent_booking_id,
    }));
  },

  async getBreakdownRawData(venueId, startDate, endDate) {
    // Fetch sports type separately to avoid join errors
    const { data: venueInfo } = await supabase
      .from("sports_venues")
      .select("sports_type")
      .eq("venue_id", venueId)
      .maybeSingle();

    const sportsType = venueInfo?.sports_type;

    const { data, error } = await supabase
      .from("sports_bookings")
      .select(
        `id, paid_amount, total_amount, discount_amount, payment_type, booking_status, booking_group_id, parent_booking_id, sports_slots!inner(slot_date)`,
      )
      .eq("venue_id", venueId)
      .gte("sports_slots.slot_date", startDate)
      .lte("sports_slots.slot_date", endDate)
      .eq("booking_source", "online")
      .not("booking_status", "in", '("cancelled","refunded")');

    if (error) throw error;

    return (data || []).map(b => ({
      id: b.id,
      paid_amount: Number(b.paid_amount || 0),
      total_amount: Number(b.total_amount || 0),
      discount_amount: Number(b.discount_amount || 0),
      payment_type: b.payment_type as "full" | "advance",
      date: (b.sports_slots as any).slot_date,
      sports_type: sportsType,
      booking_status: b.booking_status,
      booking_group_id: b.booking_group_id,
      parent_booking_id: b.parent_booking_id,
    }));
  },

  async getExportRawData(venueId, startDate, endDate) {
    // Fetch sports type separately
    const { data: venueInfo } = await supabase
      .from("sports_venues")
      .select("sports_type")
      .eq("venue_id", venueId)
      .maybeSingle();

    const sportsType = venueInfo?.sports_type;

    const { data, error } = await supabase
      .from("sports_bookings")
      .select(
        `
        id, paid_amount, total_amount, discount_amount, payment_type, booking_status, booking_group_id, parent_booking_id,
        guest_name, guest_phone,
        profiles ( full_name, phone ),
        sports_slots!inner(slot_date, start_time, end_time)
        `,
      )
      .eq("venue_id", venueId)
      .gte("sports_slots.slot_date", startDate)
      .lte("sports_slots.slot_date", endDate)
      .eq("booking_source", "online")
      .not("booking_status", "in", '("cancelled","refunded")');

    if (error) throw error;

    return (data || []).map((b: any) => {
      const slot = Array.isArray(b.sports_slots) ? b.sports_slots[0] : b.sports_slots;
      const profile = Array.isArray(b.profiles) ? b.profiles[0] : b.profiles;

      return {
        id: b.id,
        paid_amount: Number(b.paid_amount || 0),
        total_amount: Number(b.total_amount || 0),
        discount_amount: Number(b.discount_amount || 0),
        payment_type: b.payment_type as "full" | "advance",
        date: slot?.slot_date,
        start_time: slot?.start_time,
        end_time: slot?.end_time,
        user_name: b.guest_name || profile?.full_name || "Guest",
        user_phone: b.guest_phone || profile?.phone || "N/A",
        sports_type: sportsType,
        booking_status: b.booking_status,
        booking_group_id: b.booking_group_id,
        parent_booking_id: b.parent_booking_id,
      };
    });
  },

  getRpcName() {
    return "get_venue_payouts";
  },

  getCommissionRate() {
    return 0.035;
  },
};
