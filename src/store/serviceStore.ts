import { create } from "zustand";

interface ServiceState {
  selectedCategories: Record<string, string>;
  activeVenueName: string;
  setServiceCategory: (serviceId: string, category: string) => void;
  setActiveVenueName: (name: string) => void;
}

export const useServiceStore = create<ServiceState>(set => ({
  selectedCategories: {},
  activeVenueName: "Loading...",
  setServiceCategory: (serviceId, category) => {
    set(state => ({
      selectedCategories: {
        ...state.selectedCategories,
        [serviceId]: category,
      },
    }));
  },
  setActiveVenueName: name => set({ activeVenueName: name }),
}));
