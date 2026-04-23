// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";

export interface DineBookingData {
  id: string;
  name: string;
  phone: string;
  date: string;
  time: string;
  guestCount: string;
  occasion: string;
  status: "Online" | "Offline";
  avatarUrl?: string;
}

export interface DinePaymentData {
  date: string;
  data: {
    id: string;
    name: string;
    phone: string;
    amount: string;
    type: string;
    typeColor: string;
    amountColor: string;
    time: string;
    avatarUrl?: string;
  }[];
}

export const useDineHome = (serviceId: string) => {
  const [initialLoading, setInitialLoading] = useState(true);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [paymentsLoading, setPaymentsLoading] = useState(false);

  const [venue, setVenue] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [bookings, setBookings] = useState<DineBookingData[]>([]);
  const [payments, setPayments] = useState<DinePaymentData[]>([]);
  const [activeTab, setActiveTab] = useState("Upcoming");
  const [filter, setFilter] = useState("Today");

  // Use refs to avoid stale closures in Realtime callback
  const filterRef = useRef(filter);
  const dateRef = useRef(selectedDate);

  const fetchVenueDetails = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("venues")
        .select("id, name, cover_image_url")
        .eq("id", serviceId)
        .single();

      if (error) throw error;
      setVenue(data);
    } catch (error) {
      console.error("Error fetching venue details:", error);
    }
  }, [serviceId]);

  const fetchBookings = useCallback(async () => {
    setBookingsLoading(true);
    try {
      const targetDate = dateRef.current;
      const localDateString = `${targetDate.getFullYear()}-${String(
        targetDate.getMonth() + 1,
      ).padStart(2, "0")}-${String(targetDate.getDate()).padStart(2, "0")}`;

      const today = new Date();
      const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
        2,
        "0",
      )}-${String(today.getDate()).padStart(2, "0")}`;

      let query = supabase
        .from("dining_bookings")
        .select(
          `
          id,
          user_id,
          reservation_date,
          reservation_time,
          party_size,
          special_requests,
          paid_amount,
          guest_name,
          guest_phone,
          booking_status,
          profiles (
            full_name,
            phone,
            avatar_url
          )
        `,
        )
        .eq("venue_id", serviceId)
        .neq("booking_status", "cancelled");

      if (filterRef.current === "All") {
        query = query.gte("reservation_date", todayString);
      } else {
        query = query.eq("reservation_date", localDateString);
      }

      const { data, error } = await query
        .order("reservation_date", { ascending: true })
        .order("reservation_time", { ascending: true });

      if (error) throw error;

      const formattedBookings: DineBookingData[] = (data || []).map((b: any) => {
        const formatTime = (timeStr: string) => {
          if (!timeStr) return "N/A";
          const [h, m] = timeStr.split(":");
          const hourInt = parseInt(h, 10);
          const ampm = hourInt >= 12 ? "PM" : "AM";
          const displayHour = hourInt % 12 || 12;
          const displayMins = m === "00" ? "" : `:${m}`;
          return `${displayHour}${displayMins} ${ampm}`;
        };

        const resDate = new Date(b.reservation_date);
        const formattedDate = resDate.toLocaleDateString("en-GB", {
          weekday: "short",
          day: "numeric",
          month: "short",
          year: "numeric",
        });

        const profiles = Array.isArray(b.profiles) ? b.profiles[0] : b.profiles;

        // Robust logic: If guest_name is present, it's a vendor-made (Offline) booking.
        // Online bookings (from app) will have guest_name as null and rely on user_id/profiles.
        const isOffline = Boolean(b.guest_name && b.guest_name.trim() !== "");

        return {
          id: b.id,
          name: isOffline ? b.guest_name : profiles?.full_name || "Guest User",
          phone: isOffline ? b.guest_phone : profiles?.phone || "",
          date: formattedDate,
          time: formatTime(b.reservation_time),
          guestCount: `${b.party_size} Guest`,
          occasion: b.special_requests || "",
          status: isOffline ? "Offline" : "Online",
          avatarUrl: profiles?.avatar_url,
        };
      });

      setBookings(formattedBookings);
    } catch (error) {
      console.error("Error fetching dine bookings:", error);
    } finally {
      setBookingsLoading(false);
    }
  }, [serviceId]);

  const fetchPayments = useCallback(async () => {
    setPaymentsLoading(true);
    try {
      const targetDate = dateRef.current;
      const targetDateString = `${targetDate.getFullYear()}-${String(
        targetDate.getMonth() + 1,
      ).padStart(2, "0")}-${String(targetDate.getDate()).padStart(2, "0")}`;

      const today = new Date();
      const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
        2,
        "0",
      )}-${String(today.getDate()).padStart(2, "0")}`;

      let query = supabase
        .from("dining_bookings")
        .select(
          `
          id,
          paid_amount,
          reservation_time,
          reservation_date,
          created_at,
          guest_name,
          guest_phone,
          table_id,
          booking_status,
          bill_amount,
          profiles (
            full_name,
            phone,
            avatar_url
          )
        `,
        )
        .eq("venue_id", serviceId)
        .gt("bill_amount", 0);

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;

      const grouped: Record<string, any[]> = {};
      (data || []).forEach((b: any) => {
        // Helper to safely get ISO date string (YYYY-MM-DD)
        const getSafeDateString = (dateVal: any) => {
          if (!dateVal) return null;
          const d = new Date(dateVal);
          return isNaN(d.getTime()) ? null : d.toISOString().split("T")[0];
        };

        // Date Logic: If "All", show everything from today onwards.
        // If specific date, show if reservation_date OR created_at matches.
        const resDate = b.reservation_date;
        const createdDate = getSafeDateString(b.created_at);

        let shouldInclude = false;
        if (filterRef.current === "All") {
          shouldInclude =
            (resDate && resDate >= todayString) || (createdDate && createdDate >= todayString);
        } else {
          shouldInclude = resDate === targetDateString || createdDate === targetDateString;
        }

        if (!shouldInclude) return;

        const dateObj = new Date(b.created_at);
        if (isNaN(dateObj.getTime())) return; // Skip invalid created_at records

        const dateStr = dateObj.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });

        const timeStr = dateObj
          .toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })
          .replace("am", "AM")
          .replace("pm", "PM");

        if (!grouped[dateStr]) grouped[dateStr] = [];

        const profiles = Array.isArray(b.profiles) ? b.profiles[0] : b.profiles;
        const isOffline = Boolean(b.guest_name && b.guest_name.trim() !== "");

        // Robust Multi-Signal Logic for Type Differentiation:
        const createdDateOnly = b.created_at
          ? new Date(b.created_at).toISOString().split("T")[0]
          : null;
        const name = isOffline ? b.guest_name : profiles?.full_name || "Guest User";

        const isTableBooking =
          // 1. Any active (not completed) record is a Table Booking
          b.booking_status !== "completed" ||
          // 2. Any record with a specific table assigned is a Table Booking
          Boolean(b.table_id) ||
          // 3. If it was booked for a date after it was created, it's a reservation
          (b.reservation_date && createdDateOnly && b.reservation_date > createdDateOnly) ||
          // 4. Offline records are bookings, unless labeled as direct pay
          (isOffline &&
            !name.toLowerCase().includes("direct pay") &&
            !name.toLowerCase().includes("pay bill"));

        grouped[dateStr].push({
          id: b.id,
          name,
          phone: isOffline ? b.guest_phone : profiles?.phone || "",
          amount: `₹${b.paid_amount}`,
          type: isTableBooking ? "Table Booking" : "Pay Bill",
          typeColor: isTableBooking ? "#63A1FD" : "#7300FF",
          amountColor: "#00B562",
          time: timeStr,
          avatarUrl: profiles?.avatar_url,
        });
      });

      const formattedPayments: DinePaymentData[] = Object.keys(grouped).map(date => ({
        date,
        data: grouped[date],
      }));

      setPayments(formattedPayments);
    } catch (error) {
      console.error("Error fetching dine payments:", error);
    } finally {
      setPaymentsLoading(false);
    }
  }, [serviceId]);

  // Handle Filter -> Date mapping
  useEffect(() => {
    const today = new Date();
    if (filter === "Today") {
      setSelectedDate(today);
    } else if (filter === "Tomorrow") {
      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1);
      setSelectedDate(tomorrow);
    }
  }, [filter]);

  // Sync refs and trigger fetch when filters or date change
  useEffect(() => {
    filterRef.current = filter;
    dateRef.current = selectedDate;
    fetchBookings();
    fetchPayments();
  }, [filter, selectedDate, fetchBookings, fetchPayments]);

  // Initial Load (Venue only)
  useEffect(() => {
    const loadInitial = async () => {
      setInitialLoading(true);
      await fetchVenueDetails();
      setInitialLoading(false);
    };
    loadInitial();
  }, [fetchVenueDetails]);

  // Dependent Load (Realtime Subscription only)
  useEffect(() => {
    // Set up Realtime Subscription
    const channel = supabase
      .channel(`dine_home_${serviceId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "dining_bookings",
          filter: `venue_id=eq.${serviceId}`,
        },
        _payload => {
          // Refresh both lists when any change occurs
          fetchBookings();
          fetchPayments();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchBookings, fetchPayments, serviceId]);

  return {
    initialLoading,
    bookingsLoading,
    paymentsLoading,
    venue,
    selectedDate,
    setSelectedDate,
    bookings,
    payments,
    activeTab,
    setActiveTab,
    filter,
    setFilter,
    refreshBookings: fetchBookings,
    refreshPayments: fetchPayments,
    refresh: () => {
      fetchBookings();
      fetchPayments();
    },
  };
};
