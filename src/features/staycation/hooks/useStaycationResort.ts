// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import { useState, useCallback, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { StaycationBooking, StaycationRoom } from "../types/staycation.types";
import { useFocusEffect } from "@react-navigation/native";
import { Alert } from "react-native";
import { useStaycationVenues } from "./useStaycationVenues";

const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Specialized hook for Resort (Per Room) staycation data.
 * @param initialVenueId Optional initial venue
 * @param selectedDate The currently active date from the calendar
 * @param activeRoomType The currently selected room type tab
 */
export const useStaycationResort = (
  initialVenueId?: string,
  selectedDate: Date = new Date(),
  activeRoomType: string = "All",
) => {
  const {
    isLoading: isVenuesLoading,
    venues,
    activeVenue,
    setActiveVenueId,
    refetch: refetchVenues,
  } = useStaycationVenues({
    propertyType: "resort",
    bookingType: "per_room",
    initialVenueId,
  });

  const [isDataLoading, setIsDataLoading] = useState(false);
  const [rooms, setRooms] = useState<StaycationRoom[]>([]);
  const [roomsFilled, setRoomsFilled] = useState({ occupied: 0, total: 0 });
  const [groupedBookings, setGroupedBookings] = useState<
    { title: string; data: StaycationBooking[] }[]
  >([]);

  const fetchResortData = useCallback(async () => {
    if (!activeVenue) return;

    try {
      setIsDataLoading(true);
      const targetDateStr = formatDate(selectedDate);
      const todayRealStr = formatDate(new Date());

      // 1. Fetch Rooms
      const { data: roomsData } = await supabase
        .from("staycation_rooms")
        .select("*")
        .eq("venue_id", activeVenue.venueId)
        .eq("is_active", true);
      const validRooms = roomsData || [];
      setRooms(validRooms);

      // CRITICAL FIX: Use .trim() to match safely against the UI tabs
      const relevantRooms =
        activeRoomType === "All"
          ? validRooms
          : validRooms.filter(r => r.room_name?.trim() === activeRoomType);

      // 2. Fetch Bookings (Include explicit room details)
      const { data: bookingsData, error: bookingsError } = await supabase
        .from("staycation_bookings")
        .select(
          `
            id, user_id, booking_type, booking_status, platform_fee, check_in_date, check_out_date,
            guest_count, total_amount, paid_amount, guest_name, guest_phone, room_id,
            staycation_rooms ( room_name, room_number ),
            profiles ( full_name, phone, avatar_url )
          `,
        )
        .eq("venue_id", activeVenue.venueId)
        .eq("booking_type", "per_room")
        .neq("booking_status", "cancelled")
        .gte("check_out_date", targetDateStr)
        .order("check_in_date", { ascending: true });

      if (bookingsError) throw bookingsError;
      const bookings = bookingsData || [];

      // 3. Process Bookings for UI
      const targetDayList: StaycationBooking[] = [];
      const upcomingList: StaycationBooking[] = [];
      const checkOutsList: StaycationBooking[] = [];
      let occupiedTargetDay = 0;

      bookings.forEach(b => {
        const profile = Array.isArray(b.profiles) ? b.profiles[0] : b.profiles;
        const roomData = Array.isArray(b.staycation_rooms)
          ? b.staycation_rooms[0]
          : b.staycation_rooms;

        const isOnline = !!b.user_id;

        // CRITICAL FIX: Trim the room name here as well so the cards look clean
        const formattedRoomName = roomData
          ? `${roomData.room_name?.trim()} (${roomData.room_number || "N/A"})`
          : "Room Unassigned";

        // CRITICAL FIX: Use .trim() to calculate accurate occupancy
        const isRelevantRoom =
          activeRoomType === "All" || roomData?.room_name?.trim() === activeRoomType;
        if (
          isRelevantRoom &&
          b.check_in_date <= targetDateStr &&
          b.check_out_date > targetDateStr
        ) {
          occupiedTargetDay++;
        }

        const formatted: StaycationBooking = {
          id: b.id,
          name: b.guest_name || profile?.full_name || "Guest",
          phone: b.guest_phone || profile?.phone || "N/A",
          avatarUrl: profile?.avatar_url,
          amount: b.total_amount.toString(),
          paidAmount: parseFloat(b.paid_amount) || 0,
          totalAmount: parseFloat(b.total_amount) || 0,
          status: isOnline ? "Online" : "Offline",
          checkIn: b.check_in_date,
          checkOut: b.check_out_date,
          guestCount: b.guest_count,
          roomName: formattedRoomName,
        };

        if (b.check_out_date === targetDateStr) {
          checkOutsList.push(formatted);
        } else if (b.check_in_date === targetDateStr) {
          targetDayList.push(formatted);
        } else if (b.check_in_date > targetDateStr) {
          upcomingList.push(formatted);
        }
      });

      // Update Rooms Filled state with the targeted counts!
      setRoomsFilled({ occupied: occupiedTargetDay, total: relevantRooms.length });

      const sections = [];
      if (checkOutsList.length) sections.push({ title: "Check outs", data: checkOutsList });

      const isActuallyToday = targetDateStr === todayRealStr;
      const currentTitle = isActuallyToday
        ? "Today's Bookings"
        : `Bookings for ${selectedDate.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
          })}`;

      if (targetDayList.length) sections.push({ title: currentTitle, data: targetDayList });
      if (upcomingList.length) sections.push({ title: "Upcoming Bookings", data: upcomingList });

      setGroupedBookings(sections);
    } catch (err) {
      console.error("Resort data fetch error:", err);
    } finally {
      setIsDataLoading(false);
    }
  }, [activeVenue, selectedDate, activeRoomType]);

  const cancelBooking = async (bookingId: string) => {
    try {
      const { data: b, error: fetchErr } = await supabase
        .from("staycation_bookings")
        .select("venue_id, room_id, check_in_date, check_out_date")
        .eq("id", bookingId)
        .single();

      if (fetchErr) throw fetchErr;

      await supabase
        .from("staycation_bookings")
        .update({ booking_status: "cancelled" })
        .eq("id", bookingId);

      const targetDates: string[] = [];
      let curr = new Date(b.check_in_date);
      const end = new Date(b.check_out_date);
      while (curr < end) {
        targetDates.push(formatDate(curr));
        curr.setDate(curr.getDate() + 1);
      }

      await supabase
        .from("staycation_availability")
        .update({ is_blocked: false, is_available: true })
        .eq("venue_id", b.venue_id)
        .eq("room_id", b.room_id)
        .in("date", targetDates);

      Alert.alert("Success", "Booking cancelled successfully.");
      fetchResortData();
    } catch (err) {
      console.error("Cancel error:", err);
      Alert.alert("Error", "Failed to cancel booking.");
    }
  };

  useEffect(() => {
    fetchResortData();
  }, [fetchResortData]);

  useFocusEffect(
    useCallback(() => {
      refetchVenues();
    }, [refetchVenues]),
  );

  return {
    isLoading: isVenuesLoading || isDataLoading,
    groupedBookings,
    refetch: fetchResortData,
    venues,
    activeVenue,
    setActiveVenueId,
    rooms,
    roomsFilled,
    cancelBooking,
  };
};
