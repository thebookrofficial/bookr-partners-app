// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import { useState, useCallback } from "react";
import { supabase } from "../../../lib/supabase";
import { useAuthStore } from "../../../store";
import { StaycationBooking } from "../types/staycation.types";
import { COLORS } from "@/constants/theme";
import { useFocusEffect } from "@react-navigation/native";

// Helper to format Date to YYYY-MM-DD
const formatDate = (date: Date) => date.toISOString().split("T")[0];

export const useStaycationHome = (serviceId?: string, activeCategory?: "Farmhouse" | "Rooms") => {
  const { clientProfile } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [markedDates, setMarkedDates] = useState<any>({});

  // Grouped bookings for the FlatList/SectionList
  const [groupedBookings, setGroupedBookings] = useState<
    { title: string; data: StaycationBooking[] }[]
  >([]);

  const [venue, setVenue] = useState<{
    id: string;
    name: string;
    cover_image_url: string | null;
    property_type?: string;
  } | null>(null);

  const fetchDashboardData = useCallback(async () => {
    if (!clientProfile?.id) return;

    try {
      setIsLoading(true);

      // 1. Get the Staycation Venue ID for this owner
      let venueQuery = supabase
        .from("venues")
        .select("id, name, cover_image_url, staycation_venues(property_type)")
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
        setIsLoading(false);
        return;
      }

      // Handle the array return structure of a joined query
      const propertyType =
        venueData.staycation_venues && venueData.staycation_venues.length > 0
          ? venueData.staycation_venues[0].property_type
          : null;

      setVenue({
        id: venueData.id,
        name: venueData.name,
        cover_image_url: venueData.cover_image_url,
        property_type: propertyType,
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayStr = formatDate(today);
      const tomorrowStr = formatDate(tomorrow);

      // Determine the booking_type mapping for the filter
      const targetBookingType = activeCategory === "Farmhouse" ? "full_property" : "per_room";

      // 2. Fetch future/current bookings based on category
      let bookingsQuery = supabase
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
          profiles:user_id ( full_name, phone, avatar_url, email )
        `,
        )
        .eq("venue_id", venueData.id)
        .neq("booking_status", "cancelled")
        .gte("check_out_date", todayStr)
        .order("check_in_date", { ascending: true });

      // Apply the booking_type filter ONLY if activeCategory is explicitly provided
      if (activeCategory) {
        bookingsQuery = bookingsQuery.eq("booking_type", targetBookingType);
      }

      const { data: bookingsData, error: bookingsError } = await bookingsQuery;

      if (bookingsError) throw bookingsError;

      const todayList: StaycationBooking[] = [];
      const tomorrowList: StaycationBooking[] = [];
      const upcomingList: StaycationBooking[] = [];
      const newMarkedDates: any = {};

      bookingsData?.forEach((booking: any) => {
        const checkInStr = booking.check_in_date;
        const checkOutStr = booking.check_out_date;
        const profile = Array.isArray(booking.profiles) ? booking.profiles[0] : booking.profiles;

        // Differentiate Manual vs Online (consistent with Details screen)
        const isOnline =
          booking.booking_type === "online" || (parseFloat(booking.platform_fee) || 0) > 0;
        const rangeColor = isOnline ? COLORS.primary : COLORS.danger;

        // Map marked dates for Calendar (Custom Marking matching Figma)
        // Adjust: Staycation bookings should only mark nights (Check-in to day before Check-out)
        let currentDate = new Date(checkInStr);
        const checkoutDate = new Date(checkOutStr);
        const lastNightDate = new Date(checkoutDate);
        lastNightDate.setDate(lastNightDate.getDate() - 1);
        const lastNightStr = formatDate(lastNightDate);

        while (currentDate < checkoutDate) {
          const dateString = formatDate(currentDate);
          const isStart = dateString === checkInStr;
          const isEnd = dateString === lastNightStr;

          // Build customStyles object to create a "sticked" line (continuous range)
          // We use width > 100% and margins to bridge the gaps between day containers.
          let customStyles: any = {
            container: {
              backgroundColor: rangeColor,
              height: 32,
              justifyContent: "center",
              alignItems: "center",
            },
            text: { color: "white" },
          };

          if (isStart && isEnd) {
            // Single day: centered square
            customStyles.container.width = 32;
            customStyles.container.borderRadius = 4;
          } else if (isStart) {
            // Start: Expand towards the next day (right)
            // width 130% means 15% extra on each side if centered.
            // We shift it 15% right to make the left edge align with the day start.
            customStyles.container.width = "130%";
            customStyles.container.marginLeft = "30%";
            customStyles.container.borderTopLeftRadius = 4;
            customStyles.container.borderBottomLeftRadius = 4;
          } else if (isEnd) {
            // End: Expand towards the previous day (left)
            customStyles.container.width = "130%";
            customStyles.container.marginRight = "30%";
            customStyles.container.borderTopRightRadius = 4;
            customStyles.container.borderBottomRightRadius = 4;
          } else {
            // Middle: Significant overlap on both sides to bridge gaps
            customStyles.container.width = "160%";
            customStyles.container.borderRadius = 0;
          }

          newMarkedDates[dateString] = {
            customStyles,
          };
          currentDate.setDate(currentDate.getDate() + 1);
        }

        // Determine Status logic for UI
        let statusTag: StaycationBooking["status"] = isOnline ? "Online" : "Offline";

        if (booking.booking_status === "cancelled") {
          statusTag = "Cancelled";
        } else if (booking.paid_amount >= booking.total_amount) {
          statusTag = "Online";
        } else if (booking.paid_amount > 0) {
          statusTag = "Offline";
        }

        // Additional status: Complete if check_out_date is in the past and NOT cancelled
        if (checkOutStr < todayStr && booking.booking_status !== "cancelled") {
          statusTag = "Complete";
        }

        // Extract the prefix of the email (e.g., "shri7kant7" from "shri7kant7@gmail.com")
        const emailPrefix = profile?.email ? profile.email.split("@")[0] : null;

        // Priority: 1. Manual Name, 2. Profile Name, 3. Email Prefix, 4. "Guest"
        const validManualName = booking.guest_name?.trim() ? booking.guest_name : null;
        const validProfileName = profile?.full_name?.trim() ? profile.full_name : null;

        const formattedBooking: StaycationBooking = {
          id: booking.id,
          name: validManualName || validProfileName || emailPrefix || "Guest",
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
  }, [clientProfile, serviceId, activeCategory]);

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [fetchDashboardData]),
  );

  return {
    isLoading,
    markedDates,
    groupedBookings,
    refetch: fetchDashboardData,
    venue,
  };
};
