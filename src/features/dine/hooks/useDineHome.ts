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

  useEffect(() => {
    filterRef.current = filter;
    dateRef.current = selectedDate;
  }, [filter, selectedDate]);

  // Handle Filter Change
  useEffect(() => {
    const today = new Date();
    if (filter === "Today") {
      setSelectedDate(today);
    } else if (filter === "Tommorow") {
      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1);
      setSelectedDate(tomorrow);
    }
    // "All" filter doesn't change selectedDate visually, but fetchBookings handles it
  }, [filter]);

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
          reservation_date,
          reservation_time,
          party_size,
          special_requests,
          paid_amount,
          guest_name,
          guest_phone,
          profiles (
            full_name,
            phone,
            avatar_url
          )
        `,
        )
        .eq("venue_id", serviceId);

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
          const [h, m] = timeStr.split(":");
          const hourInt = parseInt(h, 10);
          const ampm = hourInt >= 12 ? "Pm" : "Am";
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
        const isOffline = !!b.guest_name || !!b.guest_phone;

        return {
          id: b.id,
          name: b.guest_name || profiles?.full_name || "Guest User",
          phone: b.guest_phone || profiles?.phone || "",
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
      const { data, error } = await supabase
        .from("dining_bookings")
        .select(
          `
          id,
          paid_amount,
          reservation_time,
          created_at,
          guest_name,
          guest_phone,
          profiles (
            full_name,
            phone,
            avatar_url
          )
        `,
        )
        .eq("venue_id", serviceId)
        .gt("paid_amount", 0)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const grouped: Record<string, any[]> = {};
      (data || []).forEach((b: any) => {
        const dateObj = new Date(b.created_at);
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
          .replace("am", "Am")
          .replace("pm", "Pm");

        if (!grouped[dateStr]) grouped[dateStr] = [];

        const profiles = Array.isArray(b.profiles) ? b.profiles[0] : b.profiles;

        grouped[dateStr].push({
          id: b.id,
          name: profiles?.full_name || b.guest_name || "Guest User",
          phone: profiles?.phone || b.guest_phone || "",
          amount: `₹${b.paid_amount}`,
          type: "Table Booking",
          typeColor: "#63A1FD",
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

  // Initial Load (Venue only)
  useEffect(() => {
    const loadInitial = async () => {
      setInitialLoading(true);
      await fetchVenueDetails();
      setInitialLoading(false);
    };
    loadInitial();
  }, [fetchVenueDetails]);

  // Dependent Load (Bookings & Payments)
  useEffect(() => {
    fetchBookings();
    fetchPayments();

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
