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
  venueId: string,
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

      if (timeFilter === "Yesterday") {
        startDate.setDate(startDate.getDate() - 1);
        endDate.setDate(endDate.getDate() - 1);
      } else if (timeFilter === "Last week") {
        startDate.setDate(startDate.getDate() - 7);
        endDate.setDate(endDate.getDate() - 1);
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

      // 3. Query Bookings (Using Local ISO Strings for DB Bounds)
      let query = supabase
        .from("sports_bookings")
        .select(
          `
          id, user_id, guest_name, total_amount, vendor_payout, booking_status, subtotal, paid_amount, discount_amount, platform_fee, booking_source, booking_group_id, parent_booking_id,
          sports_slots!inner(slot_date, ground_id)
        `,
        )
        .eq("venue_id", venueId)
        .neq("booking_status", "cancelled")
        .gte("sports_slots.slot_date", getLocalISODate(startDate))
        .lte("sports_slots.slot_date", getLocalISODate(endDate));

      if (targetGroundId) {
        query = query.eq("sports_slots.ground_id", targetGroundId);
      }

      const { data: bookings, error } = await query;
      if (error) throw error;

      // --- 4. SMART GROUPING ALGORITHM (Align with Home Screen) ---
      const groupedBookings: Record<string, any> = {};

      (bookings || []).forEach((b: any) => {
        // ROBUST DATA ACCESS: slot_date might be in an object or a single-item array
        const slot = Array.isArray(b.sports_slots) ? b.sports_slots[0] : b.sports_slots;
        const date = slot?.slot_date;

        if (!date) return; // Skip if no date found

        const groupKey = b.booking_group_id || b.parent_booking_id || b.id;
        const uniqueKey = `${date}_${groupKey}`;

        if (!groupedBookings[uniqueKey]) {
          groupedBookings[uniqueKey] = {
            ...b,
            date: date, // Keep a flat date for easier access later
            total_amount: Number(b.total_amount || 0),
            vendor_payout: Number(b.vendor_payout || 0),
            subtotal: Number(b.subtotal || 0),
            paid_amount: Number(b.paid_amount || 0),
            discount_amount: Number(b.discount_amount || 0),
            platform_fee: Number(b.platform_fee || 0),
            merged_count: 1,
          };
        } else {
          // Sum up amounts for the same transaction group
          groupedBookings[uniqueKey].total_amount += Number(b.total_amount || 0);
          groupedBookings[uniqueKey].vendor_payout += Number(b.vendor_payout || 0);
          groupedBookings[uniqueKey].subtotal += Number(b.subtotal || 0);
          groupedBookings[uniqueKey].paid_amount += Number(b.paid_amount || 0);
          groupedBookings[uniqueKey].discount_amount += Number(b.discount_amount || 0);
          groupedBookings[uniqueKey].platform_fee += Number(b.platform_fee || 0);
          groupedBookings[uniqueKey].merged_count += 1;
        }
      });

      // 5. Process Data
      let onlineCount = 0;
      let offlineCount = 0;
      let totalOnlineRevenue = 0;
      let totalOfflineRevenue = 0;

      const dailyData: Record<string, { bookings: number; revenue: number; day: string }> = {};

      // Initialize all dates in range with zeros
      const dateCursor = new Date(startDate);
      while (dateCursor <= endDate) {
        const dateKey = getLocalISODate(dateCursor);
        dailyData[dateKey] = {
          bookings: 0,
          revenue: 0,
          day: dateCursor.toLocaleDateString("en-US", { weekday: "short" }),
        };
        dateCursor.setDate(dateCursor.getDate() + 1);
      }

      const isPickleball = selectedCategory.toLowerCase().includes("pickleball");

      Object.values(groupedBookings).forEach((b: any) => {
        const isOnline = b.booking_source === "online";
        const isOffline = !isOnline;

        if (isOffline) {
          offlineCount++;
          totalOfflineRevenue += Number(b.total_amount || 0);
        } else {
          onlineCount++;

          // --- SYNCED WITH SportsInvoiceScreen.tsx ---
          const sumPaid = Number(b.paid_amount || 0);
          const sumDiscount = Number(b.discount_amount || 0);
          const sumSubtotal = Number(b.subtotal || 0);
          const sumTotalAmt = Number(b.total_amount || 0);
          const sumPlatformFee = Number(b.platform_fee || 0);

          // 1. Total Paid = paid_amount + discount - (if Pickleball, platform_fee)
          const totalPaid = sumPaid + sumDiscount - (isPickleball ? sumPlatformFee : 0);

          // 2. Platform Fee (Comm) = 3.5% of FULL TotalAmt (Matches Invoice Screen)
          const commission = Number((sumTotalAmt * 0.035).toFixed(2));

          // 3. Gateway Fee = 2% of Subtotal (actual gateway amount)
          const gateway = Number((sumSubtotal * 0.02).toFixed(2));

          // 4. Payout = Total Paid - Commission - Gateway
          const payout = totalPaid - commission - gateway;

          totalOnlineRevenue += payout;
        }

        const dateKey = b.date;
        if (dailyData[dateKey]) {
          dailyData[dateKey].bookings += 1;
          if (isOnline) {
            // Consistency: use same payout calc for graph
            const totalPaid =
              Number(b.paid_amount || 0) +
              Number(b.discount_amount || 0) -
              (isPickleball ? Number(b.platform_fee || 0) : 0);
            const payout =
              totalPaid -
              Number((Number(b.total_amount || 0) * 0.035).toFixed(2)) -
              Number((Number(b.subtotal || 0) * 0.02).toFixed(2));
            dailyData[dateKey].revenue += payout;
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
  }, [venueId, timeFilter, groundFilter, customRange, selectedCategory]);

  useEffect(() => {
    setLoading(true);
    setGrounds([]);
    // Reset metrics to defaults
    setMetrics({
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
  }, [venueId, timeFilter, groundFilter]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return { metrics, grounds, loading, refetch: fetchDashboardData };
};
