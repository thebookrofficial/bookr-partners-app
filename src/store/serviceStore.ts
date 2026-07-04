import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface LastSelectedService {
  vertical: string;
  serviceId: string;
  category?: string;
}

interface ServiceState {
  selectedCategories: Record<string, string>;
  activeVenueName: string;
  activeServiceId: string;
  lastSelectedService: LastSelectedService | null;
  hasNavigatedInitially: boolean;
  setServiceCategory: (serviceId: string, category: string) => void;
  setActiveVenueName: (name: string) => void;
  setActiveServiceId: (id: string) => void;
  setLastSelectedService: (service: LastSelectedService | null) => void;
  setHasNavigatedInitially: (status: boolean) => void;
}

export const useServiceStore = create<ServiceState>()(
  persist(
    set => ({
      selectedCategories: {},
      activeVenueName: "Loading...",
      activeServiceId: "",
      lastSelectedService: null,
      hasNavigatedInitially: false,
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
      setLastSelectedService: service => set({ lastSelectedService: service }),
      setHasNavigatedInitially: status => set({ hasNavigatedInitially: status }),
    }),
    {
      name: "service-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({ lastSelectedService: state.lastSelectedService }),
    },
  ),
);
