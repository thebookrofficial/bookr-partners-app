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
 * Helper to get YYYY-MM-DD in local timezone
 */
const getLocalISODate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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

    const dates = [getLocalISODate(yesterday), getLocalISODate(dayBeforeYesterday)];

    const rawData = await strategy.getPendingRawData(venueId, dates);
    const commRate = strategy.getCommissionRate();

    const aggregation: Record<string, { amount: number; count: number }> = {};
    dates.forEach(date => (aggregation[date] = { amount: 0, count: 0 }));

    // Grouping logic to match RPC aggregation (merge multi-slots and extensions)
    const groupedBookings: Record<string, any> = {};

    rawData.forEach(b => {
      // Filter: Only confirmed or completed bookings
      const status = (b.booking_status || "").toLowerCase().trim();
      if (status !== "confirmed" && status !== "completed") return;

      const groupKey = b.booking_group_id || b.parent_booking_id || b.id;

      if (!groupedBookings[groupKey]) {
        groupedBookings[groupKey] = { ...b, merged_count: 1 };
      } else {
        // Merge amounts for the same group
        groupedBookings[groupKey].paid_amount += b.paid_amount;
        groupedBookings[groupKey].subtotal =
          (groupedBookings[groupKey].subtotal || 0) + (b.subtotal || 0);
        groupedBookings[groupKey].platform_fee =
          (groupedBookings[groupKey].platform_fee || 0) + (b.platform_fee || 0);
        groupedBookings[groupKey].total_amount += b.total_amount;
        groupedBookings[groupKey].discount_amount =
          (groupedBookings[groupKey].discount_amount || 0) + (b.discount_amount || 0);
        groupedBookings[groupKey].merged_count += 1;
        groupedBookings[groupKey].unit_count =
          (groupedBookings[groupKey].unit_count || 0) + (b.unit_count || 1);
      }
    });

    Object.values(groupedBookings).forEach((b: any) => {
      // Use subtotal (what user paid online) as the base for payout
      const actualPaid = b.subtotal || b.paid_amount;
      const totalAmount = b.total_amount;

      // Determine gateway fee base and rate
      let gateRate = 0.02; // Default
      let gatewayBase = actualPaid;

      if (vertical === "sports" && b.sports_type) {
        if (b.sports_type.toLowerCase().includes("pickleball")) {
          gateRate = 0.015;
        }
      } else if (vertical === "staycation") {
        gatewayBase = totalAmount;
      }

      // Commission is % of the TOTAL PRICE (including merged slots)
      const commission = totalAmount * commRate;

      // Gateway fee
      const gateway = gatewayBase * gateRate;
      const payout = actualPaid - commission - gateway;

      aggregation[b.date].amount += payout;
      aggregation[b.date].count += vertical === "staycation" ? b.unit_count || 1 : 1;
    });

    return Object.entries(aggregation)
      .map(([date, stats]) => ({
        date,
        amount: Number(stats.amount.toFixed(2)),
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
    // Note: RPC returns aggregated data, usually rounded at DB level or floats.
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

    // Grouping logic to match RPC aggregation (merge multi-slots and extensions)
    const groupedBookings: Record<string, any> = {};

    rawData.forEach(b => {
      // Filter: Only confirmed or completed bookings
      const status = (b.booking_status || "").toLowerCase().trim();
      if (status !== "confirmed" && status !== "completed") return;

      const groupKey = b.booking_group_id || b.parent_booking_id || b.id;

      if (!groupedBookings[groupKey]) {
        groupedBookings[groupKey] = { ...b, merged_count: 1 };
      } else {
        // Merge amounts for the same group
        groupedBookings[groupKey].paid_amount += b.paid_amount;
        groupedBookings[groupKey].subtotal =
          (groupedBookings[groupKey].subtotal || 0) + (b.subtotal || 0);
        groupedBookings[groupKey].platform_fee =
          (groupedBookings[groupKey].platform_fee || 0) + (b.platform_fee || 0);
        groupedBookings[groupKey].total_amount += b.total_amount;
        groupedBookings[groupKey].discount_amount =
          (groupedBookings[groupKey].discount_amount || 0) + (b.discount_amount || 0);
        groupedBookings[groupKey].merged_count += 1;
        groupedBookings[groupKey].unit_count =
          (groupedBookings[groupKey].unit_count || 0) + (b.unit_count || 1);
      }
    });

    const summary = Object.values(groupedBookings).reduce(
      (acc, b: any) => {
        const isFull = b.payment_type === "full";
        // Use subtotal (what user paid online) as the base for payout
        const actualPaid = b.subtotal || b.paid_amount;
        const totalAmount = b.total_amount;

        const bCount = vertical === "staycation" ? b.unit_count || 1 : 1;

        if (isFull) {
          acc.full.count += bCount;
          acc.full.total += actualPaid;
        } else {
          acc.advance.count += bCount;
          acc.advance.total += actualPaid;
        }

        // Determine gateway fee base and rate
        let gateRate = 0.02; // Default
        let gatewayBase = actualPaid;

        if (vertical === "sports" && b.sports_type) {
          if (b.sports_type.toLowerCase().includes("pickleball")) {
            gateRate = 0.015;
          }
        } else if (vertical === "staycation") {
          gatewayBase = totalAmount;
        }

        // Commission is % of unit price, once per transaction group
        const bCommission = (totalAmount / (b.merged_count || 1)) * commRate;

        // Gateway fee is calculated on the actual amount paid through the gateway (or gross if staycation)
        const bGateway = gatewayBase * gateRate;

        acc.totalCommission += bCommission;
        acc.totalGateway += bGateway;
        acc.totalCashCollected += actualPaid;
        acc.totalGross += totalAmount;
        acc.count += bCount;
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
      totalPaid: Number(summary.totalCashCollected.toFixed(2)), // UI section title: show what was collected online
      full: {
        count: summary.full.count,
        total: Number(summary.full.total.toFixed(2)),
      },
      advance: {
        count: summary.advance.count,
        total: Number(summary.advance.total.toFixed(2)),
      },
      commission: Number(summary.totalCommission.toFixed(2)),
      gateway: Number(summary.totalGateway.toFixed(2)),
      finalPayout: Number(finalPayout.toFixed(2)),
      commissionRate: `${commRate * 100}%`,
    };
  },

  /**
   * Generates formatted data for Excel export.
   */
  async exportPayouts(venueId: string, startDate: string, endDate: string) {
    const vertical = await getVenueVertical(venueId);
    if (!vertical) throw new Error("Venue not found.");

    const strategy = getStrategy(vertical);
    const rawData = await strategy.getExportRawData(venueId, startDate, endDate);
    const commRate = strategy.getCommissionRate();

    const groupedBookings: Record<string, any> = {};

    rawData.forEach(b => {
      const status = (b.booking_status || "").toLowerCase().trim();
      if (status !== "confirmed" && status !== "completed") return;

      const groupKey = b.booking_group_id || b.parent_booking_id || b.id;

      if (!groupedBookings[groupKey]) {
        groupedBookings[groupKey] = { ...b, merged_count: 1 };
      } else {
        groupedBookings[groupKey].paid_amount += b.paid_amount;
        groupedBookings[groupKey].subtotal =
          (groupedBookings[groupKey].subtotal || 0) + (b.subtotal || 0);
        groupedBookings[groupKey].total_amount += b.total_amount;
        groupedBookings[groupKey].merged_count += 1;
      }
    });

    const rows = Object.values(groupedBookings).map((b: any) => {
      let gateRate = 0.02;
      // Use subtotal (what user paid online) as the base for payout
      const actualPaid = b.subtotal || b.paid_amount;
      let gatewayBase = actualPaid;

      if (vertical === "sports" && b.sports_type) {
        if (b.sports_type.toLowerCase().includes("pickleball")) {
          gateRate = 0.015;
        }
      } else if (vertical === "staycation") {
        gatewayBase = b.total_amount;
      }

      // Commission per transaction (unit price)
      const commission = (b.total_amount / (b.merged_count || 1)) * commRate;
      const gateway = gatewayBase * gateRate;

      return {
        "Booking Date": b.date,
        "Start Time": b.start_time || "N/A",
        "End Time": b.end_time || "N/A",
        "User Name": b.user_name || "Guest",
        "User Phone": b.user_phone || "N/A",
        "Total Amount": Number(b.total_amount.toFixed(2)),
        "Paid Amount": Number(actualPaid.toFixed(2)),
        "Bookr Commission": Number(commission.toFixed(2)),
        "Handling Fee": Number(gateway.toFixed(2)),
        "Est. Payout": Number((actualPaid - commission - gateway).toFixed(2)),
      };
    });

    // Calculate totals for summary row
    const totals = rows.reduce(
      (acc, row) => {
        acc.totalAmount += row["Total Amount"];
        acc.paidAmount += row["Paid Amount"];
        acc.commission += row["Bookr Commission"];
        acc.handling += row["Handling Fee"];
        acc.payout += row["Est. Payout"];
        acc.totalBookings += 1;
        return acc;
      },
      { totalAmount: 0, paidAmount: 0, commission: 0, handling: 0, payout: 0, totalBookings: 0 },
    );

    // Add empty row for spacing
    rows.push({} as any);

    // Add summary row
    rows.push({
      "Booking Date": "TOTAL",
      "Start Time": `Count: ${totals.totalBookings}`,
      "End Time": "",
      "User Name": "",
      "User Phone": "",
      "Total Amount": Number(totals.totalAmount.toFixed(2)),
      "Paid Amount": Number(totals.paidAmount.toFixed(2)),
      "Bookr Commission": Number(totals.commission.toFixed(2)),
      "Handling Fee": Number(totals.handling.toFixed(2)),
      "Est. Payout": Number(totals.payout.toFixed(2)),
    } as any);

    return rows;
  },

  /**
   * Generates a presentable PDF via Supabase Edge Function.
   */
  async exportPayoutsPdf(venueName: string, venueId: string, startDate: string, endDate: string) {
    const data = await this.exportPayouts(venueId, startDate, endDate);
    if (data.length <= 2) {
      return null;
    }

    const { data: blob, error } = await supabase.functions.invoke("export-payout-pdf", {
      body: {
        venueName,
        startDate,
        endDate,
        data,
      },
    });

    if (error) throw error;
    return blob;
  },
};
