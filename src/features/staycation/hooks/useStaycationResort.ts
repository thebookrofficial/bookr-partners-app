// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import { useState, useCallback, useEffect, useMemo } from "react";
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
  const [closedDates, setClosedDates] = useState<Set<string>>(new Set());
  const [rawBookings, setRawBookings] = useState<any[]>([]);

  const targetDateStr = useMemo(() => formatDate(selectedDate), [selectedDate]);

  const fetchResortData = useCallback(async () => {
    if (!activeVenue) return;

    try {
      setIsDataLoading(true);

      // 0. Fetch Closed Dates
      const newClosedDates = new Set<string>();
      const { data: closedDatesData } = await supabase
        .from("venue_closed_dates")
        .select("start_date, end_date")
        .eq("venue_id", activeVenue.venueId);

      closedDatesData?.forEach(c => {
        let curr = new Date(c.start_date);
        const end = c.end_date ? new Date(c.end_date) : new Date(c.start_date);
        while (curr <= end) {
          newClosedDates.add(formatDate(curr));
          curr.setDate(curr.getDate() + 1);
        }
      });
      setClosedDates(newClosedDates);

      const { data: roomsData } = await supabase
        .from("staycation_rooms")
        .select("*")
        .eq("venue_id", activeVenue.venueId)
        .eq("is_active", true);

      // 1. Keep the full list
      const validRooms = roomsData || [];
      setRooms(validRooms);

      // ADDED unit_count TO THE SELECT QUERY
      const { data: bookingsData, error: bookingsError } = await supabase
        .from("staycation_bookings")
        .select(
          `
            id, user_id, booking_type, booking_status, platform_fee, check_in_date, check_out_date,
            guest_count, total_amount, paid_amount, guest_name, guest_phone, room_id, unit_count,
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
      setRawBookings(bookingsData || []);
    } catch (err) {
      console.error("Resort data fetch error:", err);
    } finally {
      setIsDataLoading(false);
    }
  }, [activeVenue, targetDateStr]);

  const { groupedBookings, roomsFilled } = useMemo(() => {
    const todayRealStr = formatDate(new Date());

    const relevantRooms =
      activeRoomType === "All" ? rooms : rooms.filter(r => r.room_name?.trim() === activeRoomType);

    const targetDayList: StaycationBooking[] = [];
    const upcomingByDate: Record<string, StaycationBooking[]> = {};
    const checkOutsList: StaycationBooking[] = [];

    const occupiedRoomsByDate: Record<string, Set<string>> = {};

    const getDatesInRange = (startStr: string, endStr: string) => {
      const dates = [];
      let curr = new Date(startStr);
      const end = new Date(endStr);
      while (curr < end) {
        dates.push(formatDate(curr));
        curr.setDate(curr.getDate() + 1);
      }
      return dates;
    };

    rawBookings.forEach(b => {
      const profile = Array.isArray(b.profiles) ? b.profiles[0] : b.profiles;
      const isOnline = !!b.user_id;

      const units = b.unit_count && b.unit_count > 0 ? b.unit_count : 1;
      const baseGuestsPerUnit = Math.floor(b.guest_count / units);
      const remainderGuests = b.guest_count % units;

      const dates = getDatesInRange(b.check_in_date, b.check_out_date);

      // Find the requested room to determine the room type
      const requestedRoomIndex = rooms.findIndex(r => r.id === b.room_id);
      const targetRoom = requestedRoomIndex >= 0 ? rooms[requestedRoomIndex] : null;
      const targetRoomName = targetRoom ? targetRoom.room_name : null;

      // Filter to same room type
      const candidateRooms = rooms.filter(r =>
        targetRoomName ? r.room_name === targetRoomName : true,
      );

      // Sort candidateRooms: requested room first, then others of same type
      if (targetRoom) {
        candidateRooms.sort((a, b) => {
          if (a.id === targetRoom.id) return -1;
          if (b.id === targetRoom.id) return 1;
          return 0;
        });
      }

      let assignedCount = 0;
      const assignedRoomsForThisBooking: StaycationRoom[] = [];

      // 1. Try to find strictly unoccupied rooms
      for (const room of candidateRooms) {
        if (assignedCount >= units) break;
        let isFree = true;
        for (const d of dates) {
          if (occupiedRoomsByDate[d]?.has(room.id)) {
            isFree = false;
            break;
          }
        }
        if (isFree) {
          assignedRoomsForThisBooking.push(room);
          for (const d of dates) {
            if (!occupiedRoomsByDate[d]) occupiedRoomsByDate[d] = new Set();
            occupiedRoomsByDate[d].add(room.id);
          }
          assignedCount++;
        }
      }

      // 2. If not enough free rooms, reuse candidate rooms (overbooking fallback)
      if (assignedCount < units) {
        for (const room of candidateRooms) {
          if (assignedCount >= units) break;
          if (!assignedRoomsForThisBooking.find(r => r.id === room.id)) {
            assignedRoomsForThisBooking.push(room);
            for (const d of dates) {
              if (!occupiedRoomsByDate[d]) occupiedRoomsByDate[d] = new Set();
              occupiedRoomsByDate[d].add(room.id);
            }
            assignedCount++;
          }
        }
      }

      // 3. Absolute fallback if candidates < units
      while (assignedRoomsForThisBooking.length < units) {
        assignedRoomsForThisBooking.push(candidateRooms[0] || rooms[0]);
      }

      for (let i = 0; i < units; i++) {
        const assignedRoom = assignedRoomsForThisBooking[i];
        const currentGuestCount = baseGuestsPerUnit + (i < remainderGuests ? 1 : 0);

        const formatted: StaycationBooking = {
          id: `${b.id}-unit-${i + 1}`,
          dbId: b.id,
          name: b.guest_name || profile?.full_name || "Guest",
          phone: b.guest_phone || profile?.phone || "N/A",
          avatarUrl: profile?.avatar_url,
          amount: (parseFloat(b.total_amount) / units).toFixed(2),
          paidAmount: (parseFloat(b.paid_amount) || 0) / units,
          totalAmount: (parseFloat(b.total_amount) || 0) / units,
          status: isOnline ? "Online" : "Offline",
          checkIn: b.check_in_date,
          checkOut: b.check_out_date,
          guestCount: currentGuestCount,
          roomName: assignedRoom
            ? `${assignedRoom.room_name} (${assignedRoom.room_number})`
            : "Room",
        };

        if (b.check_out_date === targetDateStr) {
          checkOutsList.push(formatted);
        } else if (b.check_in_date === targetDateStr) {
          targetDayList.push(formatted);
        } else if (b.check_in_date > targetDateStr) {
          if (!upcomingByDate[b.check_in_date]) {
            upcomingByDate[b.check_in_date] = [];
          }
          upcomingByDate[b.check_in_date].push(formatted);
        }
      }
    });

    const sections: any[] = [];
    if (checkOutsList.length) {
      sections.push({ title: "Check outs", data: checkOutsList });
    }

    const isActuallyToday = targetDateStr === todayRealStr;
    const currentTitle = isActuallyToday
      ? "Today's Bookings"
      : `Bookings for ${selectedDate.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
        })}`;

    if (targetDayList.length) {
      sections.push({ title: currentTitle, data: targetDayList });
    }

    // Process upcoming dates
    const sortedDates = Object.keys(upcomingByDate).sort();
    sortedDates.forEach(dateStr => {
      let occupiedOnThisDate = 0;
      const occupiedSet = occupiedRoomsByDate[dateStr];
      if (occupiedSet) {
        if (activeRoomType === "All") {
          occupiedOnThisDate = occupiedSet.size;
        } else {
          occupiedSet.forEach(roomId => {
            const r = rooms.find(room => room.id === roomId);
            if (r && r.room_name === activeRoomType) occupiedOnThisDate++;
          });
        }
      }

      const dateObj = new Date(dateStr);
      const formattedDate = dateObj.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });

      sections.push({
        title: `Upcoming: ${formattedDate}`,
        data: upcomingByDate[dateStr],
        occupiedCount: occupiedOnThisDate,
        totalCount: relevantRooms.length,
      });
    });

    // Calculate occupiedTargetDay
    let occupiedTargetDay = 0;
    const targetDayOccupiedSet = occupiedRoomsByDate[targetDateStr];
    if (targetDayOccupiedSet) {
      if (activeRoomType === "All") {
        occupiedTargetDay = targetDayOccupiedSet.size;
      } else {
        targetDayOccupiedSet.forEach(roomId => {
          const r = rooms.find(room => room.id === roomId);
          if (r && r.room_name === activeRoomType) occupiedTargetDay++;
        });
      }
    }

    return {
      groupedBookings: sections,
      roomsFilled: { occupied: occupiedTargetDay, total: relevantRooms.length },
    };
  }, [rooms, rawBookings, activeRoomType, targetDateStr, selectedDate]);

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
    closedDates,
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
