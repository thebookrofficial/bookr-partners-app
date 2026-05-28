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
        `id, paid_amount, total_amount, discount_amount, payment_type, sports_slots!inner(slot_date)`,
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
        `id, paid_amount, total_amount, discount_amount, payment_type, sports_slots!inner(slot_date)`,
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
    }));
  },

  getRpcName() {
    return "get_venue_payouts";
  },

  getCommissionRate() {
    return 0.035;
  },
};
