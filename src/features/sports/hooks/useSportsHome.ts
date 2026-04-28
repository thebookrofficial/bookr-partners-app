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
  duration_minutes?: number;
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

// Helper to guarantee timezone-safe local date strings!
const getLocalDateString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Helper to format raw database sports_type into beautiful display names
const formatCategoryName = (dbName: string) => {
  const MAP: Record<string, string> = {
    football: "Football",
    box_cricket: "Box Cricket",
    pickleball: "Pickleball",
    cricket: "Cricket",
  };
  if (MAP[dbName]) return MAP[dbName];
  // Fallback: replaces underscores with spaces and capitalizes each word
  return dbName
    .split("_")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export const useSportsHome = (initialVenueId: string, category: string) => {
  const [currentVenueId, setCurrentVenueId] = useState<string>(initialVenueId);
  const [venue, setVenue] = useState<VenueData | null>(null);
  const [grounds, setGrounds] = useState<GroundData[]>([]);
  const [activeGroundId, setActiveGroundId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const [slots, setSlots] = useState<SlotData[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  // 1. SMART FETCH: Finds the venue matching the selected category
  const fetchVenueDetails = useCallback(async () => {
    setLoading(true);
    try {
      const dbSportType = category.toLowerCase().replace(" ", "_");

      const { data: initialVenue, error: initialError } = await supabase
        .from("venues")
        .select("owner_id")
        .eq("id", initialVenueId)
        .single();

      if (initialError || !initialVenue) throw initialError || new Error("Owner not found");

      // Fetch all sports categories owned by this specific vendor
      const { data: allSportsData } = await supabase
        .from("venues")
        .select(`sports_venues!inner ( sports_type )`)
        .eq("owner_id", initialVenue.owner_id);

      if (allSportsData) {
        const uniqueTypes = new Set<string>();
        allSportsData.forEach((v: any) => {
          const sv = v.sports_venues;
          if (Array.isArray(sv)) {
            sv.forEach((s: any) => uniqueTypes.add(s.sports_type));
          } else if (sv) {
            uniqueTypes.add(sv.sports_type);
          }
        });
        const categoriesArray = Array.from(uniqueTypes).map(formatCategoryName);
        setAvailableCategories(categoriesArray);
      }

      const { data: matchedVenue, error: matchedError } = await supabase
        .from("venues")
        .select(
          `
          id, name, vertical, cover_image_url,
          sports_venues!inner ( sports_type )
        `,
        )
        .eq("owner_id", initialVenue.owner_id)
        .eq("sports_venues.sports_type", dbSportType)
        .limit(1)
        .maybeSingle();

      if (matchedError) throw matchedError;

      if (matchedVenue) {
        setCurrentVenueId(matchedVenue.id);
        setVenue({
          id: matchedVenue.id,
          name: matchedVenue.name,
          vertical: matchedVenue.vertical,
          cover_image_url: matchedVenue.cover_image_url,
        });

        const { data: groundsData } = await supabase
          .from("sports_grounds")
          .select("id, name")
          .eq("venue_id", matchedVenue.id)
          .order("display_order", { ascending: true });

        if (groundsData && groundsData.length > 0) {
          setGrounds(groundsData);
          setActiveGroundId(groundsData[0].id);
        } else {
          setGrounds([]);
          setActiveGroundId("");
        }
      } else {
        setVenue(null);
        setGrounds([]);
        setActiveGroundId("");
        setSlots([]);
        setBookings([]);
      }
    } catch (error) {
      console.error("Error fetching sports home data:", error);
    } finally {
      setLoading(false);
    }
  }, [initialVenueId, category]);

  // 2. Fetch Slots using SAFE Local Date
  const fetchSlots = useCallback(async () => {
    if (!activeGroundId || !currentVenueId) return;

    setSlotsLoading(true);
    try {
      // EXACT SAME DATE STRING GENERATOR FOR BOTH
      const localDateString = getLocalDateString(selectedDate);

      const { data: slotsData, error } = await supabase
        .from("sports_slots")
        .select(
          `id, 
          start_time, 
          end_time, 
          status, 
          sports_bookings ( platform_fee, gateway_fee )`,
        )
        .eq("venue_id", currentVenueId)
        .eq("ground_id", activeGroundId)
        .eq("slot_date", localDateString) // <--- SAFE DATE
        .order("start_time", { ascending: true });

      if (error) throw error;

      const formattedSlots: SlotData[] = (slotsData || []).map(slot => {
        const [startHStr, startMStr] = slot.start_time.split(":");
        const hourInt = parseInt(startHStr, 10);
        const ampm = hourInt >= 12 ? "Pm" : "AM";
        const displayHour = hourInt % 12 || 12;
        const displayMins = startMStr === "00" ? "" : `:${startMStr}`;

        const booking = slot.sports_bookings?.[0];
        const isManual = booking ? booking.platform_fee === 0 && booking.gateway_fee === 0 : false;

        const startH = parseInt(startHStr, 10);
        const startM = parseInt(startMStr, 10);
        const [endH, endM] = slot.end_time.split(":").map(Number);
        let durationMins = endH * 60 + endM - (startH * 60 + startM);
        if (durationMins < 0) durationMins += 24 * 60;

        return {
          id: slot.id,
          time: `${displayHour}${displayMins} ${ampm}`,
          status: slot.status,
          raw_start_time: slot.start_time,
          duration_minutes: durationMins,
          isManualBooking: isManual,
        };
      });

      setSlots(formattedSlots);
    } catch (error) {
      console.error("Error fetching slots:", error);
    } finally {
      setSlotsLoading(false);
    }
  }, [currentVenueId, activeGroundId, selectedDate]);

  // 3. Fetch Bookings using SAFE Local Date
  const fetchBookings = useCallback(async () => {
    if (!activeGroundId || !currentVenueId) return;

    setBookingsLoading(true);
    try {
      // EXACT SAME DATE STRING GENERATOR FOR BOTH
      const localDateString = getLocalDateString(selectedDate);

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
        .eq("venue_id", currentVenueId)
        .eq("sports_slots.ground_id", activeGroundId)
        .eq("sports_slots.slot_date", localDateString) // <--- SAFE DATE (This is what caused the desync)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedBookings: BookingData[] = (bookingsData || []).map((b: any) => {
        const formatTime = (timeStr: string) => {
          const [h, m] = timeStr.split(":");
          const hourInt = parseInt(h, 10);
          const ampm = hourInt >= 12 ? "Pm" : "Am";
          const displayHour = hourInt % 12 || 12;
          const displayMins = m === "00" ? "" : `:${m}`;
          return `${displayHour}${displayMins} ${ampm}`;
        };

        const slotDate = new Date(b.sports_slots.slot_date);
        const formattedDate = slotDate.toLocaleDateString("en-GB", {
          weekday: "short",
          day: "numeric",
          month: "short",
          year: "numeric",
        });

        const isOffline = b.platform_fee === 0 && b.gateway_fee === 0;

        return {
          id: b.id,
          name: b.profiles?.full_name || b.guest_name || "Guest User",
          phone: b.profiles?.phone || b.guest_phone || "",
          date: formattedDate,
          time: `${formatTime(b.sports_slots.start_time)} - ${formatTime(b.sports_slots.end_time)}`,
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
  }, [currentVenueId, activeGroundId, selectedDate]);

  useEffect(() => {
    if (initialVenueId) fetchVenueDetails();
  }, [initialVenueId, category, fetchVenueDetails]);

  useEffect(() => {
    fetchSlots();
    fetchBookings();
  }, [fetchSlots, fetchBookings]);

  // Real-time listener for bookings
  useEffect(() => {
    if (!currentVenueId) return;

    const channel = supabase
      .channel(`sports_bookings_${currentVenueId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "sports_bookings",
          filter: `venue_id=eq.${currentVenueId}`,
        },
        () => {
          fetchSlots();
          fetchBookings();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentVenueId, fetchSlots, fetchBookings]);

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
    availableCategories,
    refresh: () => {
      fetchSlots();
      fetchBookings();
    },
  };
};
