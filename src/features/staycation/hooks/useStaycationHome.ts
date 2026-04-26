// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../../lib/supabase";
import { useAuthStore } from "../../../store";
import { StaycationBooking } from "../types/staycation.types";
import { COLORS } from "@/constants/theme";

// Helper to format Date to YYYY-MM-DD
const formatDate = (date: Date) => date.toISOString().split("T")[0];

export const useStaycationHome = (serviceId?: string) => {
  const { clientProfile } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [markedDates, setMarkedDates] = useState<any>({});

  // Grouped bookings for the FlatList/SectionList
  const [groupedBookings, setGroupedBookings] = useState<
    { title: string; data: StaycationBooking[] }[]
  >([]);

  const [venue, setVenue] = useState<{ name: string; cover_image_url: string | null } | null>(null);

  const fetchDashboardData = useCallback(async () => {
    if (!clientProfile?.id) return;

    try {
      setIsLoading(true);

      // 1. Get the Staycation Venue ID for this owner
      let venueQuery = supabase
        .from("venues")
        .select("id, name, cover_image_url")
        .eq("owner_id", clientProfile.id)
        .eq("vertical", "staycation");

      // If a specific serviceId is passed, use it!
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
        // console.log("No staycation venue found for this specific logged-in user.");
        setIsLoading(false);
        return;
      }

      setVenue({
        name: venueData.name,
        cover_image_url: venueData.cover_image_url,
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayStr = formatDate(today);
      const tomorrowStr = formatDate(tomorrow);

      // 2. Fetch future/current bookings
      const { data: bookingsData, error: bookingsError } = await supabase
        .from("staycation_bookings")
        .select(
          `
          id,
          booking_type,
          booking_status,
          platform_fee,
          check_in_date,
          check_out_date,
          guest_count,
          total_amount,
          paid_amount,
          guest_name,
          guest_phone,
          profiles:user_id ( full_name, phone, avatar_url )
        `,
        )
        .eq("venue_id", venueData.id)
        .gte("check_out_date", todayStr)
        .order("check_in_date", { ascending: true });

      if (bookingsError) throw bookingsError;

      const todayList: StaycationBooking[] = [];
      const tomorrowList: StaycationBooking[] = [];
      const upcomingList: StaycationBooking[] = [];
      const newMarkedDates: any = {};

      bookingsData?.forEach((booking: any) => {
        const checkInStr = booking.check_in_date;
        const checkOutStr = booking.check_out_date;
        const profile = booking.profiles;

        // Differentiate Manual vs Online (consistent with Details screen)
        const isOnline = (parseFloat(booking.platform_fee) || 0) > 0 && !booking.guest_name;
        const rangeColor = isOnline ? COLORS.primary : COLORS.danger;

        // Map marked dates for Calendar (Period Marking)
        let currentDate = new Date(checkInStr);
        const endDate = new Date(checkOutStr);

        while (currentDate <= endDate) {
          const dateString = formatDate(currentDate);

          if (!newMarkedDates[dateString]) {
            newMarkedDates[dateString] = {
              startingDay: dateString === checkInStr,
              endingDay: dateString === checkOutStr,
              color: rangeColor,
              textColor: "#ffffff",
            };
          }
          currentDate.setDate(currentDate.getDate() + 1);
        }

        // Determine Status logic for UI
        let statusTag: StaycationBooking["status"] = isOnline ? "Online" : "Offline";

        if (booking.booking_status === "cancelled") {
          statusTag = "Cancelled";
        } else if (booking.paid_amount >= booking.total_amount) {
          statusTag = "Full";
        } else if (booking.paid_amount > 0) {
          statusTag = "Advance";
        }

        // Additional status: Complete if check_out_date is in the past and NOT cancelled
        if (checkOutStr < todayStr && booking.booking_status !== "cancelled") {
          statusTag = "Complete";
        }

        // Format for UI
        const formattedBooking: StaycationBooking = {
          id: booking.id,
          name: booking.guest_name || profile?.full_name || "Guest",
          phone: booking.guest_phone || profile?.phone || "N/A",
          avatarUrl: profile?.avatar_url,
          amount: booking.total_amount.toString(),
          status: statusTag,
          checkIn: checkInStr,
          checkOut: checkOutStr,
          guestCount: booking.guest_count,
        };

        // Grouping logic
        if (checkInStr === todayStr) {
          todayList.push(formattedBooking);
        } else if (checkInStr === tomorrowStr) {
          tomorrowList.push(formattedBooking);
        } else {
          upcomingList.push(formattedBooking);
        }
      });

      setMarkedDates(newMarkedDates);

      const sections = [];
      if (todayList.length > 0) sections.push({ title: "Today's Check-ins", data: todayList });
      if (tomorrowList.length > 0)
        sections.push({ title: "Tomorrow's Check-ins", data: tomorrowList });
      if (upcomingList.length > 0)
        sections.push({ title: "Upcoming Bookings", data: upcomingList });

      setGroupedBookings(sections);
    } catch (error) {
      console.error("Error fetching staycation data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [clientProfile, serviceId]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    isLoading,
    markedDates,
    groupedBookings,
    refetch: fetchDashboardData,
    venue,
  };
};
