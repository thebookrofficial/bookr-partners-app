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

export const useSportsDashboard = (
  venueId: string,
  timeFilter: string,
  groundFilter: string, // This will be the ground NAME or "Overall"
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

  const fetchDashboardData = useCallback(async () => {
    if (!venueId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // 1. Fetch Grounds first to resolve filter
      const { data: groundsData } = await supabase
        .from("sports_grounds")
        .select("id, name")
        .eq("venue_id", venueId)
        .order("display_order", { ascending: true });

      const resolvedGrounds = groundsData || [];
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

      if (timeFilter === "Last week") {
        startDate.setDate(startDate.getDate() - 6);
      } else if (timeFilter === "This Month") {
        startDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
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

      // 3. Query Bookings
      let query = supabase
        .from("sports_bookings")
        .select(
          `
          id, user_id, guest_name, total_amount, vendor_payout, booking_status,
          sports_slots!inner(slot_date, ground_id)
        `,
        )
        .eq("venue_id", venueId)
        .neq("booking_status", "cancelled")
        .gte("sports_slots.slot_date", startDate.toISOString().split("T")[0])
        .lte("sports_slots.slot_date", endDate.toISOString().split("T")[0]);

      if (targetGroundId) {
        query = query.eq("sports_slots.ground_id", targetGroundId);
      }

      const { data: bookings, error } = await query;
      if (error) throw error;

      // 4. Process Data
      let onlineCount = 0;
      let offlineCount = 0;
      let totalOnlineRevenue = 0;
      let totalOfflineRevenue = 0;

      const dailyData: Record<string, { bookings: number; revenue: number; day: string }> = {};

      // Initialize all dates in range with zeros
      const dateCursor = new Date(startDate);
      while (dateCursor <= endDate) {
        const dateKey = dateCursor.toISOString().split("T")[0];
        dailyData[dateKey] = {
          bookings: 0,
          revenue: 0,
          day: dateCursor.toLocaleDateString("en-US", { weekday: "short" }),
        };
        dateCursor.setDate(dateCursor.getDate() + 1);
      }

      (bookings || []).forEach((b: any) => {
        const isOffline = !b.user_id; // Reliable indicator for offline bookings
        if (isOffline) {
          offlineCount++;
          totalOfflineRevenue += Number(b.total_amount || 0);
        } else {
          onlineCount++;
          totalOnlineRevenue += Number(b.vendor_payout || 0);
        }

        const dateKey = b.sports_slots.slot_date;
        if (dailyData[dateKey]) {
          dailyData[dateKey].bookings += 1;
          if (!isOffline) {
            dailyData[dateKey].revenue += Number(b.vendor_payout || 0);
          } else {
            dailyData[dateKey].revenue += Number(b.total_amount || 0);
          }
        }
      });

      // Format for UI
      const bookingGraphData: BookingGraphItem[] = Object.keys(dailyData).map(key => ({
        date: new Date(key).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
        day: dailyData[key].day,
        value: dailyData[key].bookings,
      }));

      const maxBookingValue = Math.max(...bookingGraphData.map(d => d.value), 5);

      const revenueItems = Object.keys(dailyData).map(key => ({
        date: new Date(key).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
        rawAmount: dailyData[key].revenue,
      }));
      const maxRev = Math.max(...revenueItems.map(r => r.rawAmount), 1);

      const revenueGraphData: RevenueGraphItem[] = revenueItems.map((r, i) => ({
        date: r.date,
        value: `+₹${r.rawAmount}`,
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
    } catch (err) {
      console.error("Dashboard data fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [venueId, timeFilter, groundFilter, customRange]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return { metrics, grounds, loading, refetch: fetchDashboardData };
};
