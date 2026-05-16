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
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const [groupedBookings, setGroupedBookings] = useState<
    { title: string; data: StaycationBooking[] }[]
  >([]);

  const fetchBookings = useCallback(async () => {
    if (!activeVenue) return;

    try {
      setIsDataLoading(true);
      const todayStr = formatDate(new Date());

      // 1. Fetch Availability Blocks
      const newMarkedDates: any = {};
      const { data: blocks } = await supabase
        .from("staycation_availability")
        .select("date, is_blocked")
        .eq("venue_id", activeVenue.venueId)
        .eq("is_blocked", true);

      blocks?.forEach(b => {
        newMarkedDates[b.date] = {
          customStyles: {
            container: { backgroundColor: COLORS.danger, borderRadius: 4 },
            text: { color: "white" },
          },
        };
      });

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
            // console.log(`[DEBUG] Fallback triggered for user_id: ${b.user_id}`);

            const { data: profileData, error: _profileErr } = await supabase
              .from("profiles")
              .select("full_name, phone, avatar_url")
              .eq("id", b.user_id)
              .maybeSingle();

            // console.log(`[DEBUG] Fallback result:`, profileData, profileErr);

            if (profileData) {
              b.profiles = [profileData] as any;
            }
          }
          return b;
        }),
      );

      const todayList: StaycationBooking[] = [];
      const tomorrowList: StaycationBooking[] = [];
      const upcomingList: StaycationBooking[] = [];

      bookings.forEach(b => {
        // 4. Map the data safely
        const profile = Array.isArray(b.profiles) ? b.profiles[0] : b.profiles;

        // console.log(`[DEBUG] Final Extracted Profile for ${b.id}:`, profile);

        const finalDisplayName = b.guest_name || profile?.full_name || "Guest";
        const finalPhone = b.guest_phone || profile?.phone || "N/A";

        // console.log(`[DEBUG] Final Display Name: ${finalDisplayName}`);

        const isOnline = (parseFloat(b.platform_fee) || 0) > 0;
        const rangeColor = isOnline ? COLORS.primary : COLORS.danger;

        // Calendar marking
        let curr = new Date(b.check_in_date);
        const end = new Date(b.check_out_date);
        while (curr < end) {
          const dStr = formatDate(curr);
          newMarkedDates[dStr] = {
            customStyles: {
              container: { backgroundColor: rangeColor, borderRadius: 0, width: "100%" },
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
          status: b.paid_amount >= b.total_amount ? "Online" : "Offline",
          checkIn: b.check_in_date,
          checkOut: b.check_out_date,
          guestCount: b.guest_count,
        };

        const tomorrowStr = formatDate(new Date(Date.now() + 86400000));

        if (b.check_in_date === todayStr) todayList.push(formatted);
        else if (b.check_in_date === tomorrowStr) tomorrowList.push(formatted);
        else upcomingList.push(formatted);
      });

      setMarkedDates(newMarkedDates);

      const sections = [];
      if (todayList.length) sections.push({ title: "Today's Check-ins", data: todayList });
      if (tomorrowList.length) sections.push({ title: "Tomorrow's Check-ins", data: tomorrowList });
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
      const { data: b, error: fetchErr } = await supabase
        .from("staycation_bookings")
        .select("venue_id, check_in_date, check_out_date")
        .eq("id", bookingId)
        .single();

      if (fetchErr) throw fetchErr;

      const { error: cancelErr } = await supabase
        .from("staycation_bookings")
        .update({ booking_status: "cancelled" })
        .eq("id", bookingId);

      if (cancelErr) throw cancelErr;

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
        .in("date", targetDates);

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
        data: section.data.filter(b => b.checkIn === selectedDate || b.checkOut === selectedDate),
      }))
      .filter(s => s.data.length > 0);
  }, [groupedBookings, selectedDate]);

  return {
    isLoading: isVenuesLoading || isDataLoading,
    markedDates,
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
