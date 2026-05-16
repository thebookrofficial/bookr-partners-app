// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import { useState, useCallback, useMemo, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { useAuthStore } from "../../../store";
import { StaycationVenue } from "../types/staycation.types";

interface UseStaycationVenuesOptions {
  propertyType?: string;
  bookingType?: string;
  initialVenueId?: string;
}

export const useStaycationVenues = (options: UseStaycationVenuesOptions = {}) => {
  const { propertyType, bookingType, initialVenueId } = options;
  const { clientProfile } = useAuthStore();

  const [isLoading, setIsLoading] = useState(true);
  const [venues, setVenues] = useState<StaycationVenue[]>([]);
  const [activeVenueId, setActiveVenueId] = useState<string | null>(null);

  const fetchVenues = useCallback(
    async (forcedVenueId?: string) => {
      if (!clientProfile?.id) {
        return;
      }

      try {
        setIsLoading(true);

        let query = supabase
          .from("venues")
          .select(
            `
            id,
            name,
            cover_image_url,
            vertical,
            owner_id,
            staycation_venues!inner (
              id,
              property_type,
              booking_type
            )
          `,
          )
          .eq("owner_id", clientProfile.id)
          .eq("vertical", "staycation");

        if (propertyType) query = query.eq("staycation_venues.property_type", propertyType);
        if (bookingType) query = query.eq("staycation_venues.booking_type", bookingType);

        const { data, error } = await query;

        if (error) throw error;

        const allVenues: StaycationVenue[] = (data || []).map((v: any) => {
          const sv = Array.isArray(v.staycation_venues)
            ? v.staycation_venues[0]
            : v.staycation_venues;

          const pType = (sv?.property_type || "").toLowerCase();
          const bType = (sv?.booking_type || "").toLowerCase();

          const label =
            bType === "per_room" ? "Rooms" : pType.charAt(0).toUpperCase() + pType.slice(1);

          return {
            id: sv?.id,
            venueId: v.id,
            name: v.name,
            cover_image_url: v.cover_image_url,
            property_type: pType,
            booking_type: bType,
            tabLabel: label,
          };
        });

        const labelCounts: Record<string, number> = {};
        const uniqueVenues = allVenues.map(v => {
          const base = v.tabLabel || "Venue";
          labelCounts[base] = (labelCounts[base] || 0) + 1;
          return labelCounts[base] > 1 ? { ...v, tabLabel: `${base} ${labelCounts[base]}` } : v;
        });

        setVenues(uniqueVenues);

        if (uniqueVenues.length > 0) {
          let currentId = forcedVenueId || activeVenueId || initialVenueId;
          const exists = uniqueVenues.find(v => v.id === currentId);

          if (!currentId || !exists) {
            if (initialVenueId) {
              const matchedByVenueId = uniqueVenues.find(v => v.venueId === initialVenueId);
              currentId = matchedByVenueId ? matchedByVenueId.id : uniqueVenues[0].id;
            } else {
              currentId = uniqueVenues[0].id;
            }
          }

          setActiveVenueId(currentId);
        }
      } catch (err) {
        console.error("Home venues fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [clientProfile?.id, propertyType, bookingType, initialVenueId, activeVenueId],
  );

  useEffect(() => {
    fetchVenues();
  }, [fetchVenues]);

  const activeVenue = useMemo(
    () => venues.find(v => v.id === activeVenueId),
    [venues, activeVenueId],
  );

  return {
    isLoading,
    venues,
    activeVenue,
    activeVenueId,
    setActiveVenueId: (id: string) => {
      setActiveVenueId(id);
    },
    refetch: fetchVenues,
  };
};
