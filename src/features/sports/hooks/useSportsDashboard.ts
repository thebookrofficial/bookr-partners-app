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
  groundFilter: string,
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
      // 1. Fetch grounds including dynamic commission/gateway percentages.
      const { data: groundsData, error: groundsError } = await supabase
        .from("sports_grounds")
        .select("id, name, sports_type, commission_percentage, gateway_percentage")
        .in("venue_id", venueIds)
        .order("display_order", { ascending: true });

      if (groundsError) throw groundsError;

      const allGrounds = groundsData || [];

      const cats = new Set<string>();

      allGrounds.forEach(g => {
        if (g.sports_type) {
          cats.add(g.sports_type.toLowerCase());
        }
      });

      setAvailableCategories(Array.from(cats));

      // Filter grounds by selected category.
      let resolvedGrounds = allGrounds;

      if (selectedCategory && selectedCategory.toLowerCase() !== "overall") {
        resolvedGrounds = allGrounds.filter(
          g => g.sports_type && g.sports_type.toLowerCase() === selectedCategory.toLowerCase(),
        );
      }

      setGrounds(
        resolvedGrounds.map(g => ({
          id: g.id,
          name: g.name,
        })),
      );

      let targetGroundId = "";

      if (groundFilter !== "Overall") {
        const found = resolvedGrounds.find(g => g.name === groundFilter);

        if (found) {
          targetGroundId = found.id;
        }
      }

      // 2. Calculate date range.
      let startDate = new Date();
      let endDate = new Date();

      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);

      if (timeFilter === "Yesterday") {
        startDate.setDate(startDate.getDate() - 1);
        endDate.setDate(endDate.getDate() - 1);
      } else if (timeFilter === "Last week") {
        const currentDay = startDate.getDay();
        const dayOffset = currentDay === 0 ? 7 : currentDay;

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
      })} - ${endDate.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
      })}`;

      // 3. Fetch confirmed bookings with their ground-level fee configuration.
      let query = supabase
        .from("sports_bookings")
        .select(
          `
          id,
          user_id,
          guest_name,
          total_amount,
          vendor_payout,
          booking_status,
          subtotal,
          paid_amount,
          discount_amount,
          platform_fee,
          booking_source,
          booking_group_id,
          parent_booking_id,
          sports_slots!inner(
            slot_date,
            ground_id,
            sports_grounds(
              sports_type,
              commission_percentage,
              gateway_percentage
            )
          )
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
       * Group rows belonging to the same logical booking.
       */
      const bookingGroups: Record<string, any> = {};

      (bookings || []).forEach((b: any) => {
        const slot = Array.isArray(b.sports_slots) ? b.sports_slots[0] : b.sports_slots;

        const ground = Array.isArray(slot?.sports_grounds)
          ? slot.sports_grounds[0]
          : slot?.sports_grounds;

        const date = slot?.slot_date;
        const bookingSportsType = ground?.sports_type || "";

        if (!date) return;

        // Filter by selected sports category.
        if (
          selectedCategory &&
          selectedCategory.toLowerCase() !== "overall" &&
          bookingSportsType.toLowerCase() !== selectedCategory.toLowerCase()
        ) {
          return;
        }

        const groupKey = b.booking_group_id || b.id;

        if (!bookingGroups[groupKey]) {
          bookingGroups[groupKey] = {
            booking_source: b.booking_source,

            sports_type: bookingSportsType,

            subtotal: 0,
            paid_amount: 0,
            total_amount: 0,
            discount_amount: 0,
            platform_fee: 0,
            vendor_payout: 0,

            commission_percentage: Number(ground?.commission_percentage ?? 0),

            gateway_percentage: Number(ground?.gateway_percentage ?? 0),

            processedBookingIds: new Set<string>(),

            slots: [],
          };
        }

        const group = bookingGroups[groupKey];

        // Prevent duplicate financial aggregation.
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

      // 4. Calculate booking-level metrics.
      let onlineCount = 0;
      let offlineCount = 0;

      let totalOnlineRevenue = 0;
      let totalOfflineRevenue = 0;

      const dailyData: Record<
        string,
        {
          bookings: number;
          revenue: number;
          bookingIds: Set<string>;
        }
      > = {};

      // Initialize all dates.
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

        let bookingRevenue = 0;

        if (isOnline) {
          const subtotal = Number(group.subtotal || 0);
          const totalAmount = Number(group.total_amount || 0);

          /**
           * Percentages are stored as whole-number percentages
           * in sports_grounds.
           *
           * Example:
           * commission_percentage = 3.5
           * gateway_percentage = 1.5
           *
           * Therefore divide by 100 before calculation.
           */
          const commissionPercentage = Number(group.commission_percentage || 0) / 100;

          const gatewayPercentage = Number(group.gateway_percentage || 0) / 100;

          const commission = totalAmount * commissionPercentage;

          const gatewayFee = subtotal * gatewayPercentage;

          bookingRevenue = Math.max(0, subtotal - commission - gatewayFee);

          onlineCount += 1;
          totalOnlineRevenue += bookingRevenue;
        } else {
          // Offline revenue = actual amount paid.
          bookingRevenue = Number(group.paid_amount || 0);

          offlineCount += 1;
          totalOfflineRevenue += bookingRevenue;
        }

        /**
         * Daily graph data.
         *
         * A logical booking may contain multiple slots on
         * different dates, so revenue is distributed across
         * unique slot dates only for graph visualization.
         */
        const dailyRevenueByDate: Record<string, number> = {};

        group.slots.forEach((slot: { bookingId: string; date: string }) => {
          const dateKey = slot.date;

          if (!dailyData[dateKey]) return;

          dailyData[dateKey].bookingIds.add(groupKey);

          if (!dailyRevenueByDate[dateKey]) {
            dailyRevenueByDate[dateKey] = 0;
          }

          dailyRevenueByDate[dateKey] += 1;
        });

        const uniqueDates = Object.keys(dailyRevenueByDate);

        if (uniqueDates.length > 0) {
          const revenuePerDate = bookingRevenue / uniqueDates.length;

          uniqueDates.forEach(dateKey => {
            dailyData[dateKey].revenue += revenuePerDate;
          });
        }
      });

      // Convert booking Sets into daily counts.
      Object.values(dailyData).forEach(day => {
        day.bookings = day.bookingIds.size;
      });

      // 5. Booking graph.
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

      // 6. Revenue graph.
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

      // 7. Final metrics.
      setMetrics({
        totalBookings: onlineCount + offlineCount,

        onlineBookings: onlineCount,
        offlineBookings: offlineCount,

        onlineRevenue: Number(totalOnlineRevenue.toFixed(2)),
        offlineRevenue: Number(totalOfflineRevenue.toFixed(2)),

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

  return {
    metrics,
    grounds,
    loading,
    availableCategories,
    refetch: fetchDashboardData,
  };
};
