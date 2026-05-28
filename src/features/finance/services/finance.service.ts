// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import { supabase } from "@/lib/supabase";
import { PayoutStrategy } from "./strategies/payout.types";
import { SportsPayoutStrategy } from "./strategies/sports.payout.strategy";
import { StaycationPayoutStrategy } from "./strategies/staycation.payout.strategy";
import { EventPayoutStrategy } from "./strategies/event.payout.strategy";

type Vertical = "sports" | "staycation" | "event" | "events";

/**
 * Helper to fetch the vertical of a venue
 */
const getVenueVertical = async (venueId: string): Promise<Vertical | null> => {
  const { data, error } = await supabase
    .from("venues")
    .select("name, vertical")
    .eq("id", venueId)
    .single();

  if (error || !data) {
    console.error("[FinanceService] Vertical Check Error:", error);
    return null;
  }
  return data.vertical as Vertical;
};

/**
 * Strategy Selector
 */
const getStrategy = (vertical: Vertical): PayoutStrategy => {
  switch (vertical) {
    case "sports":
      return SportsPayoutStrategy;
    case "staycation":
      return StaycationPayoutStrategy;
    case "event":
    case "events":
      return EventPayoutStrategy;
    default:
      throw new Error(`Unsupported vertical: ${vertical}`);
  }
};

/**
 * Unified Finance Service - Modularized Orchestrator
 */
export const FinanceService = {
  /**
   * Fetches pending payouts for the past 2 days.
   */
  async getPendingPayouts(venueId: string) {
    const vertical = await getVenueVertical(venueId);
    if (!vertical) return [];

    const strategy = getStrategy(vertical);

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const dayBeforeYesterday = new Date(today);
    dayBeforeYesterday.setDate(today.getDate() - 2);

    const dates = [
      yesterday.toISOString().split("T")[0],
      dayBeforeYesterday.toISOString().split("T")[0],
    ];

    const rawData = await strategy.getPendingRawData(venueId, dates);
    const commRate = strategy.getCommissionRate();

    const aggregation: Record<string, { amount: number; count: number }> = {};
    dates.forEach(date => (aggregation[date] = { amount: 0, count: 0 }));

    rawData.forEach(b => {
      const actualPaid = b.paid_amount;
      const discount = b.discount_amount || 0;
      const collectionBase = actualPaid + discount; // GROSS COLLECTION (Paid + Discount)

      // SPORTS SPECIFIC: Determine gateway fee based on sports_type
      let gateRate = 0.02; // Default
      if (b.sports_type) {
        const type = b.sports_type.toLowerCase();
        if (type.includes("pickleball")) {
          gateRate = 0.015;
        }
      }

      // Commission is 3.5% of the Gross Collection (Option A)
      const commission = collectionBase * commRate;
      // Gateway fee is calculated on the actual amount paid online
      const gateway = actualPaid * gateRate;
      const payout = actualPaid - commission - gateway;

      aggregation[b.date].amount += payout;
      aggregation[b.date].count += 1;
    });

    return Object.entries(aggregation)
      .map(([date, stats]) => ({
        date,
        amount: Math.round(stats.amount),
        count: stats.count,
        displayDate: new Date(date).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        }),
      }))
      .sort((a, b) => b.date.localeCompare(a.date));
  },

  /**
   * Fetches historical payouts aggregated by the specified interval.
   */
  async getAggregatedPayouts(params: {
    venueId: string;
    startDate: string;
    endDate: string;
    interval: "day" | "week" | "month";
  }) {
    const vertical = await getVenueVertical(params.venueId);
    if (!vertical) return [];

    const strategy = getStrategy(vertical);
    const rpcName = strategy.getRpcName();

    const { data, error } = await supabase.rpc(rpcName, {
      p_venue_id: params.venueId,
      p_start_date: params.startDate,
      p_end_date: params.endDate,
      p_interval: params.interval,
    });

    if (error) throw error;
    return data;
  },

  /**
   * Fetches the detailed breakdown of payouts for a specific date range.
   */
  async getPayoutDetailsBreakdown(venueId: string, startDate: string, endDate: string) {
    const vertical = await getVenueVertical(venueId);
    if (!vertical) throw new Error("Venue not found or vertical unknown.");

    const strategy = getStrategy(vertical);
    const rawData = await strategy.getBreakdownRawData(venueId, startDate, endDate);
    const commRate = strategy.getCommissionRate();

    const summary = rawData.reduce(
      (acc, b) => {
        const isFull = b.payment_type === "full";
        const actualPaid = b.paid_amount;
        const discount = b.discount_amount || 0;
        const mainPrice = actualPaid + discount; // GROSS PRICE FOR PAID BREAKDOWN

        if (isFull) {
          acc.full.count += 1;
          acc.full.total += mainPrice;
        } else {
          acc.advance.count += 1;
          acc.advance.total += mainPrice;
        }

        // SPORTS SPECIFIC: Determine gateway fee based on sports_type
        let gateRate = 0.02; // Default
        if (b.sports_type) {
          const type = b.sports_type.toLowerCase();
          if (type.includes("pickleball")) {
            gateRate = 0.015;
          }
        }

        // Commission is 3.5% of Gross Collection (Paid + Discount)
        const bCommission = mainPrice * commRate;
        // Gateway fee is calculated on the actual amount paid through the gateway
        const bGateway = actualPaid * gateRate;

        acc.totalCommission += bCommission;
        acc.totalGateway += bGateway;
        acc.totalCashCollected += actualPaid;
        acc.totalGross += mainPrice;
        acc.count += 1;
        return acc;
      },
      {
        totalCashCollected: 0,
        totalGross: 0,
        totalCommission: 0,
        totalGateway: 0,
        count: 0,
        full: { count: 0, total: 0 },
        advance: { count: 0, total: 0 },
      },
    );

    const finalPayout = summary.totalCashCollected - summary.totalCommission - summary.totalGateway;

    return {
      count: summary.count,
      totalPaid: Math.round(summary.totalGross), // UI section title
      full: {
        count: summary.full.count,
        total: Math.round(summary.full.total),
      },
      advance: {
        count: summary.advance.count,
        total: Math.round(summary.advance.total),
      },
      commission: Math.round(summary.totalCommission),
      gateway: Math.round(summary.totalGateway),
      finalPayout: Math.round(finalPayout),
      commissionRate: `${commRate * 100}%`,
    };
  },
};
