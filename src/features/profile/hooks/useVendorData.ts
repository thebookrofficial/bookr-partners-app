// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store";

// Interface aligned with Blueprint Table 6.1: venues
interface Venue {
  id: string;
  owner_id: string;
  city_id: string;
  vertical: "sports" | "events" | "dining" | "staycation";
  name: string;
  slug: string;
  address_line: string;
  cover_image_url: string | null;
  status: "draft" | "pending_approval" | "active" | "inactive" | "suspended";
  avg_rating: number;
  total_reviews: number;
  sports_venues?: { sports_type: string }[];
}

export const useVendorData = () => {
  const { user, setProfile, setClientProfile } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [venues, setVenues] = useState<Venue[]>([]);

  const fetchVendorContext = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      // 1. Fetch Personal Profile (Blueprint Table 4.1)
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) throw profileError;
      if (profileData) setProfile(profileData);

      // 2. Fetch Client Profile (Blueprint Table 4.2)
      const { data: clientData, error: clientError } = await supabase
        .from("client_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (clientError) throw clientError;

      if (clientData) {
        setClientProfile(clientData);

        // 3. Fetch Venues (Blueprint Table 6.1)
        const { data: venuesData, error: venuesError } = await supabase
          .from("venues")
          .select("*, sports_venues(sports_type)")
          .eq("owner_id", clientData.id)
          .eq("status", "active")
          .is("deleted_at", null);

        if (venuesError) throw venuesError;
        setVenues((venuesData as Venue[]) || []);
      } else {
        setClientProfile(null);
        setVenues([]);
      }
    } catch (error) {
      console.error("Error fetching vendor data:", error);
    } finally {
      setLoading(false);
    }
  }, [user, setProfile, setClientProfile]);

  useEffect(() => {
    fetchVendorContext();
  }, [fetchVendorContext]);

  return { loading, venues, refresh: fetchVendorContext };
};
