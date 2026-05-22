// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import { useState, useCallback, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { Alert } from "react-native";
import { useAuthStore } from "../../../store";

export const useStaycationBookingDetails = (bookingId: string | undefined) => {
  const { profile } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<any>(null);

  const fetchBookingDetails = useCallback(async () => {
    if (!bookingId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("staycation_bookings")
        .select(
          `
          id,
          user_id,
          unit_count,
          check_in_date,
          check_out_date,
          guest_count,
          booking_type,
          platform_fee,
          total_amount,
          paid_amount,
          guest_name,   
          guest_phone,   
          booking_status,
          profiles:user_id ( full_name, phone, avatar_url, email )
        `,
        )
        .eq("id", bookingId)
        .single();

      if (error) throw error;
      setBookingDetails(data);
    } catch (error: any) {
      console.error("Error fetching booking details:", error);
      Alert.alert("Error", "Could not load booking details.");
    } finally {
      setIsLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    fetchBookingDetails();
  }, [fetchBookingDetails]);

  const updatePayment = async (additionalCashStr: string, additionalOnlineStr: string) => {
    if (!bookingDetails?.id || !profile?.id) return false;

    const addedCash = parseFloat(additionalCashStr) || 0;
    const addedOnline = parseFloat(additionalOnlineStr) || 0;
    const totalAdded = addedCash + addedOnline;

    if (totalAdded <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid payment amount.");
      return false;
    }

    try {
      setIsUpdating(true);

      const currentPaid = parseFloat(bookingDetails.paid_amount) || 0;
      const totalCost = parseFloat(bookingDetails.total_amount) || 0;
      const newPaidTotal = currentPaid + totalAdded;

      if (newPaidTotal > totalCost) {
        Alert.alert("Overpayment", "The amount entered exceeds the remaining balance.");
        return false;
      }

      // Log specific cash vs online split in offline_payment_logs
      // The database likely has a trigger to update paid_amount in staycation_bookings automatically
      if (addedCash > 0) {
        const { error: cashLogError } = await supabase.from("offline_payment_logs").insert({
          booking_id: bookingDetails.id,
          booking_vertical: "staycation",
          amount: addedCash,
          payment_mode: "cash",
          logged_by: profile.id,
          note: "Additional staycation payment (Cash)",
        });
        if (cashLogError) throw cashLogError;
      }

      if (addedOnline > 0) {
        const { error: onlineLogError } = await supabase.from("offline_payment_logs").insert({
          booking_id: bookingDetails.id,
          booking_vertical: "staycation",
          amount: addedOnline,
          payment_mode: "upi",
          logged_by: profile.id,
          note: "Additional staycation payment (Online/UPI)",
        });
        if (onlineLogError) throw onlineLogError;
      }

      // Re-fetch to update UI (trigger should have finished by now)
      await fetchBookingDetails();
      Alert.alert("Success", "Payment updated successfully!");
      return true;
    } catch (error: any) {
      console.error("Error updating payment:", error);
      Alert.alert("Update Failed", error.message || "Could not update payment.");
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  const cancelBooking = async () => {
    if (!bookingDetails?.id) return false;

    try {
      setIsUpdating(true);
      const { error } = await supabase
        .from("staycation_bookings")
        .update({ booking_status: "cancelled" })
        .eq("id", bookingDetails.id);

      if (error) throw error;

      await fetchBookingDetails();
      return true;
    } catch (error: any) {
      console.error("Error cancelling booking:", error);
      Alert.alert("Error", "Could not cancel booking.");
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    isLoading,
    isUpdating,
    bookingDetails,
    updatePayment,
    cancelBooking,
    refetch: fetchBookingDetails,
  };
};
