// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export interface DineBookingDetail {
  id: string;
  name: string;
  phone: string;
  date: string;
  time: string;
  guestCount: string;
  occasion: string;
  status: "Online" | "Offline";
  avatarUrl?: string;
  type: "Reserved" | "Walkin";
  billAmount: string;
  discount: string;
  gst: string;
  platformFee: string;
  gatewayCharges: string;
  estPayout: string;
  paymentMethod: string;
  transactionId: string;
  transactionDate: string;
  transactionTime: string;
  tableNumber?: string;
  isTableBooking: boolean;
}

export const useDineDetails = (bookingId: string) => {
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<DineBookingDetail | null>(null);

  const fetchBookingDetails = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("dining_bookings")
        .select(
          `
          id,
          reservation_date,
          reservation_time,
          party_size,
          special_requests,
          bill_amount,
          paid_amount,
          convenience_fee,
          booking_status,
          guest_name,
          guest_phone,
          created_at,
          table_id,
          profiles (
            full_name,
            phone,
            avatar_url
          ),
          dining_tables (
            table_number
          )
        `,
        )
        .eq("id", bookingId)
        .single();

      if (error) throw error;

      const formatTime = (timeStr: string) => {
        if (!timeStr || timeStr === "00:00:00" || timeStr === "00:00") return "";
        const [h, m] = timeStr.split(":");
        const hourInt = parseInt(h, 10);
        const ampm = hourInt >= 12 ? "Pm" : "Am";
        const displayHour = hourInt % 12 || 12;
        const displayMins = m === "00" ? "" : `:${m}`;
        return `${displayHour}${displayMins} ${ampm}`;
      };

      const profiles = Array.isArray(data.profiles) ? data.profiles[0] : data.profiles;
      const table = Array.isArray(data.dining_tables) ? data.dining_tables[0] : data.dining_tables;

      // Robust logic for Type Differentiation (Matches Home/History hooks)
      const createdDateOnly = data.created_at
        ? new Date(data.created_at).toISOString().split("T")[0]
        : null;
      const isOffline = Boolean(data.guest_name && data.guest_name.trim() !== "");
      const name = isOffline ? data.guest_name : profiles?.full_name || "Guest User";

      const isTableBooking =
        data.booking_status !== "completed" ||
        Boolean(data.table_id) ||
        (data.reservation_date && createdDateOnly && data.reservation_date > createdDateOnly) ||
        (isOffline &&
          !name.toLowerCase().includes("direct pay") &&
          !name.toLowerCase().includes("pay bill"));

      // Fetch payment info if available
      const { data: paymentData } = await supabase
        .from("payments")
        .select("payment_method, razorpay_payment_id, created_at, payment_status")
        .eq("booking_id", bookingId)
        .eq("booking_vertical", "dine")
        .maybeSingle();

      const billAmount = Number(data.bill_amount || 0);

      // --- LOGIC UPDATES ---
      // For now, assume partnered = true. This would ideally be fetched from the venue's partnership status.
      const isPartnered = true;

      const platformFee = billAmount * 0.05;
      const gatewayCharges = billAmount * 0.02;
      const gst = 0;
      // Discount is 5% if partnered, otherwise 0
      const discount = isPartnered ? billAmount * 0.05 : 0;

      // Calculate EST Payout: (Total Bill - Vendor Discount) - Bookr Commission (7%)
      const estPayout = billAmount - discount - (platformFee + gatewayCharges);

      const formattedBooking: DineBookingDetail = {
        id: data.id,
        name,
        phone: isOffline ? data.guest_phone : profiles?.phone || "",
        date: data.reservation_date,
        time: isTableBooking ? formatTime(data.reservation_time) : "",
        guestCount: data.party_size.toString(),
        occasion: data.special_requests || "-",
        status: isOffline ? "Offline" : "Online",
        avatarUrl: profiles?.avatar_url,
        type: isTableBooking ? "Reserved" : "Walkin",
        billAmount: `₹${billAmount.toFixed(2)}`,
        discount: `-₹${discount.toFixed(2)}`,
        gst: `₹${gst.toFixed(2)}`,
        platformFee: `-₹${platformFee.toFixed(2)}`,
        gatewayCharges: `-₹${gatewayCharges.toFixed(2)}`,
        estPayout: `₹${estPayout.toFixed(2)}`,
        paymentMethod:
          paymentData?.payment_method || (Number(data.paid_amount) > 0 ? "Online" : "Cash"),
        transactionId: paymentData?.razorpay_payment_id || "N/A",
        transactionDate: paymentData?.created_at
          ? new Date(paymentData.created_at).toLocaleDateString("en-GB")
          : data.reservation_date,
        transactionTime: paymentData?.created_at
          ? new Date(paymentData.created_at).toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })
          : formatTime(data.reservation_time),
        tableNumber: table?.table_number,
        isTableBooking,
      };

      setBooking(formattedBooking);
    } catch (error) {
      console.error("Error fetching dine booking details:", error);
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    if (!bookingId) return;

    fetchBookingDetails();

    // Set up Realtime Subscription for this specific record
    // Use a unique channel name per mount to avoid collisions
    const channelName = `booking_detail_${bookingId}_${Math.random().toString(36).substring(7)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "dining_bookings",
          filter: `id=eq.${bookingId}`,
        },
        () => {
          fetchBookingDetails();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bookingId, fetchBookingDetails]);

  return {
    loading,
    booking,
    refresh: fetchBookingDetails,
  };
};
