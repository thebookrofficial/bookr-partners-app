// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import { useCallback } from "react";
import { useStaycationVenues } from "./useStaycationVenues";
import { useFocusEffect } from "@react-navigation/native";

/**
 * Hook for managing staycation home screen state (venue list and active venue type).
 */
export const useStaycationHome = (initialServiceId?: string) => {
  const { isLoading, venues, activeVenue, setActiveVenueId, refetch } = useStaycationVenues({
    initialVenueId: initialServiceId,
  });

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  return {
    isLoading,
    venues,
    activeVenue,
    setActiveVenueId,
    refetch,
  };
};
