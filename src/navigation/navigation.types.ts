// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { NavigatorScreenParams } from "@react-navigation/native";

// 1. Define the screens in the Authentication flow
export type AuthStackParamList = {
  Login: undefined;
  Otp: { email: string };
  Signup: undefined;
};

// 2. Define the Bottom Tab screens for Sports
export type SportsTabParamList = {
  SportsHome: { serviceId: string };
  SportsHistory: { serviceId: string };
  SportsDashboard: { serviceId: string };
  SportsEssentials: { serviceId: string };
  SportsProfile: { serviceId: string };
  BlockUnblock: { venueId: string; groundId: string };
};

// 2.1 Define the Bottom Tab screens for Dine
export type DineTabParamList = {
  DineHome: { serviceId: string };
  DineHistory: { serviceId: string };
  DineDashboard: { serviceId: string };
  DineEssentials: { serviceId: string };
  DineProfile: { serviceId: string };
  DineCloseDate: { serviceId: string };
  DineOffers: { serviceId: string };
};

// 2.2 Define the Bottom Tab screens for Staycation
export type StaycationTabParamList = {
  StaycationHome: { serviceId: string };
  StaycationHistory: { serviceId: string };
  StaycationDashboard: { serviceId: string };
  StaycationEssentials: { serviceId: string };
  StaycationProfile: { serviceId: string };
};

// 3. Define the screens in the Main Business flow
export type MainStackParamList = {
  Dashboard: undefined;
  VendorProfile: undefined;
  AddStaff: undefined;
  EditProfile: undefined;
  AddService: undefined;
  Settings: undefined;

  SportsServiceTabs: NavigatorScreenParams<SportsTabParamList>;
  DineServiceTabs: NavigatorScreenParams<DineTabParamList>;
  StaycationServiceTabs: NavigatorScreenParams<StaycationTabParamList>;
  BookingDetails: { bookingId: string };
  DineBookingDetails: { bookingId: string; isFromPayment?: boolean };
  DinePaymentDetails: { bookingId: string };
  DineCloseDate: { serviceId: string };
  DineOffers: { serviceId: string };
  GuestHistory: { guestId: string };
  BlockUnblock: { venueId: string; groundId: string };
  BulkBooking: undefined;
  BulkBookingDetails: { bookingId: string; type: "multi" | "single" };
  // Future screens: Bookings, Earnings, Profile, etc.
};

// 4. Define the Root flow (Switches between Auth and Main)
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

// 5. Export Screen Props for easy typing inside the screen components
export type AuthScreenProps<T extends keyof AuthStackParamList> = NativeStackScreenProps<
  AuthStackParamList,
  T
>;
export type MainScreenProps<T extends keyof MainStackParamList> = NativeStackScreenProps<
  MainStackParamList,
  T
>;
export type RootScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;

export type SportsTabScreenProps<T extends keyof SportsTabParamList> = BottomTabScreenProps<
  SportsTabParamList,
  T
>;

// 6. Global declaration so the `useNavigation` hook is strictly typed everywhere
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
