// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../../lib/supabase";
import { useAuthStore } from "../../../store";
import { StaycationBooking } from "../types/staycation.types";

// Helper to format Date to YYYY-MM-DD
const formatDate = (date: Date) => date.toISOString().split("T")[0];

export type DateFilterOption = "all" | "3_months" | "6_months" | "9_months" | "custom";
export const useStaycationHistory = (
  serviceId?: string,
  dateFilter: DateFilterOption = "all",
  customRange?: { start: Date; end: Date },
) => {
  const { clientProfile } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  // Raw bookings to filter later
  const [allBookings, setAllBookings] = useState<
    (StaycationBooking & { roomId: string; vendorPayout: number; paidAmount: number })[]
  >([]);

  const [rooms, setRooms] = useState<{ id: string; name: string }[]>([]);
  const [venue, setVenue] = useState<{
    id: string;
    name: string;
    cover_image_url: string | null;
  } | null>(null);

  const fetchHistoryData = useCallback(async () => {
    if (!clientProfile?.id) return;

    try {
      setIsLoading(true);

      let venueQuery = supabase
        .from("venues")
        .select("id, name, cover_image_url")
        .eq("owner_id", clientProfile.id)
        .eq("vertical", "staycation");

      if (serviceId) {
        venueQuery = venueQuery.eq("id", serviceId);
      }

      const { data: venueData, error: venueError } = await venueQuery.limit(1).maybeSingle();

      if (venueError) {
        console.error("Supabase error fetching venue:", venueError);
        setIsLoading(false);
        return;
      }

      if (!venueData) {
        setIsLoading(false);
        return;
      }

      setVenue({
        id: venueData.id,
        name: venueData.name,
        cover_image_url: venueData.cover_image_url,
      });

      // Fetch Rooms for the tabs
      const { data: roomsData } = await supabase
        .from("staycation_rooms")
        .select("id, room_name")
        .eq("venue_id", venueData.id)
        .eq("is_active", true);

      if (roomsData) {
        setRooms([
          { id: "all", name: "All Rooms" },
          ...roomsData.map(r => ({ id: r.id, name: r.room_name })),
        ]);
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let query = supabase
        .from("staycation_bookings")
        .select(
          `
          id,
          booking_type,
          booking_status,
          booking_source,
          platform_fee,
          discount_amount,
          subtotal,
          check_in_date,
          check_out_date,
          guest_count,
          total_amount,
          paid_amount,
          vendor_payout,
          room_id,
          guest_name,
          guest_phone,
          profiles:user_id ( full_name, phone, avatar_url )
        `,
        )
        .eq("venue_id", venueData.id);

      // Base History Filter: Show all bookings except cancelled ones
      const historyFilterStr = `booking_status.neq.cancelled`;

      // Apply Date Range Filters
      if (dateFilter !== "all") {
        let fromDate = new Date();
        let toDate = new Date();

        if (dateFilter === "3_months") {
          fromDate.setMonth(fromDate.getMonth() - 3);
        } else if (dateFilter === "6_months") {
          fromDate.setMonth(fromDate.getMonth() - 6);
        } else if (dateFilter === "9_months") {
          fromDate.setMonth(fromDate.getMonth() - 9);
        } else if (dateFilter === "custom" && customRange) {
          fromDate = customRange.start;
          toDate = customRange.end;
        }

        const fromStr = formatDate(fromDate);
        const toStr = formatDate(toDate);

        // Apply AND condition using method chaining correctly
        // We use or() to ensure it's a history booking, AND gte/lte for date ranges
        // Note: Chaining .or() with .gte()/.lte() forms an implicit AND at the root level in PostgREST.
        query = query
          .or(historyFilterStr)
          .gte("check_in_date", fromStr)
          .lte("check_in_date", toStr);
      } else {
        // No date range applied, just the base History filter
        query = query.or(historyFilterStr);
      }

      const { data: bookingsData, error: bookingsError } = await query.order("check_in_date", {
        ascending: false,
      });

      if (bookingsError) throw bookingsError;

      const formattedBookings: (StaycationBooking & {
        roomId: string;
        vendorPayout: number;
        paidAmount: number;
      })[] = [];

      bookingsData?.forEach((booking: any) => {
        const checkInStr = booking.check_in_date;
        const checkOutStr = booking.check_out_date;
        const profile = Array.isArray(booking.profiles) ? booking.profiles[0] : booking.profiles;

        const isOnline = booking.booking_source === "online" || !!booking.user_id;

        let statusTag: StaycationBooking["status"] = isOnline ? "Online" : "Offline";

        if (booking.booking_status === "cancelled") {
          statusTag = "Cancelled";
        }

        const rawSubtotal = parseFloat(booking.subtotal) || 0;
        const rawPaid = parseFloat(booking.paid_amount) || 0;

        formattedBookings.push({
          id: booking.id,
          name: booking.guest_name || profile?.full_name || "Guest",
          phone: booking.guest_phone || profile?.phone || "N/A",
          avatarUrl: profile?.avatar_url,
          amount: booking.total_amount.toString(),
          status: statusTag,
          checkIn: checkInStr,
          checkOut: checkOutStr,
          guestCount: booking.guest_count,
          roomId: booking.room_id,
          vendorPayout: parseFloat(booking.vendor_payout) || 0,
          paidAmount: isOnline ? rawSubtotal : rawPaid,
        });
      });

      setAllBookings(formattedBookings);
    } catch (error) {
      console.error("Error fetching staycation history:", error);
    } finally {
      setIsLoading(false);
    }
  }, [clientProfile, serviceId, dateFilter, customRange]);

  useEffect(() => {
    fetchHistoryData();
  }, [fetchHistoryData]);

  // Helper to group by month for History View
  const getGroupedBookings = (activeRoomName: string) => {
    const activeRoom = rooms.find(r => r.name === activeRoomName);

    let filtered = allBookings;
    if (activeRoom && activeRoom.id !== "all") {
      filtered = allBookings.filter(b => b.roomId === activeRoom.id);
    }

    const grouped: Record<
      string,
      { bookings: typeof filtered; settlement: number; rawDate: number }
    > = {};
    filtered.forEach(booking => {
      const dateObj = new Date(booking.checkIn);
      // Group by Month e.g. "August 2026"
      const headerMonth = dateObj.toLocaleDateString("en-GB", {
        month: "long",
        year: "numeric",
      });

      // We need a sortable key (first day of the month)
      const rawMonth = new Date(dateObj.getFullYear(), dateObj.getMonth(), 1).getTime();

      if (!grouped[headerMonth]) {
        grouped[headerMonth] = { bookings: [], settlement: 0, rawDate: rawMonth };
      }
      grouped[headerMonth].bookings.push(booking);

      const amount = parseFloat(booking.amount) || 0;
      if (booking.status === "Online") {
        // ONLINE: Deduct 7% (5% commission + 2% handling fee)
        grouped[headerMonth].settlement += amount * 0.93;
      } else {
        // OFFLINE: No commission deducted
        grouped[headerMonth].settlement += amount;
      }
    });

    return Object.keys(grouped)
      .map(monthStr => ({
        date: monthStr, // UI uses this as the section header text
        settlement: grouped[monthStr].settlement,
        data: grouped[monthStr].bookings,
        rawDate: grouped[monthStr].rawDate,
      }))
      .sort((a, b) => b.rawDate - a.rawDate);
  };

  return {
    isLoading,
    rooms,
    venue,
    getGroupedBookings,
    refetch: fetchHistoryData,
  };
};
