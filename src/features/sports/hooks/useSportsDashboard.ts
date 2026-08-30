// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export interface DashboardMetrics {
  totalBookings: number;
  onlineBookings: number;
  offlineBookings: number;
  onlineRevenue: number;
  offlineRevenue: number;
  bookingGraphData: BookingGraphItem[];
  revenueGraphData: RevenueGraphItem[];
  maxBookingValue: number;
  dateRangeLabel: string;
}

export interface BookingGraphItem {
  date: string;
  day: string;
  value: number;
}

export interface RevenueGraphItem {
  date: string;
  value: string;
  fillPct: string;
  isBlue: boolean;
  rawAmount: number;
}

export interface GroundInfo {
  id: string;
  name: string;
}

const getLocalISODate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const useSportsDashboard = (
  venueIds: string[],
  timeFilter: string,
  groundFilter: string, // This will be the ground NAME or "Overall"
  selectedCategory: string,
  customRange?: { start: Date; end: Date },
) => {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalBookings: 0,
    onlineBookings: 0,
    offlineBookings: 0,
    onlineRevenue: 0,
    offlineRevenue: 0,
    bookingGraphData: [],
    revenueGraphData: [],
    maxBookingValue: 0,
    dateRangeLabel: "",
  });
  const [grounds, setGrounds] = useState<GroundInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);

  const fetchDashboardData = useCallback(async () => {
    if (!venueIds || venueIds.length === 0) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // 1. Fetch Grounds first to resolve filter and categories
      const { data: groundsData } = await supabase
        .from("sports_grounds")
        .select("id, name, sports_type")
        .in("venue_id", venueIds)
        .order("display_order", { ascending: true });

      const allGrounds = groundsData || [];

      // Extract unique categories
      const cats = new Set<string>();
      allGrounds.forEach(g => {
        if (g.sports_type) cats.add(g.sports_type.toLowerCase());
      });
      setAvailableCategories(Array.from(cats));

      // Filter grounds by selectedCategory
      let resolvedGrounds = allGrounds;
      if (selectedCategory && selectedCategory.toLowerCase() !== "overall") {
        resolvedGrounds = allGrounds.filter(
          g => g.sports_type && g.sports_type.toLowerCase() === selectedCategory.toLowerCase(),
        );
      }
      setGrounds(resolvedGrounds);

      let targetGroundId = "";
      if (groundFilter !== "Overall") {
        const found = resolvedGrounds.find(g => g.name === groundFilter);
        if (found) targetGroundId = found.id;
      }

      // 2. Calculate Date Range
      let startDate = new Date();
      let endDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);

      if (timeFilter === "Yesterday") {
        startDate.setDate(startDate.getDate() - 1);
        endDate.setDate(endDate.getDate() - 1);
      } else if (timeFilter === "Last week") {
        const currentDay = startDate.getDay();
        const dayOffset = currentDay === 0 ? 7 : currentDay; // Monday is 1, Sunday is 7
        startDate.setDate(startDate.getDate() - (dayOffset + 6));
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
      } else if (timeFilter === "Last Month") {
        startDate = new Date(startDate.getFullYear(), startDate.getMonth() - 1, 1);
        endDate = new Date(endDate.getFullYear(), endDate.getMonth(), 0);
        endDate.setHours(23, 59, 59, 999);
      } else if (timeFilter === "Custom" && customRange) {
        startDate = new Date(customRange.start);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(customRange.end);
        endDate.setHours(23, 59, 59, 999);
      }

      const dateLabel = `${startDate.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
      })} - ${endDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}`;

      // 3. Query Bookings (Using Local ISO Strings for DB Bounds)
      let query = supabase
        .from("sports_bookings")
        .select(
          `
          id, user_id, guest_name, total_amount, vendor_payout, booking_status, subtotal, paid_amount, discount_amount, platform_fee, booking_source, booking_group_id, parent_booking_id,
          sports_slots!inner(slot_date, ground_id, sports_grounds(sports_type))
        `,
        )
        .in("venue_id", venueIds)
        .eq("booking_status", "confirmed")
        .gte("sports_slots.slot_date", getLocalISODate(startDate))
        .lte("sports_slots.slot_date", getLocalISODate(endDate));

      if (targetGroundId) {
        query = query.eq("sports_slots.ground_id", targetGroundId);
      }

      const { data: bookings, error } = await query;
      if (error) throw error;

      /**
       * Groups sports booking records by their logical booking identity.
       *
       * WHY:
       * A single booking can generate multiple sports_bookings rows when it
       * contains multiple slots, is created as a bulk booking, or is linked
       * through a parent booking. Grouping by `${date}_${groupKey}` caused the
       * same logical booking to be counted multiple times when its slots had
       * different dates.
       *
       * The dashboard's overall booking metrics must therefore be calculated
       * at booking level, while the graph can independently use slot dates.
       */
      const bookingGroups: Record<string, any> = {};

      (bookings || []).forEach((b: any) => {
        const slot = Array.isArray(b.sports_slots) ? b.sports_slots[0] : b.sports_slots;

        const date = slot?.slot_date;
        const bType = slot?.sports_grounds?.sports_type || "";

        if (!date) return;

        // Filter by selected sports category.
        if (
          selectedCategory &&
          selectedCategory.toLowerCase() !== "overall" &&
          bType.toLowerCase() !== selectedCategory.toLowerCase()
        ) {
          return;
        }

        /**
         * Use booking_group_id as the logical booking identity.
         *
         * WHY:
         * parent_booking_id represents a relationship between bookings and should
         * not be used to merge otherwise separate confirmed bookings. Standalone
         * bookings fall back to their own booking id.
         */
        const groupKey = b.booking_group_id || b.id;

        if (!bookingGroups[groupKey]) {
          bookingGroups[groupKey] = {
            booking_source: b.booking_source,
            sports_type: bType,
            subtotal: 0,
            paid_amount: 0,
            total_amount: 0,
            discount_amount: 0,
            platform_fee: 0,
            vendor_payout: 0,

            /**
             * Store each booking row only once so that multiple slot rows
             * belonging to the same logical booking cannot inflate revenue.
             */
            processedBookingIds: new Set<string>(),

            /**
             * Keep the individual slot records separately for daily graph
             * calculations.
             */
            slots: [],
          };
        }

        const group = bookingGroups[groupKey];

        // Prevent the same booking record from being financially counted twice.
        if (!group.processedBookingIds.has(b.id)) {
          group.processedBookingIds.add(b.id);

          group.subtotal += Number(b.subtotal || 0);
          group.paid_amount += Number(b.paid_amount || 0);
          group.total_amount += Number(b.total_amount || 0);
          group.discount_amount += Number(b.discount_amount || 0);
          group.platform_fee += Number(b.platform_fee || 0);
          group.vendor_payout += Number(b.vendor_payout || 0);
        }

        group.slots.push({
          bookingId: b.id,
          date,
        });
      });

      // 5. Process booking-level metrics.
      let onlineCount = 0;
      let offlineCount = 0;
      let totalOnlineRevenue = 0;
      let totalOfflineRevenue = 0;

      const dailyData: Record<
        string,
        { bookings: number; revenue: number; bookingIds: Set<string> }
      > = {};

      // Initialize all dates in range with zeros.
      const dateCursor = new Date(startDate);

      while (dateCursor <= endDate) {
        const dateKey = getLocalISODate(dateCursor);

        dailyData[dateKey] = {
          bookings: 0,
          revenue: 0,
          bookingIds: new Set<string>(),
        };

        dateCursor.setDate(dateCursor.getDate() + 1);
      }

      const groupedArray = Object.entries(bookingGroups);

      groupedArray.forEach(([groupKey, group]: [string, any]) => {
        const isOnline = group.booking_source === "online";

        /**
         * Calculate vendor online revenue after payment gateway and platform fees.
         *
         * WHY:
         * Online bookings incur a 2% payment gateway fee on the subtotal and a
         * 3.5% Bookr commission on the total_amount. The calculation is performed
         * at the logical booking level before aggregating the dashboard revenue.
         *
         * Formula:
         *   Online Revenue = subtotal - (2% of subtotal) - (3.5% of total_amount)
         *
         * Offline revenue remains the actual paid_amount.
         */
        const bookingRevenue = isOnline
          ? group.subtotal - group.subtotal * 0.02 - group.total_amount * 0.035
          : group.paid_amount;

        if (isOnline) {
          onlineCount += 1;
          totalOnlineRevenue += bookingRevenue;
        } else {
          offlineCount += 1;
          totalOfflineRevenue += bookingRevenue;
        }

        /**
         * Daily graph data is maintained independently from overall booking
         * metrics. A booking group may contain slots on multiple dates, so
         * using the group's first date would produce incorrect graph data.
         */
        const dailyRevenueByDate: Record<string, number> = {};

        group.slots.forEach((slot: { bookingId: string; date: string }) => {
          const dateKey = slot.date;

          if (!dailyData[dateKey]) return;

          dailyData[dateKey].bookingIds.add(groupKey);

          if (!dailyRevenueByDate[dateKey]) {
            dailyRevenueByDate[dateKey] = 0;
          }

          /**
           * Financial values are already aggregated at booking level.
           * For multi-slot bookings we therefore distribute the booking
           * revenue across its slot dates rather than adding the complete
           * booking amount once per slot.
           */
        });

        /**
         * For a booking containing multiple dates, distribute its revenue
         * equally across its unique slot dates for the graph only.
         *
         * This does NOT affect the dashboard's actual revenue totals above.
         */
        const uniqueDates = Object.keys(dailyRevenueByDate);

        if (uniqueDates.length > 0) {
          const revenuePerDate = bookingRevenue / uniqueDates.length;

          uniqueDates.forEach(dateKey => {
            dailyData[dateKey].revenue += revenuePerDate;
          });
        }
      });

      // Convert booking Sets into daily booking counts.
      Object.values(dailyData).forEach(day => {
        day.bookings = day.bookingIds.size;
      });

      // Format for UI.
      const bookingGraphData: BookingGraphItem[] = Object.keys(dailyData).map(key => ({
        date: new Date(key).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
        }),
        day: new Date(key).toLocaleDateString("en-US", {
          weekday: "short",
        }),
        value: dailyData[key].bookings,
      }));

      const maxBookingValue = Math.max(...bookingGraphData.map(d => d.value), 5);

      const revenueItems = Object.keys(dailyData).map(key => ({
        date: new Date(key).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
        }),
        rawAmount: dailyData[key].revenue,
      }));

      const maxRev = Math.max(...revenueItems.map(r => r.rawAmount), 1);

      const revenueGraphData: RevenueGraphItem[] = revenueItems.map((r, i) => ({
        date: r.date,
        value: `+₹${Math.round(r.rawAmount)}`,
        fillPct: `${Math.round((r.rawAmount / maxRev) * 100)}%`,
        isBlue: i === revenueItems.length - 1,
        rawAmount: r.rawAmount,
      }));

      setMetrics({
        totalBookings: onlineCount + offlineCount,
        onlineBookings: onlineCount,
        offlineBookings: offlineCount,
        onlineRevenue: totalOnlineRevenue,
        offlineRevenue: totalOfflineRevenue,
        bookingGraphData,
        revenueGraphData,
        maxBookingValue,
        dateRangeLabel: dateLabel,
      });
    } catch (error) {
      console.error("Dashboard fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, [venueIds, timeFilter, groundFilter, customRange, selectedCategory]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return { metrics, grounds, loading, availableCategories, refetch: fetchDashboardData };
};
