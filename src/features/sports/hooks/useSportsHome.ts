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

export const useSportsHome = (venueId: string) => {
  const [venue, setVenue] = useState<VenueData | null>(null);
  const [grounds, setGrounds] = useState<GroundData[]>([]);
  const [activeGroundId, setActiveGroundId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const fetchVenueDetails = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch Venue (Table 6.1)
      const { data: venueData, error: venueError } = await supabase
        .from("venues")
        .select("id, name, vertical, cover_image_url")
        .eq("id", venueId)
        .single();

      if (venueError) throw venueError;
      if (venueData) setVenue(venueData);

      // 2. Fetch Associated Grounds (Assuming Table 6.2 or similar exists)
      // For now, we will mock this until the specific ground table architecture is locked.
      const mockGrounds = [
        { id: "g1", name: "Ground 1" },
        { id: "g2", name: "Ground 2" },
      ];
      setGrounds(mockGrounds);
      setActiveGroundId(mockGrounds[0].id);
    } catch (error) {
      console.error("Error fetching sports home data:", error);
    } finally {
      setLoading(false);
    }
  }, [venueId]);

  useEffect(() => {
    if (venueId) fetchVenueDetails();
  }, [venueId, fetchVenueDetails]);

  return {
    venue,
    grounds,
    activeGroundId,
    setActiveGroundId,
    selectedDate,
    setSelectedDate,
    loading,
  };
};
