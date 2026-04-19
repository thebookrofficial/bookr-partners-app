// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

interface VenueData {
  id: string;
  name: string;
  vertical: string;
  cover_image_url: string | null;
}

interface GroundData {
  id: string;
  name: string;
}

export interface SlotData {
  id: string;
  time: string;
  status: "available" | "booked" | "blocked" | "maintenance";
  raw_start_time: string;
  isManualBooking?: boolean;
}

export interface BookingData {
  id: string;
  name: string;
  phone: string;
  date: string;
  time: string;
  price: string;
  status: "Online" | "Offline" | "Advance" | "Settlement" | "Full";
  avatarUrl?: string;
  isOfflineRecord: boolean;
}

export const useSportsHome = (venueId: string) => {
  const [venue, setVenue] = useState<VenueData | null>(null);
  const [grounds, setGrounds] = useState<GroundData[]>([]);
  const [activeGroundId, setActiveGroundId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const [slots, setSlots] = useState<SlotData[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  // 1. Fetch Venue & Grounds
  const fetchVenueDetails = useCallback(async () => {
    setLoading(true);
    try {
      const { data: venueData, error: venueError } = await supabase
        .from("venues")
        .select("id, name, vertical, cover_image_url")
        .eq("id", venueId)
        .single();

      if (venueError) throw venueError;
      if (venueData) setVenue(venueData);

      const { data: groundsData, error: groundsError } = await supabase
        .from("sports_grounds")
        .select("id, name")
        .eq("venue_id", venueId)
        .order("display_order", { ascending: true });

      if (groundsError) throw groundsError;

      if (groundsData && groundsData.length > 0) {
        setGrounds(groundsData);
        setActiveGroundId(groundsData[0].id);
      }
    } catch (error) {
      console.error("Error fetching sports home data:", error);
    } finally {
      setLoading(false);
    }
  }, [venueId]);

  // 2. Fetch Slots for active Ground & Date
  const fetchSlots = useCallback(async () => {
    if (!activeGroundId) return;

    setSlotsLoading(true);
    try {
      const dateString = selectedDate.toISOString().split("T")[0];

      const { data: slotsData, error } = await supabase
        .from("sports_slots")
        .select(
          `id, 
          start_time, 
          status, 
          sports_bookings ( platform_fee, gateway_fee )`,
        )
        .eq("venue_id", venueId)
        .eq("ground_id", activeGroundId)
        .eq("slot_date", dateString)
        .order("start_time", { ascending: true });

      if (error) throw error;

      const formattedSlots: SlotData[] = (slotsData || []).map(slot => {
        const [hours] = slot.start_time.split(":");
        const hourInt = parseInt(hours, 10);
        const ampm = hourInt >= 12 ? "Pm" : "AM";
        const displayHour = hourInt % 12 || 12;
        const booking = slot.sports_bookings?.[0];
        const isManual = booking ? booking.platform_fee === 0 && booking.gateway_fee === 0 : false;

        return {
          id: slot.id,
          time: `${displayHour} ${ampm}`,
          status: slot.status,
          raw_start_time: slot.start_time,
          isManualBooking: isManual,
        };
      });

      setSlots(formattedSlots);
    } catch (error) {
      console.error("Error fetching slots:", error);
    } finally {
      setSlotsLoading(false);
    }
  }, [venueId, activeGroundId, selectedDate]);

  // 3. Fetch Bookings for active Ground & Date
  const fetchBookings = useCallback(async () => {
    if (!activeGroundId) return;

    setBookingsLoading(true);
    try {
      const dateString = selectedDate.toISOString().split("T")[0];

      const { data: bookingsData, error } = await supabase
        .from("sports_bookings")
        .select(
          `
          id,
          total_amount,
          platform_fee,
          gateway_fee,
          guest_name,
          guest_phone,
          profiles ( full_name, phone, avatar_url ),
          sports_slots!inner ( start_time, end_time, ground_id, slot_date )
        `,
        )
        .eq("venue_id", venueId)
        .eq("sports_slots.ground_id", activeGroundId)
        .eq("sports_slots.slot_date", dateString)
        .order("created_at", { ascending: false }); // Show newest first

      if (error) throw error;

      const formattedBookings: BookingData[] = (bookingsData || []).map((b: any) => {
        const formatHour = (timeStr: string) => {
          const [h] = timeStr.split(":");
          const hourInt = parseInt(h, 10);
          const ampm = hourInt >= 12 ? "PM" : "AM";
          const displayHour = hourInt % 12 || 12;
          return `${displayHour} ${ampm}`;
        };

        const slotDate = new Date(b.sports_slots.slot_date);
        const formattedDate = slotDate.toLocaleDateString("en-GB", {
          weekday: "short",
          day: "numeric",
          month: "short",
          year: "numeric",
        });

        // FIX: If platform and gateway fees are 0, it's a manual/offline booking
        const isOffline = b.platform_fee === 0 && b.gateway_fee === 0;

        return {
          id: b.id,
          name: b.profiles?.full_name || b.guest_name || "Guest User",
          phone: b.profiles?.phone || b.guest_phone || "",
          date: formattedDate,
          time: `${formatHour(b.sports_slots.start_time)} - ${formatHour(b.sports_slots.end_time)}`,
          price: `₹${b.total_amount || 0}`,
          status: isOffline ? "Offline" : "Online",
          avatarUrl: b.profiles?.avatar_url,
          isOfflineRecord: isOffline,
        };
      });

      setBookings(formattedBookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setBookingsLoading(false);
    }
  }, [venueId, activeGroundId, selectedDate]);

  useEffect(() => {
    if (venueId) fetchVenueDetails();
  }, [venueId, fetchVenueDetails]);

  // Trigger both fetches when Ground or Date changes
  useEffect(() => {
    fetchSlots();
    fetchBookings();
  }, [fetchSlots, fetchBookings]);

  return {
    venue,
    grounds,
    activeGroundId,
    setActiveGroundId,
    selectedDate,
    setSelectedDate,
    slots,
    slotsLoading,
    bookings,
    bookingsLoading,
    loading,
    refresh: () => {
      fetchSlots();
      fetchBookings();
    },
  };
};
