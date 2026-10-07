// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import { useState, useCallback, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { Alert, InteractionManager } from "react-native";
import { useAuthStore } from "../../../store";

export interface PaymentLog {
  id: string;
  amount: number;
  payment_mode: "cash" | "online" | "upi" | "card" | "bank_transfer" | "other";
  note: string;
  created_at: string;
  isInitial?: boolean;
}

export const useStaycationBookingDetails = (bookingId: string | undefined) => {
  const { profile } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<any>(null);
  const [paymentLogs, setPaymentLogs] = useState<PaymentLog[]>([]);

  const fetchBookingDetails = useCallback(
    async (silent = false) => {
      if (!bookingId) {
        setIsLoading(false);
        return;
      }

      try {
        if (!silent) setIsLoading(true);
        const { data, error } = await supabase
          .from("staycation_bookings")
          .select(
            `
          id,
          user_id,
          venue_id,
          room_id,
          unit_count,
          check_in_date,
          check_out_date,
          guest_count,
          booking_type,
          platform_fee,
          total_amount,
          paid_amount,
          subtotal,
          deposit,
          booking_source,
          guest_name,   
          guest_phone,   
          booking_status,
          created_at,
          special_requests,
          venues!venue_id ( staycation_venues ( property_type, security_deposit_amount ) ),
          profiles:user_id ( full_name, phone, avatar_url, email )
        `,
          )
          .eq("id", bookingId)
          .single();

        if (error) throw error;
        setBookingDetails(data);

        // Fetch Payment Logs Ledger
        const { data: logsData, error: logsError } = await supabase
          .from("offline_payment_logs")
          .select("id, amount, payment_mode, note, created_at")
          .eq("booking_id", bookingId)
          .eq("booking_vertical", "staycation")
          .order("created_at", { ascending: true });

        let fetchedLogs = (logsData as PaymentLog[]) || [];

        if (logsError && logsError.code !== "PGRST116") {
          console.warn("Could not fetch payment logs:", logsError);
        }

        // Reconstruct Initial Advance Payment
        const totalLoggedAmount = fetchedLogs.reduce((sum, log) => sum + Number(log.amount), 0);
        const isOnline =
          data.booking_source === "online" ||
          !!data.user_id ||
          data.booking_status === "Online" ||
          data.booking_status === "online";
        const totalPaidAmount = Math.max(
          Number(data.paid_amount || 0),
          isOnline ? Number(data.subtotal || 0) : 0,
        );

        if (totalPaidAmount > totalLoggedAmount) {
          const initialAmount = totalPaidAmount - totalLoggedAmount;
          const initialLog: PaymentLog = {
            id: `initial-${data.id}`,
            amount: initialAmount,
            // Assume Online/UPI if booking is online or has user_id, otherwise Cash for manual
            payment_mode: isOnline ? "online" : "cash",
            note: "Initial Advance Payment",
            created_at: data.created_at,
            isInitial: true,
          };

          // Unshift to put it at the very top of the list (earliest date)
          fetchedLogs.unshift(initialLog);
        }

        setPaymentLogs(fetchedLogs);
      } catch (error: any) {
        console.error("Error fetching booking details:", error);
        Alert.alert("Error", "Could not load booking details.");
      } finally {
        setIsLoading(false);
      }
    },
    [bookingId],
  );

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      fetchBookingDetails();
    });
    return () => task.cancel();
  }, [fetchBookingDetails]);

  const updatePayment = async (amountStr: string, paymentMethod: string) => {
    if (!bookingDetails?.id || !profile?.id) return false;

    const totalAdded = parseFloat(amountStr) || 0;

    if (totalAdded <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid payment amount.");
      return false;
    }

    try {
      setIsUpdating(true);

      const isOnline =
        bookingDetails.booking_source === "online" ||
        !!bookingDetails.user_id ||
        bookingDetails.booking_status === "Online" ||
        bookingDetails.booking_status === "online";

      const currentPaid = Math.max(
        parseFloat(bookingDetails.paid_amount || "0"),
        isOnline ? parseFloat(bookingDetails.subtotal || "0") : 0,
      );
      const totalCost = parseFloat(bookingDetails.total_amount) || 0;
      const depositAmount = parseFloat(bookingDetails.deposit) || 0;
      const newPaidTotal = currentPaid + totalAdded;

      if (newPaidTotal > totalCost + depositAmount) {
        Alert.alert("Overpayment", "The amount entered exceeds the remaining balance.");
        return false;
      }

      // Log specific payment method in offline_payment_logs
      let note = "Additional staycation payment (Cash)";
      if (paymentMethod === "gpay") note = "Additional staycation payment (GPay)";
      if (paymentMethod === "phonepe") note = "Additional staycation payment (PhonePe)";
      if (paymentMethod === "paytm") note = "Additional staycation payment (Paytm)";

      const { error: logError } = await supabase.from("offline_payment_logs").insert({
        booking_id: bookingDetails.id,
        booking_vertical: "staycation",
        amount: totalAdded,
        payment_mode: paymentMethod,
        logged_by: profile.id,
        note: note,
      });
      if (logError) throw logError;

      // Manually update the master paid_amount (since there is no DB trigger)
      const { error: updateError } = await supabase
        .from("staycation_bookings")
        .update({ paid_amount: newPaidTotal })
        .eq("id", bookingDetails.id);

      if (updateError) throw updateError;

      // Re-fetch to update UI silently
      await fetchBookingDetails(true);
      Alert.alert("Success", "Payment updated successfully!");
      return true;
    } catch (error: any) {
      console.error("Error updating payment:", error);
      Alert.alert(
        "Update Failed",
        "Could not update the payment amount. Please check your connection and try again.",
      );
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  const cancelBooking = async () => {
    if (!bookingDetails?.id) return false;

    try {
      setIsUpdating(true);

      // 1. Update the booking status to cancelled
      const { error: bookingError } = await supabase
        .from("staycation_bookings")
        .update({ booking_status: "cancelled" })
        .eq("id", bookingDetails.id);

      if (bookingError) {
        console.error("SUPABASE UPDATE ERROR:", bookingError); // <-- THIS WILL TELL US THE CAUSE
        throw bookingError;
      }

      // 2. Trigger your custom RPC to accurately release the blocked units/dates
      const { error: rpcError } = await supabase.rpc("unblock_staycation_dates", {
        p_venue_id: bookingDetails.venue_id,
        p_room_id: bookingDetails.room_id || null, // Fallback to null for Farmhouses
        p_start_date: bookingDetails.check_in_date,
        p_end_date: bookingDetails.check_out_date,
        p_unit_count: bookingDetails.unit_count || 1, // Pass the units so it frees all rooms
      });

      if (rpcError) {
        console.error("Error releasing availability via RPC:", rpcError);
        // We log the error but don't throw, as the booking is already cancelled
      }

      await fetchBookingDetails(true);
      Alert.alert("Success", "Booking cancelled successfully.");
      return true;
    } catch (error: any) {
      console.error("Error cancelling booking:", error);
      Alert.alert("Error", "Could not cancel booking.");
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  const deletePaymentLog = async (logId: string) => {
    if (!bookingDetails?.id) return false;

    try {
      setIsUpdating(true);

      const logToDelete = paymentLogs.find(l => l.id === logId);
      if (!logToDelete) throw new Error("Log not found.");

      const newPaidAmount = Math.max(
        0,
        Number(bookingDetails.paid_amount || 0) - Number(logToDelete.amount),
      );

      if (logId.startsWith("initial-")) {
        if (bookingDetails.user_id) {
          Alert.alert(
            "Action Not Allowed",
            "You cannot delete the initial advance payment for online bookings.",
          );
          return false;
        }

        const { error: updateError } = await supabase
          .from("staycation_bookings")
          .update({ paid_amount: newPaidAmount })
          .eq("id", bookingDetails.id);

        if (updateError) throw updateError;
      } else {
        // Direct DB delete (assuming RLS allows it for vendor)
        const { error: logError } = await supabase
          .from("offline_payment_logs")
          .delete()
          .eq("id", logId);

        if (logError) throw logError;

        // Manually deduct the amount
        const { error: updateError } = await supabase
          .from("staycation_bookings")
          .update({ paid_amount: newPaidAmount })
          .eq("id", bookingDetails.id);

        if (updateError) throw updateError;
      }

      await fetchBookingDetails(true);
      return true;
    } catch (error: any) {
      console.error("Error deleting payment log:", error);
      Alert.alert("Error", "Could not delete payment log.");
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  const updateDeposit = async (newDepositAmount: number) => {
    if (!bookingDetails) return false;
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("staycation_bookings")
        .update({ deposit: newDepositAmount })
        .eq("id", bookingDetails.id);

      if (error) throw error;
      await fetchBookingDetails(true);
      return true;
    } catch (error: any) {
      console.error("Error updating deposit:", error);
      Alert.alert("Error", "Could not update the deposit amount.");
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    isLoading,
    isUpdating,
    bookingDetails,
    paymentLogs,
    updatePayment,
    deletePaymentLog,
    cancelBooking,
    updateDeposit,
    refetch: fetchBookingDetails,
  };
};
