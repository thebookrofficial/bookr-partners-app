// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import { supabase } from "@/lib/supabase";
import { PayoutStrategy } from "./payout.types";

export const EventPayoutStrategy: PayoutStrategy = {
  async getPendingRawData(venueId, dates) {
    const { data, error } = await supabase
      .from("event_bookings")
      .select(`id, paid_amount, discount_amount, payment_type, created_at, events!inner(venue_id)`)
      .eq("events.venue_id", venueId)
      .eq("booking_source", "online")
      .in("booking_status", ["confirmed", "completed"]);

    if (error) throw error;

    return (data || [])
      .filter(b => dates.includes(b.created_at.split("T")[0]))
      .map(b => ({
        id: b.id,
        paid_amount: Number(b.paid_amount || 0),
        discount_amount: Number(b.discount_amount || 0),
        payment_type: b.payment_type as "full" | "advance",
        date: b.created_at.split("T")[0],
      }));
  },

  async getBreakdownRawData(venueId, startDate, endDate) {
    const { data, error } = await supabase
      .from("event_bookings")
      .select(`id, paid_amount, discount_amount, payment_type, created_at, events!inner(venue_id)`)
      .eq("events.venue_id", venueId)
      .gte("created_at", `${startDate}T00:00:00`)
      .lte("created_at", `${endDate}T23:59:59`)
      .eq("booking_source", "online")
      .in("booking_status", ["confirmed", "completed"]);

    if (error) throw error;

    return (data || []).map(b => ({
      id: b.id,
      paid_amount: Number(b.paid_amount || 0),
      discount_amount: Number(b.discount_amount || 0),
      payment_type: b.payment_type as "full" | "advance",
      date: b.created_at.split("T")[0],
    }));
  },

  getRpcName() {
    return "get_event_payouts";
  },

  getCommissionRate() {
    return 0.05;
  },
};
