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
  status: "available" | "booked" | "blocked" | "maintenance"; // DB enums
  raw_start_time: string;
}

export const useSportsHome = (venueId: string) => {
  const [venue, setVenue] = useState<VenueData | null>(null);
  const [grounds, setGrounds] = useState<GroundData[]>([]);
  const [activeGroundId, setActiveGroundId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [slots, setSlots] = useState<SlotData[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  // 1. Fetch Venue & Grounds (Runs once on mount)
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
      // Format date to YYYY-MM-DD for Postgres
      const dateString = selectedDate.toISOString().split("T")[0];

      const { data: slotsData, error } = await supabase
        .from("sports_slots")
        .select("id, start_time, status")
        .eq("venue_id", venueId)
        .eq("ground_id", activeGroundId)
        .eq("slot_date", dateString)
        .order("start_time", { ascending: true });

      if (error) throw error;

      // Map DB slots to UI friendly format
      const formattedSlots: SlotData[] = (slotsData || []).map(slot => {
        // Convert "14:00:00" to "2 Pm"
        const [hours] = slot.start_time.split(":");
        const hourInt = parseInt(hours, 10);
        const ampm = hourInt >= 12 ? "Pm" : "AM";
        const displayHour = hourInt % 12 || 12;

        return {
          id: slot.id,
          time: `${displayHour} ${ampm}`,
          status: slot.status,
          raw_start_time: slot.start_time,
        };
      });

      setSlots(formattedSlots);
    } catch (error) {
      console.error("Error fetching slots:", error);
    } finally {
      setSlotsLoading(false);
    }
  }, [venueId, activeGroundId, selectedDate]);

  useEffect(() => {
    if (venueId) fetchVenueDetails();
  }, [venueId, fetchVenueDetails]);

  // Trigger slot fetch when Ground or Date changes
  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  return {
    venue,
    grounds,
    activeGroundId,
    setActiveGroundId,
    selectedDate,
    setSelectedDate,
    slots,
    slotsLoading,
    loading,
  };
};
