// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../../lib/supabase";
import { StaycationBooking } from "../types/staycation.types";
import { useNavigation } from "@react-navigation/native";

export const useStaycationBooking = (bookingId: string | undefined) => {
  const [isLoading, setIsLoading] = useState(true);
  const [booking, setBooking] = useState<StaycationBooking | null>(null);
  const navigation = useNavigation();

  const fetchBooking = useCallback(async () => {
    if (!bookingId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      const { data: bookingData, error } = await supabase
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
        .eq("id", bookingId)
        .single();

      if (error) throw error;

      if (bookingData) {
        const profile = Array.isArray(bookingData.profiles)
          ? bookingData.profiles[0]
          : (bookingData.profiles as any);

        // Consistent logic with Details screen: platform_fee > 0 means Online
        // OR booking_type is online
        const isOnline =
          bookingData.booking_type === "online" || (parseFloat(bookingData.platform_fee) || 0) > 0;

        // Determine Status logic for UI
        let statusTag: StaycationBooking["status"] = isOnline ? "Online" : "Offline";

        const totalAmount = parseFloat(bookingData.total_amount) || 0;
        const paidAmount = parseFloat(bookingData.paid_amount) || 0;

        if (bookingData.booking_status === "cancelled") {
          statusTag = "Cancelled";
        } else if (paidAmount >= totalAmount) {
          statusTag = "Full";
        } else if (paidAmount > 0) {
          statusTag = "Advance";
        }

        // Additional status: Complete if check_out_date is in the past and NOT cancelled
        const todayStr = new Date().toISOString().split("T")[0];
        if (bookingData.check_out_date < todayStr && bookingData.booking_status !== "cancelled") {
          statusTag = "Complete";
        }

        const formattedBooking: StaycationBooking = {
          id: bookingData.id,
          name: bookingData.guest_name || profile?.full_name || "Guest",
          phone: bookingData.guest_phone || profile?.phone || "N/A",
          avatarUrl: profile?.avatar_url,
          amount: totalAmount.toString(),
          status: statusTag,
          checkIn: bookingData.check_in_date,
          checkOut: bookingData.check_out_date,
          guestCount: bookingData.guest_count,
        };

        setBooking(formattedBooking);
      }
    } catch (error) {
      console.error("Error fetching staycation booking:", error);
    } finally {
      setIsLoading(false);
    }
  }, [bookingId]);

  // Refetch when screen comes into focus to ensure fresh data after navigation back
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      fetchBooking();
    });
    return unsubscribe;
  }, [navigation, fetchBooking]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  return {
    isLoading,
    booking,
    refetch: fetchBooking,
  };
};
