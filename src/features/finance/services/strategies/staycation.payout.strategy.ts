// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import { supabase } from "@/lib/supabase";
import { PayoutStrategy } from "./payout.types";

export const StaycationPayoutStrategy: PayoutStrategy = {
  async getPendingRawData(venueId, dates) {
    const { data, error } = await supabase
      .from("staycation_bookings")
      .select(
        `id, paid_amount, total_amount, discount_amount, payment_type, booking_status, check_in_date`,
      )
      .eq("venue_id", venueId)
      .in("check_in_date", dates)
      .eq("booking_source", "online")
      .not("booking_status", "in", '("cancelled","refunded")');

    if (error) throw error;

    return (data || []).map(b => ({
      id: b.id,
      paid_amount: Number(b.paid_amount || 0),
      total_amount: Number(b.total_amount || 0),
      discount_amount: Number(b.discount_amount || 0),
      payment_type: b.payment_type as "full" | "advance",
      date: b.check_in_date,
      booking_status: b.booking_status,
    }));
  },

  async getBreakdownRawData(venueId, startDate, endDate) {
    const { data, error } = await supabase
      .from("staycation_bookings")
      .select(
        `id, paid_amount, total_amount, discount_amount, payment_type, booking_status, check_in_date`,
      )
      .eq("venue_id", venueId)
      .gte("check_in_date", startDate)
      .lte("check_in_date", endDate)
      .eq("booking_source", "online")
      .not("booking_status", "in", '("cancelled","refunded")');

    if (error) throw error;

    return (data || []).map(b => ({
      id: b.id,
      paid_amount: Number(b.paid_amount || 0),
      total_amount: Number(b.total_amount || 0),
      discount_amount: Number(b.discount_amount || 0),
      payment_type: b.payment_type as "full" | "advance",
      date: b.check_in_date,
      booking_status: b.booking_status,
    }));
  },

  getRpcName() {
    return "get_staycation_payouts";
  },

  getCommissionRate() {
    return 0.05;
  },
};
