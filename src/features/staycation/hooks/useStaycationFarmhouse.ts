// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import { useState, useCallback, useMemo, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { StaycationBooking } from "../types/staycation.types";
import { COLORS } from "@/constants/theme";
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
 * Specialized hook for Farmhouse (Full Property) staycation data.
 */
export const useStaycationFarmhouse = (initialVenueId?: string) => {
  const {
    isLoading: isVenuesLoading,
    venues,
    activeVenue,
    setActiveVenueId,
    refetch: refetchVenues,
  } = useStaycationVenues({
    propertyType: "farmhouse",
    bookingType: "full_property",
    initialVenueId,
  });

  const [isDataLoading, setIsDataLoading] = useState(false);
  const [markedDates, setMarkedDates] = useState<any>({});
  const [closedDates, setClosedDates] = useState<Set<string>>(new Set());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const [groupedBookings, setGroupedBookings] = useState<
    { title: string; data: StaycationBooking[] }[]
  >([]);

  const fetchBookings = useCallback(async () => {
    if (!activeVenue) return;

    try {
      setIsDataLoading(true);
      const todayStr = formatDate(new Date());

      // 1. Fetch Availability Blocks - REMOVED: We only show black for explicitly closed dates
      const newMarkedDates: any = {};
      const newClosedDates = new Set<string>();

      // 1.5. Fetch Closed Dates
      const { data: closedDatesData } = await supabase
        .from("venue_closed_dates")
        .select("start_date, end_date")
        .eq("venue_id", activeVenue.venueId);

      closedDatesData?.forEach(c => {
        let curr = new Date(c.start_date);
        const end = c.end_date ? new Date(c.end_date) : new Date(c.start_date);
        // Include the end date for closed dates
        while (curr <= end) {
          const dStr = formatDate(curr);
          newClosedDates.add(dStr);
          newMarkedDates[dStr] = {
            customStyles: {
              container: { backgroundColor: "black", borderRadius: 4, width: "100%" },
              text: { color: "white" },
            },
          };
          curr.setDate(curr.getDate() + 1);
        }
      });

      setClosedDates(newClosedDates);

      // 2. Fetch Bookings
      const { data: bookingsData, error: bookingsError } = await supabase
        .from("staycation_bookings")
        .select(
          `
            id, user_id, booking_type, booking_status, platform_fee, check_in_date, check_out_date,
            guest_count, total_amount, paid_amount, guest_name, guest_phone,
            profiles ( full_name, phone, avatar_url )
          `,
        )
        .eq("venue_id", activeVenue.venueId)
        .eq("booking_type", "full_property")
        .neq("booking_status", "cancelled")
        .gte("check_out_date", todayStr);

      if (bookingsError) throw bookingsError;
      let bookings = bookingsData || [];

      // 3. BULLETPROOF FALLBACK (Fixed array check)
      bookings = await Promise.all(
        bookings.map(async b => {
          // Check if profiles is null, undefined, OR an empty array
          const isProfileEmpty =
            !b.profiles || (Array.isArray(b.profiles) && b.profiles.length === 0);

          if (isProfileEmpty && b.user_id) {
            const { data: profileData, error: _profileErr } = await supabase
              .from("profiles")
              .select("full_name, phone, avatar_url")
              .eq("id", b.user_id)
              .maybeSingle();

            if (profileData) {
              b.profiles = [profileData] as any;
            }
          }
          return b;
        }),
      );

      const todayList: StaycationBooking[] = [];
      const upcomingList: StaycationBooking[] = [];

      bookings.forEach(b => {
        // 4. Map the data safely
        const profile = Array.isArray(b.profiles) ? b.profiles[0] : b.profiles;

        const finalDisplayName = b.guest_name || profile?.full_name || "Guest";
        const finalPhone = b.guest_phone || profile?.phone || "N/A";

        const isOnline = !!b.user_id;
        const rangeColor = isOnline ? COLORS.primary : COLORS.danger;

        // Calendar marking
        let curr = new Date(b.check_in_date);
        const end = new Date(b.check_out_date);
        while (curr < end) {
          const dStr = formatDate(curr);
          newMarkedDates[dStr] = {
            customStyles: {
              container: { backgroundColor: rangeColor, borderRadius: 4, width: "100%" },
              text: { color: "white" },
            },
          };
          curr.setDate(curr.getDate() + 1);
        }

        const formatted: StaycationBooking = {
          id: b.id,
          name: finalDisplayName,
          phone: finalPhone,
          avatarUrl: profile?.avatar_url,
          amount: b.total_amount.toString(),
          paidAmount: parseFloat(b.paid_amount) || 0,
          totalAmount: parseFloat(b.total_amount) || 0,
          status: isOnline ? "Online" : "Offline",
          checkIn: b.check_in_date,
          checkOut: b.check_out_date,
          guestCount: b.guest_count,
        };

        if (b.check_in_date === todayStr) {
          todayList.push(formatted);
        } else {
          upcomingList.push(formatted);
        }
      });

      // 5. Post-process to connect continuous dates
      Object.keys(newMarkedDates).forEach(dStr => {
        const current = newMarkedDates[dStr];
        if (!current.customStyles || !current.customStyles.container) return;

        const color = current.customStyles.container.backgroundColor;

        const parts = dStr.split("-").map(Number);
        const d = new Date(parts[0], parts[1] - 1, parts[2]);

        const prev = new Date(d);
        prev.setDate(d.getDate() - 1);
        const prevStr = formatDate(prev);

        const next = new Date(d);
        next.setDate(d.getDate() + 1);
        const nextStr = formatDate(next);

        const hasPrev =
          newMarkedDates[prevStr] &&
          newMarkedDates[prevStr].customStyles?.container?.backgroundColor === color;
        const hasNext =
          newMarkedDates[nextStr] &&
          newMarkedDates[nextStr].customStyles?.container?.backgroundColor === color;

        const container = current.customStyles.container;

        if (hasPrev && hasNext) {
          container.borderRadius = 0;
        } else if (hasPrev) {
          container.borderTopLeftRadius = 0;
          container.borderBottomLeftRadius = 0;
          container.borderTopRightRadius = 4;
          container.borderBottomRightRadius = 4;
          delete container.borderRadius;
        } else if (hasNext) {
          container.borderTopLeftRadius = 4;
          container.borderBottomLeftRadius = 4;
          container.borderTopRightRadius = 0;
          container.borderBottomRightRadius = 0;
          delete container.borderRadius;
        } else {
          container.borderRadius = 4;
        }
      });

      setMarkedDates(newMarkedDates);

      const sections = [];
      if (todayList.length) sections.push({ title: "Today's Check-ins", data: todayList });
      if (upcomingList.length) sections.push({ title: "Upcoming Bookings", data: upcomingList });

      setGroupedBookings(sections);
    } catch (err) {
      console.error("Farmhouse bookings fetch error:", err);
    } finally {
      setIsDataLoading(false);
    }
  }, [activeVenue]);

  const cancelBooking = async (bookingId: string) => {
    try {
      // 1. Fetch current booking details needed for the RPC
      const { data: b, error: fetchErr } = await supabase
        .from("staycation_bookings")
        .select("venue_id, check_in_date, check_out_date, unit_count, room_id")
        .eq("id", bookingId)
        .single();

      if (fetchErr) throw fetchErr;

      // 2. Attempt the update and DEMAND the row back using .select()
      const { data: updatedRows, error: cancelErr } = await supabase
        .from("staycation_bookings")
        .update({ booking_status: "cancelled" })
        .eq("id", bookingId)
        .select();

      if (cancelErr) throw cancelErr;

      // 4. Catch the Silent RLS Failure
      if (!updatedRows || updatedRows.length === 0) {
        Alert.alert(
          "Debug",
          "Database blocked the update (0 rows changed). This is an RLS failure.",
        );
        return;
      }

      // 5. Catch a rogue Database Trigger overriding us
      if (updatedRows[0].booking_status !== "cancelled") {
        Alert.alert("Debug", "A database trigger forced the status back to confirmed!");
        return;
      }

      // 6. If it genuinely worked, release the dates via your RPC
      await supabase.rpc("unblock_staycation_dates", {
        p_venue_id: b.venue_id,
        p_room_id: b.room_id || null,
        p_start_date: b.check_in_date,
        p_end_date: b.check_out_date,
        p_unit_count: b.unit_count || 1,
      });

      Alert.alert("Success", "Booking cancelled successfully.");
      fetchBookings();
    } catch (err) {
      console.error("Cancel error:", err);
      Alert.alert("Error", "Failed to cancel booking.");
    }
  };

  // 1. Automatically fetch bookings whenever the activeVenue changes
  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // 2. Only trigger a background refresh when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refetchVenues();
      // DO NOT put fetchBookings in this dependency array
    }, [refetchVenues]),
  );

  const filteredBookings = useMemo(() => {
    if (!selectedDate) return groupedBookings;
    return groupedBookings
      .map(section => ({
        ...section,
        data: section.data.filter(b => b.checkIn === selectedDate),
      }))
      .filter(s => s.data.length > 0);
  }, [groupedBookings, selectedDate]);

  return {
    isLoading: isVenuesLoading || isDataLoading,
    markedDates,
    closedDates,
    groupedBookings: filteredBookings,
    refetch: fetchBookings,
    venues,
    activeVenue,
    setActiveVenueId,
    cancelBooking,
    selectedDate,
    setSelectedDate,
  };
};
