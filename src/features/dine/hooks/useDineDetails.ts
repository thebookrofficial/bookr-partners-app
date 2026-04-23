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
  type: string;
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
        const [h, m] = timeStr.split(":");
        const hourInt = parseInt(h, 10);
        const ampm = hourInt >= 12 ? "Pm" : "Am";
        const displayHour = hourInt % 12 || 12;
        const displayMins = m === "00" ? "" : `:${m}`;
        return `${displayHour}${displayMins} ${ampm}`;
      };

      const profiles = Array.isArray(data.profiles) ? data.profiles[0] : data.profiles;
      const table = Array.isArray(data.dining_tables) ? data.dining_tables[0] : data.dining_tables;

      // Robust logic: If guest_name is present, it's a vendor-made (Offline) booking.
      const isOffline = Boolean(data.guest_name && data.guest_name.trim() !== "");

      // Fetch payment info if available
      const { data: paymentData } = await supabase
        .from("payments")
        .select("payment_method, razorpay_payment_id, created_at, payment_status")
        .eq("booking_id", bookingId)
        .eq("booking_vertical", "dine")
        .maybeSingle();

      const billAmount = Number(data.bill_amount || 0);
      const paidAmount = Number(data.paid_amount || 0);
      const convenienceFee = Number(data.convenience_fee || 0);

      // Calculate derived values for the invoice view
      const gst = billAmount * 0.05;
      const platformFee = convenienceFee;

      const formattedBooking: DineBookingDetail = {
        id: data.id,
        name: isOffline ? data.guest_name : profiles?.full_name || "Guest User",
        phone: isOffline ? data.guest_phone : profiles?.phone || "",
        date: data.reservation_date,
        time: formatTime(data.reservation_time),
        guestCount: data.party_size.toString(),
        occasion: data.special_requests || "-",
        status: isOffline ? "Offline" : "Online",
        avatarUrl: profiles?.avatar_url,
        type: table?.table_number ? `Table ${table.table_number}` : "Walk in",
        billAmount: `₹${billAmount}`,
        discount: "-₹0",
        gst: `₹${gst.toFixed(2)}`,
        platformFee: `-₹${platformFee.toFixed(2)}`,
        gatewayCharges: "-₹0",
        estPayout: `₹${paidAmount}`,
        paymentMethod: paymentData?.payment_method || (paidAmount > 0 ? "Online" : "Cash"),
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
      };

      setBooking(formattedBooking);
    } catch (error) {
      console.error("Error fetching dine booking details:", error);
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    fetchBookingDetails();

    // Set up Realtime Subscription for this specific record
    const channel = supabase
      .channel(`booking_detail_${bookingId}`)
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
