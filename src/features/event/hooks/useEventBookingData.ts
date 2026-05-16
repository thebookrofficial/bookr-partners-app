// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import { useState, useEffect, useCallback } from "react";
import { fetchEventAvailability } from "../services/event.service";
import { EventAvailabilityData } from "../types/event.types";

/**
 * Custom hook to fetch and manage event availability data for the booking flow.
 *
 * @param eventId - The unique identifier of the event.
 * @returns An object containing the availability data, loading state, error, and a refetch function.
 */
export const useEventBookingData = (eventId: string) => {
  const [data, setData] = useState<EventAvailabilityData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadAvailability = useCallback(async () => {
    if (!eventId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchEventAvailability(eventId);
      setData(result);
    } catch (err: any) {
      setError(err.message || "Failed to fetch event availability");
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadAvailability();
  }, [loadAvailability]);

  return {
    data,
    isLoading,
    error,
    refetch: loadAvailability,
  };
};
