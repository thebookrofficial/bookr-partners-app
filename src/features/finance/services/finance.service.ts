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
   * Calculates the vendor payout for a single booking.
   *
   * Staycation online payout:
   * - In-app payment = subtotal
   * - Bookr commission = 5% of total_amount
   * - Gateway charge = 2% of subtotal
   * - Final payout = subtotal - commission - gateway charge
   *
   * This keeps payout calculations consistent with the Staycation
   * Dashboard and Staycation Invoice calculations.
   */
  _calculateBookingPayout(b: any, vertical: Vertical, commRate: number) {
    const totalAmount = Number(b.total_amount || 0);
    const subtotal = Number(b.subtotal || 0);
    const paidAmount = Number(b.paid_amount || 0);
    const discount = Number(b.discount_amount || 0);

    let actualPaid = paidAmount;
    let revenueBase = paidAmount;
    let gatewayBase = paidAmount;

    let commissionRate = commRate;
    let gatewayRate = 0.02;

    if (vertical === "sports" || vertical === "staycation") {
      actualPaid = subtotal;
      revenueBase = subtotal;
      gatewayBase = subtotal;
    } else {
      revenueBase = actualPaid + discount;
      gatewayBase = actualPaid;
    }

    // Use database-configured rates for sports.
    if (vertical === "sports") {
      commissionRate = Number(b.commission_percentage ?? 3.5) / 100;

      gatewayRate = Number(b.gateway_percentage ?? 2) / 100;
    }

    // Use database-configured rates for staycation.
    if (vertical === "staycation") {
      commissionRate = Number(b.commission_percentage ?? 5) / 100;

      gatewayRate = Number(b.gateway_percentage ?? 2) / 100;
    }

    const commission = totalAmount * commissionRate;
    const gateway = gatewayBase * gatewayRate;

    const payout = revenueBase - commission - gateway;

    return {
      payout: Number(payout.toFixed(2)),
      actualPaid: Number(actualPaid.toFixed(2)),
      discount: Number(discount.toFixed(2)),
      revenueBase: Number(revenueBase.toFixed(2)),
      totalAmount: Number(totalAmount.toFixed(2)),
      commission: Number(commission.toFixed(2)),
      gateway: Number(gateway.toFixed(2)),
    };
  },

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
      const status = (b.booking_status || "").toLowerCase().trim();
      if (status !== "confirmed" && status !== "completed") return;

      const groupKey = b.booking_group_id || b.parent_booking_id || b.id;

      if (!groupedBookings[groupKey]) {
        groupedBookings[groupKey] = { ...b, merged_count: 1 };
      } else {
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
      const { payout } = this._calculateBookingPayout(b, vertical, commRate);
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
   *
   * Period behavior:
   * - day: one payout entry per calendar date.
   * - week: one payout entry per Monday-Sunday week.
   * - month: one payout entry per calendar month.
   * - custom range: the caller passes interval="day", so the selected
   *   startDate/endDate are returned day-wise.
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
    const commRate = strategy.getCommissionRate();

    const rawData = await strategy.getBreakdownRawData(
      params.venueId,
      params.startDate,
      params.endDate,
    );

    /**
     * Merge rows belonging to the same logical booking.
     *
     * booking_group_id represents multi-slot/bulk bookings.
     * A booking without a group remains identified by its own id.
     */
    const groupedBookings: Record<string, any> = {};

    rawData.forEach(b => {
      const status = (b.booking_status || "").toLowerCase().trim();

      if (status !== "confirmed" && status !== "completed") {
        return;
      }

      const groupKey = b.booking_group_id || b.id;

      if (!groupedBookings[groupKey]) {
        groupedBookings[groupKey] = {
          ...b,
          paid_amount: Number(b.paid_amount || 0),
          subtotal: Number(b.subtotal || 0),
          total_amount: Number(b.total_amount || 0),
          discount_amount: Number(b.discount_amount || 0),
          merged_count: 1,
        };
        return;
      }

      groupedBookings[groupKey].paid_amount += Number(b.paid_amount || 0);
      groupedBookings[groupKey].subtotal += Number(b.subtotal || 0);
      groupedBookings[groupKey].total_amount += Number(b.total_amount || 0);
      groupedBookings[groupKey].discount_amount += Number(b.discount_amount || 0);
      groupedBookings[groupKey].merged_count += 1;
    });

    const aggregation: Record<
      string,
      {
        total_amount: number;
        booking_count: number;
        bookings: string[];
      }
    > = {};

    Object.values(groupedBookings).forEach((b: any) => {
      const { payout } = this._calculateBookingPayout(b, vertical, commRate);

      const bookingDate = b.date;

      if (!bookingDate) {
        return;
      }

      let periodKey: string;

      if (params.interval === "day") {
        // Used by both Day and Custom Range.
        periodKey = bookingDate;
      } else if (params.interval === "week") {
        const date = new Date(`${bookingDate}T00:00:00`);
        const day = date.getDay();

        // Convert Sunday=0 to Monday-based week.
        const diff = day === 0 ? -6 : 1 - day;

        date.setDate(date.getDate() + diff);
        periodKey = getLocalISODate(date);
      } else {
        // Calendar month.
        periodKey = `${bookingDate.substring(0, 7)}-01`;
      }

      if (!aggregation[periodKey]) {
        aggregation[periodKey] = {
          total_amount: 0,
          booking_count: 0,
          bookings: [],
        };
      }

      aggregation[periodKey].total_amount += payout;
      aggregation[periodKey].booking_count += vertical === "staycation" ? b.unit_count || 1 : 1;

      aggregation[periodKey].bookings.push(b.id);
    });

    const result = Object.entries(aggregation)
      .map(([dateStr, stats]) => {
        const date = new Date(`${dateStr}T00:00:00`);

        let label = "";

        if (params.interval === "day") {
          label = date.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          });
        } else if (params.interval === "week") {
          const weekEnd = new Date(date);
          weekEnd.setDate(date.getDate() + 6);

          label = `${date.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
          })} - ${weekEnd.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}`;
        } else {
          label = date.toLocaleDateString("en-GB", {
            month: "long",
            year: "numeric",
          });
        }

        return {
          payout_date: dateStr,
          total_amount: Number(stats.total_amount.toFixed(2)),
          booking_count: stats.booking_count,
          display_label: label,
        };
      })
      .sort((a, b) => b.payout_date.localeCompare(a.payout_date));

    return result;
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
      const status = (b.booking_status || "").toLowerCase().trim();
      if (status !== "confirmed" && status !== "completed") return;

      const groupKey = b.booking_group_id || b.parent_booking_id || b.id;

      if (!groupedBookings[groupKey]) {
        groupedBookings[groupKey] = { ...b, merged_count: 1 };
      } else {
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
        const { actualPaid, totalAmount, commission, gateway, revenueBase } =
          this._calculateBookingPayout(b, vertical, commRate);

        const bCount = vertical === "staycation" ? b.unit_count || 1 : 1;

        if (b.payment_type === "full") {
          acc.full.count += bCount;
          acc.full.total += actualPaid;
        } else {
          acc.advance.count += bCount;
          acc.advance.total += actualPaid;
        }

        acc.totalCommission += commission;
        acc.totalGateway += gateway;
        acc.totalCashCollected += revenueBase;
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
      totalPaid: Number(summary.totalCashCollected.toFixed(2)),
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
      const { revenueBase, commission, gateway, payout } = this._calculateBookingPayout(
        b,
        vertical,
        commRate,
      );

      return {
        "Booking Date": b.date,
        "Start Time": b.start_time || "N/A",
        "End Time": b.end_time || "N/A",
        "User Name": b.user_name || "Guest",
        "User Phone": b.user_phone || "N/A",
        "Total Amount": Number(b.total_amount.toFixed(2)),
        "Paid Amount": Number(revenueBase.toFixed(2)),
        "Bookr Commission": Number(commission.toFixed(2)),
        "Handling Fee": Number(gateway.toFixed(2)),
        "Est. Payout": Number(payout.toFixed(2)),
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
