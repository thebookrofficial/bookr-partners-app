import { create } from "zustand";

interface ServiceState {
  selectedCategories: Record<string, string>;
  activeVenueName: string;
  activeServiceId: string;
  setServiceCategory: (serviceId: string, category: string) => void;
  setActiveVenueName: (name: string) => void;
  setActiveServiceId: (id: string) => void;
}

export const useServiceStore = create<ServiceState>(set => ({
  selectedCategories: {},
  activeVenueName: "Loading...",
  activeServiceId: "",
  setServiceCategory: (serviceId, category) => {
    set(state => ({
      selectedCategories: {
        ...state.selectedCategories,
        [serviceId]: category,
      },
    }));
  },
  setActiveVenueName: name => set({ activeVenueName: name }),
  setActiveServiceId: id => set({ activeServiceId: id }),
}));
