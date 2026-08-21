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
  area_id?: string;
  vertical: "sports" | "events" | "dining" | "staycation";
  name: string;
  slug: string;
  address_line: string;
  cover_image_url: string | null;
  status: "draft" | "pending_approval" | "active" | "inactive" | "suspended";
  avg_rating: number;
  total_reviews: number;
  sports_venues?: { sports_type: string }[];
  events?: { title: string; cover_image_url?: string | null; event_status?: string }[];
  cities?: { name: string };
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
        let venuesQuery = supabase
          .from("venues")
          .select(
            "*, sports_venues(sports_type), events(title, cover_image_url, event_status), cities(name)",
          )
          .eq("status", "active")
          .is("deleted_at", null);

        if (clientData.client_role === "owner") {
          venuesQuery = venuesQuery.eq("owner_id", clientData.id);
        } else if (clientData.client_role === "staff") {
          if (clientData.assigned_venue_ids && clientData.assigned_venue_ids.length > 0) {
            venuesQuery = venuesQuery.in("id", clientData.assigned_venue_ids);
          } else {
            // Staff with no assigned venues sees no venues
            setVenues([]);
            return;
          }
        }

        const { data: venuesData, error: venuesError } = await venuesQuery;

        if (venuesError) throw venuesError;

        // Filter out event venues that do not have any published events
        const activeVenues = ((venuesData as Venue[]) || []).filter(venue => {
          if (venue.vertical === "events") {
            // An event venue must have at least one published event to be visible
            return venue.events && venue.events.some(e => e.event_status === "published");
          }
          return true;
        });

        setVenues(activeVenues);
      } else {
        setClientProfile(null);
        setVenues([]);
      }
    } catch (error) {
      console.error("Error fetching vendor data:", JSON.stringify(error, null, 2));
    } finally {
      setLoading(false);
    }
  }, [user, setProfile, setClientProfile]);

  useEffect(() => {
    fetchVendorContext();
  }, [fetchVendorContext]);

  return { loading, venues, refresh: fetchVendorContext };
};
