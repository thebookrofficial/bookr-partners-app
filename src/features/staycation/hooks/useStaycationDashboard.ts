// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import { useState, useEffect, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { supabase } from "../../../lib/supabase";
import { useAuthStore } from "../../../store";

// Helper to format Date to YYYY-MM-DD in local time
const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export interface DashboardRoom {
  id: string;
  name: string;
}

export interface DailyRevenue {
  date: string;
  amount: string;
  percentage: number;
}

export interface WeeklyRevenue {
  id: string;
  week: string;
  dates: string;
  amount: string;
  percentage: number;
  isPrimary?: boolean;
  dailyBreakdown?: DailyRevenue[];
}

export interface DashboardStats {
  totalBookings: number;
  onlineBookings: number;
  offlineBookings: number;
  totalRevenue: string;
  onlineRevenue: string;
  offlineRevenue: string;
  weeklyRevenue: WeeklyRevenue[];
}

export const useStaycationDashboard = (
  venueId: string,
  startDate: Date,
  endDate: Date,
  selectedRoomName: string = "All Rooms",
) => {
  const { clientProfile } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [rooms, setRooms] = useState<DashboardRoom[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalBookings: 0,
    onlineBookings: 0,
    offlineBookings: 0,
    totalRevenue: "0",
    onlineRevenue: "0",
    offlineRevenue: "0",
    weeklyRevenue: [],
  });

  const fetchRooms = useCallback(async () => {
    let actualVenueId = venueId;
    if (!actualVenueId && clientProfile?.id) {
      const { data: venueData } = await supabase
        .from("venues")
        .select("id")
        .eq("vertical", "staycation")
        .eq("owner_id", clientProfile.id)
        .limit(1)
        .maybeSingle();
      if (venueData) actualVenueId = venueData.id;
    }

    if (!actualVenueId) return;

    try {
      const { data, error } = await supabase
        .from("staycation_rooms")
        .select("id, room_name")
        .eq("venue_id", actualVenueId)
        .eq("is_active", true);

      if (error) throw error;

      if (data) {
        const roomList = data.map(r => ({
          id: r.id,
          name: r.room_name,
        }));
        setRooms(roomList);
      }
    } catch (error) {
      console.error("Error fetching rooms:", error);
    }
  }, [venueId, clientProfile]);

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);

      let actualVenueId = venueId;
      if (!actualVenueId && clientProfile?.id) {
        let venueQuery = supabase
          .from("venues")
          .select("id")
          .eq("owner_id", clientProfile.id)
          .eq("vertical", "staycation");

        if (venueId) {
          venueQuery = venueQuery.eq("id", venueId);
        }

        const { data: venueData } = await venueQuery.limit(1).maybeSingle();

        if (venueData) actualVenueId = venueData.id;
      }

      if (!actualVenueId) {
        setIsLoading(false);
        return;
      }

      const startStr = formatDate(startDate);
      const endStr = formatDate(endDate);

      let query = supabase
        .from("staycation_bookings")
        .select(
          `
          id,
          total_amount,
          platform_fee,
          booking_type,
          booking_source,
          user_id,
          check_in_date,
          check_out_date,
          room_id,
          booking_status
        `,
        )
        .eq("venue_id", actualVenueId)
        .lte("check_in_date", endStr)
        .gte("check_out_date", startStr);

      if (selectedRoomName !== "All Rooms" && rooms.length > 0) {
        // Filter by base name (e.g., if "Deluxe" is selected, match all rooms like "Deluxe-101", "Deluxe-102")
        const matchingRoomIds = rooms
          .filter(r => r.name.startsWith(selectedRoomName))
          .map(r => r.id);

        if (matchingRoomIds.length > 0) {
          query = query.in("room_id", matchingRoomIds);
        }
      }

      const { data: bookings, error } = await query;

      if (error) throw error;

      if (!bookings) {
        setStats({
          totalBookings: 0,
          onlineBookings: 0,
          offlineBookings: 0,
          totalRevenue: "0",
          onlineRevenue: "0",
          offlineRevenue: "0",
          weeklyRevenue: [],
        });
        return;
      }

      // Filter out cancelled for consistency across all metrics
      const activeBookings = bookings.filter(b => b.booking_status !== "cancelled");

      let totalBookings = activeBookings.length;
      let onlineBookings = 0;
      let offlineBookings = 0;
      let totalRevenue = 0;
      let onlineRevenue = 0;
      let offlineRevenue = 0;

      // Grouping by date for the graph
      const revenueByDate: Record<string, number> = {};

      // Initialize all dates in range with 0
      let loopDate = new Date(startDate);
      while (loopDate <= endDate) {
        revenueByDate[formatDate(loopDate)] = 0;
        loopDate.setDate(loopDate.getDate() + 1);
      }

      // For Revenue and Online/Offline counts, we only count ACTIVE (non-cancelled) bookings.
      activeBookings.forEach(b => {
        const amount = parseFloat(b.total_amount) || 0;
        const isOnline = b.booking_source === "online" || !!b.user_id;

        if (isOnline) {
          // ONLINE: Deduct 7% (5% commission + 2% handling fee) for estimated payout
          const netPayout = amount * 0.93;
          onlineBookings++;
          onlineRevenue += netPayout;
          totalRevenue += netPayout;

          // For revenue graph, attribute net payout to check_in_date
          const dateKey = b.check_in_date;
          if (revenueByDate[dateKey] !== undefined) {
            revenueByDate[dateKey] += netPayout;
          }
        } else {
          // OFFLINE: Use gross amount (no platform commission)
          offlineBookings++;
          offlineRevenue += amount;
          totalRevenue += amount;

          // For revenue graph, attribute gross amount to check_in_date
          const dateKey = b.check_in_date;
          if (revenueByDate[dateKey] !== undefined) {
            revenueByDate[dateKey] += amount;
          }
        }
      });

      // Calculate Weekly Revenue
      const weeklyRevenue: WeeklyRevenue[] = [];
      const dates = Object.keys(revenueByDate).sort();

      if (dates.length > 0) {
        let currentWeekIndex = 1;
        for (let i = 0; i < dates.length; i += 7) {
          const weekDates = dates.slice(i, i + 7);
          const weekStart = weekDates[0];
          const weekEnd = weekDates[weekDates.length - 1];

          let weekAmount = 0;
          const dailyBreakdown: DailyRevenue[] = [];

          weekDates.forEach(date => {
            const amount = revenueByDate[date];
            weekAmount += amount;
            dailyBreakdown.push({
              date: new Date(date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
              amount: amount.toString(),
              percentage: 0, // Will calculate later
            });
          });

          // Formatting date range for display (e.g., "Apr 1- Apr 4")
          const startMonth = new Date(weekStart).toLocaleDateString("en-GB", { month: "short" });
          const startDay = new Date(weekStart).getDate();
          const endMonth = new Date(weekEnd).toLocaleDateString("en-GB", { month: "short" });
          const endDay = new Date(weekEnd).getDate();
          const datesLabel = `${startMonth} ${startDay}- ${endMonth} ${endDay}`;

          weeklyRevenue.push({
            id: `w${currentWeekIndex}`,
            week: `Week ${currentWeekIndex}`,
            dates: datesLabel,
            amount: weekAmount.toString(),
            percentage: 0, // Will calculate later
            dailyBreakdown,
          });
          currentWeekIndex++;
        }
      }

      // Calculate Percentages
      const maxWeekAmount = Math.max(...weeklyRevenue.map(w => parseFloat(w.amount)), 0);
      weeklyRevenue.forEach(w => {
        const weekAmount = parseFloat(w.amount);
        w.percentage = maxWeekAmount > 0 ? (weekAmount / maxWeekAmount) * 100 : 0;
        // Make the highest week primary
        if (weekAmount === maxWeekAmount && maxWeekAmount > 0) {
          w.isPrimary = true;
        }

        const maxDailyAmount = Math.max(
          ...(w.dailyBreakdown?.map(d => parseFloat(d.amount)) || [0]),
          0,
        );
        w.dailyBreakdown?.forEach(day => {
          const dayAmount = parseFloat(day.amount);
          day.percentage = maxDailyAmount > 0 ? (dayAmount / maxDailyAmount) * 100 : 0;
        });
      });

      setStats({
        totalBookings,
        onlineBookings,
        offlineBookings,
        totalRevenue: totalRevenue.toString(),
        onlineRevenue: onlineRevenue.toString(),
        offlineRevenue: offlineRevenue.toString(),
        weeklyRevenue,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [venueId, startDate, endDate, selectedRoomName, clientProfile, rooms]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [fetchDashboardData]),
  );

  return {
    isLoading,
    rooms,
    stats,
    refetch: fetchDashboardData,
  };
};
