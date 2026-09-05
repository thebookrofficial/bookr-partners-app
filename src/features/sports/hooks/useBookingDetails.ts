// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Alert } from "react-native";

export interface BookingDetailData {
  id: string;
  user_id: string | null;
  venue_id: string;
  total_amount: number;
  paid_amount: number;
  subtotal_amount?: number;
  discount_amount: number;
  platform_fee: number;
  gateway_fee: number;
  booking_status: string;
  guest_name: string | null;
  guest_phone: string | null;
  slot_id: string;
  created_at: string;
  profiles: { full_name: string; phone: string; avatar_url: string } | null;
  sports_slots: {
    id: string;
    start_time: string;
    end_time: string;
    slot_date: string;
    ground_id: string;
    sports_grounds?: {
      name: string;
      sports_type: string;
    };
  };
  venues: {
    name: string;
    vertical: string;
    allow_cancellation?: boolean;
    sports_venues?: { sports_type: string }[];
  };
  combined_time?: string;
  idChain: string[];
  slotIdChain: string[];
  lastBookingId: string;
  parent_booking_id?: string | null;
  booking_group_id?: string | null;
  sports_booking_type?: string;
  booking_source?: string;
  payment_type?: string;
  sequence_number?: number;
  player_count?: number | null;
}

export interface PaymentLog {
  id: string;
  amount: number;
  payment_mode:
    | "cash"
    | "online"
    | "upi"
    | "card"
    | "bank_transfer"
    | "other"
    | "gpay"
    | "phonepe"
    | "paytm";
  note: string;
  created_at: string;
  isInitial?: boolean; // Flag to identify our synthetic log
}

const formatHour = (timeStr: string) => {
  if (!timeStr) return "";
  const [h] = timeStr.split(":");
  const hourInt = parseInt(h, 10);
  const ampm = hourInt >= 12 ? "PM" : "AM";
  const displayHour = hourInt % 12 || 12;
  return `${displayHour} ${ampm}`;
};

export const useBookingDetails = (bookingId: string, idChain?: string[]) => {
  const [booking, setBooking] = useState<BookingDetailData | null>(null);
  const [paymentLogs, setPaymentLogs] = useState<PaymentLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchDetails = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!options?.silent) {
        setLoading(true);
      }
      try {
        let finalChain: any[] = [];
        let baseBooking: any = null;

        if (idChain && idChain.length > 0) {
          // OPTIMIZATION: Fetch the full chain in ONE query if we have the idChain!
          const { data, error } = await supabase
            .from("sports_bookings")
            .select(
              "*, sports_slots!inner(*, sports_grounds(name, sports_type)), profiles(*), venues(*)",
            )
            .in("id", idChain)
            .order("created_at", { ascending: true });

          if (error) throw error;

          // Determine baseBooking (either the specific bookingId or first in chain)
          baseBooking = data.find((b: any) => b.id === bookingId) || data[0];

          finalChain = data.sort((a: any, b: any) =>
            a.sports_slots.start_time.localeCompare(b.sports_slots.start_time),
          );
        } else {
          // 1. Fallback: Fetch the original booking first
          const { data: fallbackBaseBooking, error: baseError } = await supabase
            .from("sports_bookings")
            .select(
              "*, sports_slots!inner(*, sports_grounds(name, sports_type)), profiles(*), venues(*)",
            )
            .eq("id", bookingId)
            .single();

          if (baseError) throw baseError;
          baseBooking = fallbackBaseBooking;

          // 2. Fetch ALL potentially related bookings for this user/slot/date
          let linkedQuery = supabase
            .from("sports_bookings")
            .select("*, sports_slots!inner(*, sports_grounds(name, sports_type))")
            .eq("sports_slots.slot_date", baseBooking.sports_slots.slot_date)
            .eq("sports_slots.ground_id", baseBooking.sports_slots.ground_id)
            .neq("booking_status", "cancelled")
            .neq("booking_status", "refunded")
            .order("created_at", { ascending: true });

          // Only search for linked if it's part of a group or has a parent/child
          if (baseBooking.booking_group_id) {
            linkedQuery = linkedQuery.eq("booking_group_id", baseBooking.booking_group_id);
          } else if (baseBooking.parent_booking_id) {
            linkedQuery = linkedQuery.or(
              `id.eq.${baseBooking.parent_booking_id},parent_booking_id.eq.${baseBooking.parent_booking_id}`,
            );
          } else {
            // It's a base booking, look for its extensions
            linkedQuery = linkedQuery.or(
              `id.eq.${baseBooking.id},parent_booking_id.eq.${baseBooking.id}`,
            );
          }

          const { data: linkedData, error: linkedError } = await linkedQuery;
          if (linkedError) throw linkedError;

          finalChain = (linkedData || []).sort((a: any, b: any) =>
            a.sports_slots.start_time.localeCompare(b.sports_slots.start_time),
          );
        }

        // 4. Aggregate data
        const totalAmount = finalChain.reduce((sum, b) => sum + Number(b.total_amount), 0);
        const paidAmount = finalChain.reduce((sum, b) => sum + Number(b.paid_amount), 0);
        const subtotalAmount = finalChain.reduce((sum, b) => sum + Number(b.subtotal || 0), 0);
        const discountAmount = finalChain.reduce(
          (sum, b) => sum + Number(b.discount_amount || 0),
          0,
        );
        const platformFee = finalChain.reduce((sum, b) => sum + Number(b.platform_fee || 0), 0);
        const gatewayFee = finalChain.reduce((sum, b) => sum + Number(b.gateway_fee || 0), 0);

        const firstBooking = finalChain[0];
        const lastBooking = finalChain[finalChain.length - 1];

        if (!firstBooking || !lastBooking) {
          throw new Error("No booking data found in chain.");
        }

        const aggregatedBooking: BookingDetailData = {
          ...baseBooking,
          total_amount: totalAmount,
          paid_amount: paidAmount,
          subtotal_amount: subtotalAmount,
          discount_amount: discountAmount,
          platform_fee: platformFee,
          gateway_fee: gatewayFee,
          booking_source: firstBooking.booking_source,
          sports_slots: {
            ...baseBooking.sports_slots,
            id: lastBooking.sports_slots.id, // Use the last slot ID for extension logic
            start_time: firstBooking.sports_slots.start_time,
            end_time: lastBooking.sports_slots.end_time,
          },
          combined_time: `${formatHour(firstBooking.sports_slots.start_time)} - ${formatHour(
            lastBooking.sports_slots.end_time,
          )}`,
          idChain: finalChain.map(b => b.id),
          slotIdChain: finalChain.map(b => b.slot_id),
          lastBookingId: lastBooking.id,
        };

        setBooking(aggregatedBooking);

        let allRelatedBookingIds = [...aggregatedBooking.idChain];

        if (aggregatedBooking.booking_group_id) {
          const { data: groupBookings } = await supabase
            .from("sports_bookings")
            .select("id")
            .eq("booking_group_id", aggregatedBooking.booking_group_id);

          if (groupBookings) {
            allRelatedBookingIds = groupBookings.map(b => b.id);
          }
        }

        // 5. Fetch Payment Logs Ledger for ALL bookings in the chain/group
        const { data: logsData, error: logsError } = await supabase
          .from("offline_payment_logs")
          .select("id, amount, payment_mode, note, created_at")
          .in("booking_id", allRelatedBookingIds)
          .eq("booking_vertical", "sports")
          .order("created_at", { ascending: true });

        let fetchedLogs = (logsData as PaymentLog[]) || [];

        if (logsError && logsError.code !== "PGRST116") {
          console.warn("Could not fetch payment logs:", logsError);
        }

        // 6. Reconstruct Initial Advance Payment
        const totalLoggedAmount = fetchedLogs.reduce((sum, log) => sum + Number(log.amount), 0);
        const totalPaidInChain = aggregatedBooking.paid_amount;

        if (totalPaidInChain > totalLoggedAmount) {
          const initialAmount = totalPaidInChain - totalLoggedAmount;
          const initialLog: PaymentLog = {
            id: `initial-chain-${bookingId}`,
            amount: initialAmount,
            payment_mode: baseBooking.user_id ? "online" : "cash",
            note: "Initial Advance Payment",
            created_at: baseBooking.created_at,
            isInitial: true,
          };
          fetchedLogs.unshift(initialLog);
        }

        setPaymentLogs(fetchedLogs);
      } catch (error: any) {
        Alert.alert("Error", "Could not fetch booking details.");
        console.error(error);
      } finally {
        setLoading(false);
      }
    },
    [bookingId, idChain],
  );

  const logPayment = async (
    amount: number,
    mode:
      | "cash"
      | "online"
      | "upi"
      | "card"
      | "bank_transfer"
      | "other"
      | "gpay"
      | "phonepe"
      | "paytm",
    note?: string,
  ) => {
    setIsSaving(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      const userId = sessionData?.session?.user?.id;

      if (!token || !userId) {
        throw new Error("You must be logged in to log a payment. Please log out and back in.");
      }

      const vertical = booking?.venues?.vertical || "sports";
      // If mode is one of the specific types, use it directly. Otherwise, fallback online to upi
      const dbPaymentMode = [
        "gpay",
        "phonepe",
        "paytm",
        "cash",
        "card",
        "bank_transfer",
        "other",
      ].includes(mode)
        ? mode
        : mode === "online"
        ? "upi"
        : mode;

      // 1. Optimistically update UI
      const optimisticLog: PaymentLog = {
        id: `temp-${Date.now()}`,
        amount,
        payment_mode: dbPaymentMode as any,
        note: note || "",
        created_at: new Date().toISOString(),
      };
      setPaymentLogs(prev => [...prev, optimisticLog]);
      setBooking(prev => {
        if (!prev) return prev;
        return { ...prev, paid_amount: Number(prev.paid_amount) + amount };
      });

      // 2. Perform backend mutation
      const { error } = await supabase.functions.invoke("log-offline-payment", {
        body: {
          bookingId: bookingId,
          vertical: vertical,
          amount: amount,
          mode: dbPaymentMode,
          loggedBy: userId,
          note: note,
        },
      });

      if (error) {
        // Rollback on error
        setPaymentLogs(prev => prev.filter(l => l.id !== optimisticLog.id));
        setBooking(prev => {
          if (!prev) return prev;
          return { ...prev, paid_amount: Number(prev.paid_amount) - amount };
        });
        throw error;
      }

      // The edge function currently hardcodes the note to "Manual upi payment...".
      // We manually override it here if a specific note was provided (e.g. GPAY, PHONEPE).
      if (note && mode !== "cash") {
        try {
          // Find the latest payment log for this booking and update its note
          const { data: latestLog } = await supabase
            .from("offline_payment_logs")
            .select("id")
            .eq("booking_id", bookingId)
            .eq("amount", amount)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          if (latestLog?.id) {
            await supabase
              .from("offline_payment_logs")
              .update({ note: note })
              .eq("id", latestLog.id);
          }
        } catch (updateErr) {
          console.error("Failed to override hardcoded note:", updateErr);
        }
      }

      // Do not block UI with an alert on success for a faster feel, or keep it if needed.
      // Alert.alert("Success", "Payment logged successfully.");

      // Re-fetch to ensure sync (runs silently in background without blocking UI)
      fetchDetails({ silent: true });
      return true;
    } catch (error: any) {
      Alert.alert("Payment Failed", error.message);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const removePaymentLog = async (logId: string) => {
    setIsSaving(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (!token) {
        throw new Error("You must be logged in to remove a payment.");
      }

      const logToRemove = paymentLogs.find(l => l.id === logId);
      if (!logToRemove) throw new Error("Payment log not found.");

      if (logToRemove.isInitial || logId.startsWith("initial-chain-")) {
        throw new Error("The initial advance payment cannot be removed.");
      }

      const amountToRemove = Number(logToRemove.amount);

      // 1. Optimistic Update
      setPaymentLogs(prev => prev.filter(l => l.id !== logId));
      if (amountToRemove > 0) {
        setBooking(prev => {
          if (!prev) return prev;
          return { ...prev, paid_amount: Math.max(0, Number(prev.paid_amount) - amountToRemove) };
        });
      }

      // 2. Backend Mutation
      const { error } = await supabase.functions.invoke("remove-offline-payment", {
        body: { logId },
      });

      if (error) {
        // Rollback
        await fetchDetails({ silent: true });
        throw error;
      }

      fetchDetails({ silent: true });
      return true;
    } catch (error: any) {
      Alert.alert("Remove Payment Failed", error.message);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const cancelBooking = async () => {
    if (!booking) return false;
    setIsSaving(true);
    try {
      // 1. Optimistic Update
      setBooking(prev => {
        if (!prev) return prev;
        return { ...prev, booking_status: "cancelled" };
      });

      // Cancel ALL bookings in the chain
      const { error: bookingError } = await supabase
        .from("sports_bookings")
        .update({ booking_status: "cancelled" })
        .in("id", booking.idChain);

      if (bookingError) {
        // Rollback
        await fetchDetails();
        console.error("Booking Cancellation Error:", bookingError);
        throw new Error("You do not have permission to cancel this booking.");
      }

      // Mark ALL slots in the chain as available
      const { error: slotError } = await supabase
        .from("sports_slots")
        .update({ status: "available" })
        .in("id", booking.slotIdChain);

      if (slotError) console.warn("Slot update issue:", slotError);

      Alert.alert("Success", "Booking cancelled successfully.");
      return true;
    } catch (error: any) {
      Alert.alert("Cancellation Failed", error.message);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  return {
    booking,
    paymentLogs,
    loading,
    isSaving,
    logPayment,
    removePaymentLog,
    cancelBooking,
    refresh: fetchDetails,
  };
};
