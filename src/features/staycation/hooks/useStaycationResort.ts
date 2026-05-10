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
 */
export const useStaycationResort = (initialVenueId?: string) => {
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
      const todayStr = formatDate(new Date());

      // 1. Fetch Rooms
      const { data: roomsData } = await supabase
        .from("staycation_rooms")
        .select("*")
        .eq("venue_id", activeVenue.venueId)
        .eq("is_active", true);
      const validRooms = roomsData || [];
      setRooms(validRooms);

      // 2. Fetch Bookings
      const { data: bookingsData, error: bookingsError } = await supabase
        .from("staycation_bookings")
        .select(
          `
            id, booking_type, booking_status, platform_fee, check_in_date, check_out_date,
            guest_count, total_amount, paid_amount, guest_name, guest_phone, room_id,
            staycation_rooms ( room_name, room_number ),
            profiles:user_id ( full_name, phone, avatar_url )
          `,
        )
        .eq("venue_id", activeVenue.venueId)
        .eq("booking_type", "per_room")
        .neq("booking_status", "cancelled")
        .gte("check_out_date", todayStr);

      if (bookingsError) throw bookingsError;
      const bookings = bookingsData || [];

      const todayList: StaycationBooking[] = [];
      const upcomingList: StaycationBooking[] = [];
      const checkOutsList: StaycationBooking[] = [];
      let occupiedToday = 0;

      bookings.forEach(b => {
        if (b.check_in_date <= todayStr && b.check_out_date > todayStr) occupiedToday++;

        // SUPABASE FIX: Handle both Array and Object responses from joins
        const profile = Array.isArray(b.profiles) ? b.profiles[0] : b.profiles;
        const room = Array.isArray(b.staycation_rooms) ? b.staycation_rooms[0] : b.staycation_rooms;

        const formatted: StaycationBooking = {
          id: b.id,
          name: b.guest_name || profile?.full_name || "Guest",
          phone: b.guest_phone || profile?.phone || "N/A",
          avatarUrl: profile?.avatar_url,
          amount: b.total_amount.toString(),
          paidAmount: b.paid_amount,
          totalAmount: b.total_amount,
          status: b.paid_amount >= b.total_amount ? "Online" : "Offline",
          checkIn: b.check_in_date,
          checkOut: b.check_out_date,
          guestCount: b.guest_count,
          roomName: room ? `${room.room_name} | ${room.room_number}` : undefined,
        };

        if (b.check_out_date === todayStr) checkOutsList.push(formatted);
        if (b.check_in_date === todayStr) todayList.push(formatted);
        else upcomingList.push(formatted);
      });

      setRoomsFilled({ occupied: occupiedToday, total: validRooms.length });

      const sections = [];
      if (checkOutsList.length) sections.push({ title: "Check outs", data: checkOutsList });
      if (todayList.length) sections.push({ title: "Today's Bookings", data: todayList });
      if (upcomingList.length) sections.push({ title: "Upcoming Bookings", data: upcomingList });

      setGroupedBookings(sections);
    } catch (err) {
      console.error("Resort data fetch error:", err);
    } finally {
      setIsDataLoading(false);
    }
  }, [activeVenue]);

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

  // 1. Automatically fetch resort data whenever the activeVenue changes
  useEffect(() => {
    fetchResortData();
  }, [fetchResortData]);

  // 2. Only trigger a background refresh when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refetchVenues();
      // DO NOT put fetchResortData in this dependency array
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
