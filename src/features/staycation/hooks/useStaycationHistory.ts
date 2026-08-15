// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../../lib/supabase";
import { StaycationBooking } from "../types/staycation.types";
import { useStaycationVenues } from "./useStaycationVenues";

// Helper to format Date to YYYY-MM-DD
const formatDate = (date: Date) => date.toISOString().split("T")[0];

export type DateFilterOption =
  | "all"
  | "yesterday"
  | "3_months"
  | "6_months"
  | "9_months"
  | "custom";
export const useStaycationHistory = (
  serviceId?: string,
  dateFilter: DateFilterOption = "all",
  customRange?: { start: Date; end: Date },
) => {
  const { activeVenue } = useStaycationVenues({
    initialVenueId: serviceId,
  });

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
    if (!activeVenue?.venueId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      setVenue({
        id: activeVenue.venueId,
        name: activeVenue.name,
        cover_image_url: activeVenue.cover_image_url,
      });

      // Fetch Rooms for the tabs
      const { data: roomsData } = await supabase
        .from("staycation_rooms")
        .select("id, room_name")
        .eq("venue_id", activeVenue.venueId)
        .eq("is_active", true);

      if (roomsData) {
        setRooms([
          { id: "all", name: "All Rooms" },
          ...roomsData.map(r => ({ id: r.id, name: r.room_name })),
        ]);
      }

      const todayStr = formatDate(new Date());

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
        .eq("venue_id", activeVenue.venueId)
        .neq("booking_status", "cancelled")
        .lte("check_out_date", todayStr);

      // Apply Date Range Filters
      if (dateFilter !== "all") {
        let fromDate = new Date();
        let toDate = new Date();

        if (dateFilter === "yesterday") {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          fromDate = yesterday;
          toDate = yesterday;
        } else if (dateFilter === "3_months") {
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

        query = query.gte("check_out_date", fromStr).lte("check_out_date", toStr);
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

        const rawPaid = parseFloat(booking.paid_amount) || 0;
        const rawSubtotal = parseFloat(booking.subtotal) || 0;

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
  }, [activeVenue, dateFilter, customRange]);

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
