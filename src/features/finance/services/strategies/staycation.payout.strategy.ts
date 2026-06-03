// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import { supabase } from "@/lib/supabase";
import { PayoutStrategy } from "./payout.types";

export const StaycationPayoutStrategy: PayoutStrategy = {
  async getPendingRawData(venueId, dates) {
    const { data, error } = await supabase
      .from("staycation_bookings")
      .select(
        `id, paid_amount, subtotal, platform_fee, total_amount, discount_amount, payment_type, booking_status, check_in_date, check_out_date, unit_count`,
      )
      .eq("venue_id", venueId)
      .in("check_in_date", dates)
      .eq("booking_source", "online")
      .not("booking_status", "in", '("cancelled","refunded")');

    if (error) throw error;

    return (data || []).map(b => ({
      id: b.id,
      paid_amount: Number(b.paid_amount || 0),
      subtotal: Number(b.subtotal || 0),
      platform_fee: Number(b.platform_fee || 0),
      total_amount: Number(b.total_amount || 0),
      discount_amount: Number(b.discount_amount || 0),
      unit_count: Number(b.unit_count || 1),
      payment_type: b.payment_type as "full" | "advance",
      date: b.check_in_date,
      check_out_date: b.check_out_date,
      booking_status: b.booking_status,
    }));
  },

  async getBreakdownRawData(venueId, startDate, endDate) {
    const { data, error } = await supabase
      .from("staycation_bookings")
      .select(
        `id, paid_amount, subtotal, platform_fee, total_amount, discount_amount, payment_type, booking_status, check_in_date, check_out_date, unit_count`,
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
      subtotal: Number(b.subtotal || 0),
      platform_fee: Number(b.platform_fee || 0),
      total_amount: Number(b.total_amount || 0),
      discount_amount: Number(b.discount_amount || 0),
      unit_count: Number(b.unit_count || 1),
      payment_type: b.payment_type as "full" | "advance",
      date: b.check_in_date,
      check_out_date: b.check_out_date,
      booking_status: b.booking_status,
    }));
  },

  async getExportRawData(venueId, startDate, endDate) {
    // Stub implementation for staycation
    const raw = await this.getBreakdownRawData(venueId, startDate, endDate);
    return raw.map(b => ({
      ...b,
      start_time: "N/A",
      end_time: "N/A",
      user_name: "Guest",
      user_phone: "N/A",
    }));
  },

  getRpcName() {
    return "get_staycation_payouts";
  },

  getCommissionRate() {
    return 0.05;
  },
};
