// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import { create } from "zustand";

interface ServiceState {
  /**
   * Mapping of serviceId to selected sub-category name
   * E.g., { "service-123": "Football" }
   */
  selectedCategories: Record<string, string>;
  setServiceCategory: (serviceId: string, category: string) => void;
}

export const useServiceStore = create<ServiceState>(set => ({
  selectedCategories: {},
  setServiceCategory: (serviceId, category) =>
    set(state => ({
      selectedCategories: {
        ...state.selectedCategories,
        [serviceId]: category,
      },
    })),
}));
