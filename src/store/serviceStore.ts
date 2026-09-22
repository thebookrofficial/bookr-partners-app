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
  activeStaycationVenueId: string;
  lastSelectedService: LastSelectedService | null;
  hasNavigatedInitially: boolean;
  setServiceCategory: (serviceId: string, category: string) => void;
  setActiveVenueName: (name: string) => void;
  setActiveServiceId: (id: string) => void;
  setActiveStaycationVenueId: (id: string) => void;
  setLastSelectedService: (service: LastSelectedService | null) => void;
  setHasNavigatedInitially: (status: boolean) => void;
  isTabBarVisible: boolean;
  setTabBarVisible: (visible: boolean) => void;
  eventFeatureFlags: { spotEntryEnabled: boolean; guestInviteEnabled: boolean };
  setEventFeatureFlags: (flags: { spotEntryEnabled: boolean; guestInviteEnabled: boolean }) => void;
}

export const useServiceStore = create<ServiceState>()(
  persist(
    set => ({
      selectedCategories: {},
      activeVenueName: "Loading...",
      activeServiceId: "",
      activeStaycationVenueId: "",
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
      setActiveStaycationVenueId: id => set({ activeStaycationVenueId: id }),
      setLastSelectedService: service => set({ lastSelectedService: service }),
      setHasNavigatedInitially: status => set({ hasNavigatedInitially: status }),
      isTabBarVisible: true,
      setTabBarVisible: visible => set({ isTabBarVisible: visible }),
      eventFeatureFlags: { spotEntryEnabled: true, guestInviteEnabled: true },
      setEventFeatureFlags: flags => set({ eventFeatureFlags: flags }),
    }),
    {
      name: "service-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({ lastSelectedService: state.lastSelectedService }),
    },
  ),
);
