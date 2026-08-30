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

export interface DashboardStats {
  totalBookings: number;
  onlineBookings: number;
  offlineBookings: number;
  totalRevenue: number;
  onlineRevenue: number;
  offlineRevenue: number;
  bookingGraphData: BookingGraphItem[];
  revenueGraphData: RevenueGraphItem[];
  maxBookingValue: number;
  dateRangeLabel: string;
}

export const useStaycationDashboard = (
  venueId: string,
  timeFilter: string,
  selectedRoomName: string = "All Rooms",
  customRange?: { start: Date; end: Date },
) => {
  const { clientProfile } = useAuthStore();

  const [isLoading, setIsLoading] = useState(true);
  const [rooms, setRooms] = useState<DashboardRoom[]>([]);

  const [stats, setStats] = useState<DashboardStats>({
    totalBookings: 0,
    onlineBookings: 0,
    offlineBookings: 0,
    totalRevenue: 0,
    onlineRevenue: 0,
    offlineRevenue: 0,
    bookingGraphData: [],
    revenueGraphData: [],
    maxBookingValue: 0,
    dateRangeLabel: "",
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

      if (venueData) {
        actualVenueId = venueData.id;
      }
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

        if (venueData) {
          actualVenueId = venueData.id;
        }
      }

      if (!actualVenueId) {
        setIsLoading(false);
        return;
      }

      /**
       * Fetch dynamic payout configuration for this staycation venue.
       *
       * commission_percentage:
       * Platform commission calculated on total_amount.
       *
       * gateway_percentage:
       * Payment gateway fee calculated on subtotal.
       *
       * Defaults are used only when the database value is null.
       */
      const { data: staycationVenue, error: staycationVenueError } = await supabase
        .from("staycation_venues")
        .select("commission_percentage, gateway_percentage")
        .eq("venue_id", actualVenueId)
        .maybeSingle();

      if (staycationVenueError) {
        throw staycationVenueError;
      }

      const commissionPercentage = Number(staycationVenue?.commission_percentage ?? 5);

      const gatewayPercentage = Number(staycationVenue?.gateway_percentage ?? 2);

      const commissionRate = commissionPercentage / 100;
      const gatewayRate = gatewayPercentage / 100;

      // Calculate Date Range
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

      const startStr = formatDate(startDate);
      const endStr = formatDate(endDate);

      let query = supabase
        .from("staycation_bookings")
        .select(
          `
          id,
          total_amount,
          platform_fee,
          gateway_fee,
          booking_type,
          booking_source,
          user_id,
          check_in_date,
          check_out_date,
          room_id,
          booking_status,
          paid_amount,
          discount_amount,
          subtotal
          `,
        )
        .eq("venue_id", actualVenueId)
        .eq("booking_status", "confirmed")
        .gte("check_in_date", startStr)
        .lte("check_in_date", endStr);

      if (selectedRoomName !== "All Rooms" && rooms.length > 0) {
        const matchingRoomIds = rooms
          .filter(r => r.name.startsWith(selectedRoomName))
          .map(r => r.id);

        if (matchingRoomIds.length > 0) {
          query = query.in("room_id", matchingRoomIds);
        }
      }

      const { data: bookings, error } = await query;

      if (error) {
        throw error;
      }

      if (!bookings) {
        setStats({
          totalBookings: 0,
          onlineBookings: 0,
          offlineBookings: 0,
          totalRevenue: 0,
          onlineRevenue: 0,
          offlineRevenue: 0,
          bookingGraphData: [],
          revenueGraphData: [],
          maxBookingValue: 0,
          dateRangeLabel: "",
        });

        return;
      }

      const activeBookings = bookings.filter(b => b.booking_status === "confirmed");

      let totalBookings = 0;
      let onlineBookings = 0;
      let offlineBookings = 0;
      let totalRevenue = 0;
      let onlineRevenue = 0;
      let offlineRevenue = 0;

      const dailyData: Record<
        string,
        {
          bookings: number;
          revenue: number;
          day: string;
        }
      > = {};

      let loopDate = new Date(startDate);

      while (loopDate <= endDate) {
        const dateKey = formatDate(loopDate);

        dailyData[dateKey] = {
          bookings: 0,
          revenue: 0,
          day: loopDate.toLocaleDateString("en-US", {
            weekday: "short",
          }),
        };

        loopDate.setDate(loopDate.getDate() + 1);
      }

      activeBookings.forEach(b => {
        const bookingDate = b.check_in_date;

        const isOnline = b.booking_source === "online";

        let bookingRevenue = 0;

        if (isOnline) {
          /**
           * ONLINE REVENUE
           *
           * Revenue = subtotal
           *          - commission on total_amount
           *          - gateway fee on subtotal
           *
           * Commission = total_amount × dynamic commission %
           * Gateway    = subtotal × dynamic gateway %
           */
          const subtotal = Number(b.subtotal || 0);
          const totalAmount = Number(b.total_amount || 0);

          const commission = totalAmount * commissionRate;
          const gatewayFee = subtotal * gatewayRate;

          bookingRevenue = Math.max(0, subtotal - commission - gatewayFee);

          onlineBookings += 1;
          onlineRevenue += bookingRevenue;
        } else {
          /**
           * OFFLINE REVENUE
           *
           * Offline revenue is the actual paid_amount.
           * No Bookr commission or payment gateway fee is deducted.
           */
          bookingRevenue = Number(b.paid_amount || 0);

          offlineBookings += 1;
          offlineRevenue += bookingRevenue;
        }

        totalBookings += 1;
        totalRevenue += bookingRevenue;

        if (dailyData[bookingDate]) {
          dailyData[bookingDate].bookings += 1;
          dailyData[bookingDate].revenue += bookingRevenue;
        }
      });

      totalRevenue = Number(totalRevenue.toFixed(2));
      onlineRevenue = Number(onlineRevenue.toFixed(2));
      offlineRevenue = Number(offlineRevenue.toFixed(2));

      totalBookings = onlineBookings + offlineBookings;

      const dates = Object.keys(dailyData).sort();

      let maxBookingValue = 0;
      let maxRevenueValue = 0;

      const bookingGraphData: BookingGraphItem[] = [];

      dates.forEach(date => {
        const data = dailyData[date];

        if (data.bookings > maxBookingValue) {
          maxBookingValue = data.bookings;
        }

        if (data.revenue > maxRevenueValue) {
          maxRevenueValue = data.revenue;
        }

        const formattedDate = new Date(date).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
        });

        bookingGraphData.push({
          date: formattedDate,
          day: data.day,
          value: data.bookings,
        });
      });

      const revenueGraphData: RevenueGraphItem[] = dates.map((date, idx) => {
        const data = dailyData[date];

        const pct = maxRevenueValue > 0 ? (data.revenue / maxRevenueValue) * 100 : 0;

        const formattedDate = new Date(date).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
        });

        return {
          date: formattedDate,
          value: `₹${Math.round(data.revenue).toLocaleString("en-IN")}`,
          fillPct: `${pct}%`,
          isBlue: idx % 2 === 0,
          rawAmount: data.revenue,
        };
      });

      let dateRangeLabel = "";

      if (dates.length > 0) {
        const first = bookingGraphData[0].date;
        const last = bookingGraphData[bookingGraphData.length - 1].date;

        dateRangeLabel = `${first} - ${last}`;
      }

      setStats({
        totalBookings,
        onlineBookings,
        offlineBookings,
        totalRevenue,
        onlineRevenue,
        offlineRevenue,
        bookingGraphData,
        revenueGraphData,
        maxBookingValue,
        dateRangeLabel,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [venueId, timeFilter, customRange, selectedRoomName, clientProfile, rooms]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

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
