// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import { supabase } from "@/lib/supabase";
import { PayoutStrategy } from "./payout.types";

export const SportsPayoutStrategy: PayoutStrategy = {
  async getPendingRawData(venueId, dates) {
    const { data, error } = await supabase
      .from("sports_bookings")
      .select(`id, paid_amount, discount_amount, payment_type, sports_slots!inner(slot_date)`)
      .eq("venue_id", venueId)
      .in("sports_slots.slot_date", dates)
      .eq("booking_source", "online")
      .not("booking_status", "in", '("cancelled","refunded")');

    if (error) throw error;

    return (data || []).map(b => ({
      id: b.id,
      paid_amount: Number(b.paid_amount || 0),
      discount_amount: Number(b.discount_amount || 0),
      payment_type: b.payment_type as "full" | "advance",
      date: (b.sports_slots as any).slot_date,
    }));
  },

  async getBreakdownRawData(venueId, startDate, endDate) {
    const { data, error } = await supabase
      .from("sports_bookings")
      .select(`id, paid_amount, discount_amount, payment_type, sports_slots!inner(slot_date)`)
      .eq("venue_id", venueId)
      .gte("sports_slots.slot_date", startDate)
      .lte("sports_slots.slot_date", endDate)
      .eq("booking_source", "online")
      .not("booking_status", "in", '("cancelled","refunded")');

    if (error) throw error;

    return (data || []).map(b => ({
      id: b.id,
      paid_amount: Number(b.paid_amount || 0),
      discount_amount: Number(b.discount_amount || 0),
      payment_type: b.payment_type as "full" | "advance",
      date: (b.sports_slots as any).slot_date,
    }));
  },

  getRpcName() {
    return "get_venue_payouts";
  },

  getCommissionRate() {
    return 0.035;
  },
};
