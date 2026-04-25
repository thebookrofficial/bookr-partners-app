// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export const useStaycationHome = (serviceId: string) => {
  const [initialLoading, setInitialLoading] = useState(true);
  const [venue, setVenue] = useState<any>(null);
  const [closedDates, setClosedDates] = useState<any[]>([]);

  const fetchVenueDetails = useCallback(async () => {
    if (!serviceId) return;
    try {
      const { data, error } = await supabase
        .from("venues")
        .select("id, name, cover_image_url")
        .eq("id", serviceId)
        .single();

      if (error) throw error;
      setVenue(data);
    } catch (error) {
      console.error("Error fetching staycation venue details:", error);
    }
  }, [serviceId]);

  const fetchClosedDates = useCallback(async () => {
    if (!serviceId) return;
    try {
      const { data, error } = await supabase
        .from("venue_closed_dates")
        .select("*")
        .eq("venue_id", serviceId);

      if (error) throw error;
      setClosedDates(data || []);
    } catch (error) {
      console.error("Error fetching staycation closed dates:", error);
    }
  }, [serviceId]);

  useEffect(() => {
    const loadInitial = async () => {
      setInitialLoading(true);
      await Promise.all([fetchVenueDetails(), fetchClosedDates()]);
      setInitialLoading(false);
    };
    loadInitial();
  }, [fetchVenueDetails, fetchClosedDates]);

  return {
    initialLoading,
    venue,
    closedDates,
    refresh: () => {
      fetchVenueDetails();
      fetchClosedDates();
    },
  };
};
