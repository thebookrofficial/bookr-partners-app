// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import { supabase } from "@/lib/supabase";
import { PayoutStrategy } from "./strategies/payout.types";
import { SportsPayoutStrategy } from "./strategies/sports.payout.strategy";
import { StaycationPayoutStrategy } from "./strategies/staycation.payout.strategy";
import { EventPayoutStrategy } from "./strategies/event.payout.strategy";

type Vertical = "sports" | "staycation" | "event" | "events";

interface FeeRates {
  commissionRate: number;
  gatewayRate: number;
}

const DEFAULT_FEE_RATES: Record<Vertical, FeeRates> = {
  sports: {
    commissionRate: 0.035,
    gatewayRate: 0.02,
  },
  staycation: {
    commissionRate: 0.05,
    gatewayRate: 0.02,
  },
  event: {
    commissionRate: 0,
    gatewayRate: 0.02,
  },
  events: {
    commissionRate: 0,
    gatewayRate: 0.02,
  },
};

/**
 * Helper to fetch the vertical of a venue.
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
 * Fetch fee configuration from the service-specific table.
 *
 * Sports:
 *   sports_grounds.commission_percentage
 *   sports_grounds.gateway_percentage
 *
 * Staycation:
 *   staycation_venues.commission_percentage
 *   staycation_venues.gateway_percentage
 *
 * The database values are percentages, e.g. 5 = 5%.
 * They are converted to decimal rates, e.g. 0.05.
 */
const getVenueFeeRates = async (venueId: string, vertical: Vertical): Promise<FeeRates> => {
  const defaults = DEFAULT_FEE_RATES[vertical];

  if (vertical === "sports") {
    const { data, error } = await supabase
      .from("sports_grounds")
      .select("commission_percentage, gateway_percentage")
      .eq("venue_id", venueId)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("[FinanceService] Sports fee config error:", error);
      return defaults;
    }

    return {
      commissionRate:
        data?.commission_percentage != null
          ? Number(data.commission_percentage) / 100
          : defaults.commissionRate,

      gatewayRate:
        data?.gateway_percentage != null
          ? Number(data.gateway_percentage) / 100
          : defaults.gatewayRate,
    };
  }

  if (vertical === "staycation") {
    const { data, error } = await supabase
      .from("staycation_venues")
      .select("commission_percentage, gateway_percentage")
      .eq("venue_id", venueId)
      .maybeSingle();

    if (error) {
      console.error("[FinanceService] Staycation fee config error:", error);
      return defaults;
    }

    return {
      commissionRate:
        data?.commission_percentage != null
          ? Number(data.commission_percentage) / 100
          : defaults.commissionRate,

      gatewayRate:
        data?.gateway_percentage != null
          ? Number(data.gateway_percentage) / 100
          : defaults.gatewayRate,
    };
  }

  return defaults;
};

/**
 * Strategy Selector.
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
 * Helper to get YYYY-MM-DD in local timezone.
 */
const getLocalISODate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

/**
 * Unified Finance Service.
 */
export const FinanceService = {
  /**
   * Calculates the vendor payout for a single booking.
   *
   * Sports / Staycation online:
   *
   *   In-app payment = subtotal
   *
   *   Commission = total_amount × configured commission %
   *
   *   Gateway fee = subtotal × configured gateway %
   *
   *   Final payout =
   *     subtotal - commission - gateway fee
   *
   * The fee percentages are supplied dynamically by the
   * service-specific configuration.
   */
  _calculateBookingPayout(b: any, vertical: Vertical, feeRates: FeeRates) {
    const totalAmount = Number(b.total_amount || 0);
    const subtotal = Number(b.subtotal || 0);
    const paidAmount = Number(b.paid_amount || 0);
    const discount = Number(b.discount_amount || 0);

    let actualPaid = paidAmount;
    let revenueBase = paidAmount;
    let gatewayBase = paidAmount;

    if (vertical === "sports" || vertical === "staycation") {
      actualPaid = subtotal;
      revenueBase = subtotal;
      gatewayBase = subtotal;
    } else {
      revenueBase = actualPaid + discount;
      gatewayBase = actualPaid;
    }

    const commission = totalAmount * feeRates.commissionRate;
    const gateway = gatewayBase * feeRates.gatewayRate;

    const payout = Math.max(0, revenueBase - commission - gateway);

    return {
      payout: Number(payout.toFixed(2)),
      actualPaid: Number(actualPaid.toFixed(2)),
      discount: Number(discount.toFixed(2)),
      revenueBase: Number(revenueBase.toFixed(2)),
      totalAmount: Number(totalAmount.toFixed(2)),
      commission: Number(commission.toFixed(2)),
      gateway: Number(gateway.toFixed(2)),
      commissionRate: feeRates.commissionRate,
      gatewayRate: feeRates.gatewayRate,
    };
  },

  /**
   * Fetches pending payouts for the past 2 days.
   */
  async getPendingPayouts(venueId: string) {
    const vertical = await getVenueVertical(venueId);

    if (!vertical) {
      return [];
    }

    const strategy = getStrategy(vertical);
    const feeRates = await getVenueFeeRates(venueId, vertical);

    const today = new Date();

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const dayBeforeYesterday = new Date(today);
    dayBeforeYesterday.setDate(today.getDate() - 2);

    const dates = [getLocalISODate(yesterday), getLocalISODate(dayBeforeYesterday)];

    const rawData = await strategy.getPendingRawData(venueId, dates);

    const aggregation: Record<string, { amount: number; count: number }> = {};

    dates.forEach(date => {
      aggregation[date] = {
        amount: 0,
        count: 0,
      };
    });

    const groupedBookings: Record<string, any> = {};

    rawData.forEach(b => {
      const status = (b.booking_status || "").toLowerCase().trim();

      if (status !== "confirmed" && status !== "completed") {
        return;
      }

      const groupKey = b.booking_group_id || b.parent_booking_id || b.id;

      if (!groupedBookings[groupKey]) {
        groupedBookings[groupKey] = {
          ...b,
          merged_count: 1,
        };
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
      const { payout } = this._calculateBookingPayout(b, vertical, feeRates);

      if (!aggregation[b.date]) {
        aggregation[b.date] = {
          amount: 0,
          count: 0,
        };
      }

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
   * Fetches historical payouts aggregated by interval.
   */
  async getAggregatedPayouts(params: {
    venueId: string;
    startDate: string;
    endDate: string;
    interval: "day" | "week" | "month";
  }) {
    const vertical = await getVenueVertical(params.venueId);

    if (!vertical) {
      return [];
    }

    const strategy = getStrategy(vertical);

    const feeRates = await getVenueFeeRates(params.venueId, vertical);

    const rawData = await strategy.getBreakdownRawData(
      params.venueId,
      params.startDate,
      params.endDate,
    );

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
      const { payout } = this._calculateBookingPayout(b, vertical, feeRates);

      const bookingDate = b.date;

      if (!bookingDate) {
        return;
      }

      let periodKey: string;

      if (params.interval === "day") {
        periodKey = bookingDate;
      } else if (params.interval === "week") {
        const date = new Date(`${bookingDate}T00:00:00`);

        const day = date.getDay();

        const diff = day === 0 ? -6 : 1 - day;

        date.setDate(date.getDate() + diff);

        periodKey = getLocalISODate(date);
      } else {
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

    return Object.entries(aggregation)
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
  },

  /**
   * Fetches detailed payout breakdown.
   */
  async getPayoutDetailsBreakdown(venueId: string, startDate: string, endDate: string) {
    const vertical = await getVenueVertical(venueId);

    if (!vertical) {
      throw new Error("Venue not found or vertical unknown.");
    }

    const strategy = getStrategy(vertical);

    const feeRates = await getVenueFeeRates(venueId, vertical);

    const rawData = await strategy.getBreakdownRawData(venueId, startDate, endDate);

    const groupedBookings: Record<string, any> = {};

    rawData.forEach(b => {
      const status = (b.booking_status || "").toLowerCase().trim();

      if (status !== "confirmed" && status !== "completed") {
        return;
      }

      const groupKey = b.booking_group_id || b.parent_booking_id || b.id;

      if (!groupedBookings[groupKey]) {
        groupedBookings[groupKey] = {
          ...b,
          merged_count: 1,
        };
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
          this._calculateBookingPayout(b, vertical, feeRates);

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
        full: {
          count: 0,
          total: 0,
        },
        advance: {
          count: 0,
          total: 0,
        },
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

      commissionRate: `${(feeRates.commissionRate * 100).toFixed(2)}%`,
    };
  },

  /**
   * Generates formatted data for Excel export.
   */
  async exportPayouts(venueId: string, startDate: string, endDate: string) {
    const vertical = await getVenueVertical(venueId);

    if (!vertical) {
      throw new Error("Venue not found.");
    }

    const strategy = getStrategy(vertical);

    const feeRates = await getVenueFeeRates(venueId, vertical);

    const rawData = await strategy.getExportRawData(venueId, startDate, endDate);

    const groupedBookings: Record<string, any> = {};

    rawData.forEach(b => {
      const status = (b.booking_status || "").toLowerCase().trim();

      if (status !== "confirmed" && status !== "completed") {
        return;
      }

      const groupKey = b.booking_group_id || b.parent_booking_id || b.id;

      if (!groupedBookings[groupKey]) {
        groupedBookings[groupKey] = {
          ...b,
          merged_count: 1,
        };
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
        feeRates,
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
      {
        totalAmount: 0,
        paidAmount: 0,
        commission: 0,
        handling: 0,
        payout: 0,
        totalBookings: 0,
      },
    );

    rows.push({} as any);

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
   * Generates payout PDF.
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

    if (error) {
      throw error;
    }

    return blob;
  },
};
