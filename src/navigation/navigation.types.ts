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
  AcceptInvite: undefined;
  LegalView: { title: string; content: string };
};

// 2. Define the Bottom Tab screens for Sports
export type SportsTabParamList = {
  SportsHome: { serviceId: string; category?: string };
  SportsHistory: { serviceId: string; category?: string };
  SportsDashboard: { serviceId: string; category?: string };
  SportsEssentials: { serviceId: string; category?: string };
  SportsProfile: undefined;
  BlockUnblock: { venueId: string; groundId: string };
};

// 2.2 Define the Bottom Tab screens for Staycation
export type StaycationTabParamList = {
  StaycationHome: { serviceId: string };
  StaycationHistory: { serviceId: string };
  StaycationDashboard: { serviceId: string };
  StaycationEssentials: { serviceId: string };
  StaycationProfile: { serviceId: string };
  StaycationCloseDate: { serviceId: string };
  StaycationOffers: { serviceId: string };
};

// 2.3 Define the Bottom Tab screens for Events
export type EventTabParamList = {
  EventHome: { serviceId: string };
  EventHistory: { serviceId: string };
  EventScan: { serviceId: string };
  EventGuestInvite: { serviceId: string };
  EventSpotEntry: { serviceId: string };
  EventProfile: undefined;
};

// 3. Define the screens in the Main Business flow
export type MainStackParamList = {
  Dashboard: undefined;
  VendorProfile: undefined;
  AddStaff: undefined;
  EditStaff: { staffId: string; staffData?: any };
  StaffManagement: { venueId?: string; serviceCategory?: string } | undefined;
  EditProfile: undefined;
  AddService: undefined;
  Settings: undefined;
  NotificationSettings: undefined;
  LegalView: { title: string; content: string };

  SportsServiceTabs: NavigatorScreenParams<SportsTabParamList>;
  StaycationServiceTabs: NavigatorScreenParams<StaycationTabParamList>;
  EventServiceTabs: NavigatorScreenParams<EventTabParamList>;
  BookingDetails: { bookingId: string; idChain?: string[] };
  StaycationBookingDetails: { booking: any };
  StaycationInvoice: { bookingId: string };
  StaycationCloseDate: { serviceId: string };
  StaycationOffers: { serviceId: string };
  EventCloseDate: { serviceId: string };
  EventGuestInvite: { serviceId: string };
  EventExportBookings: { serviceId: string };
  EventEntryDetails: { entryId: string };
  EventScanConfirmation: { attendee: any; isInvite?: boolean };
  GuestHistory: {
    bookingId: string;
    guestId?: string;
    vertical: "sports" | "staycation" | "dining" | "events";
    venueId?: string;
  };
  BlockUnblock: { venueId: string; groundId: string };
  BulkBooking: { venueId: string; groundId?: string; type?: "multi" | "single" };
  BulkBookingDetails: {
    bookingId: string;
    venueId: string;
    groundId: string;
    refreshKey?: string;
    type?: "multi" | "single";
  };
  RescheduleBooking: { bookingId: string; venueId: string; groundId: string; idChain?: string[] };
  RepeatBooking: { bookingId: string; venueId: string; groundId: string; idChain?: string[] };
  Payouts: { venueId: string };
  PayoutDetails: {
    venueId: string;
    startDate: string;
    endDate: string;
    displayLabel: string;
    totalBookings: number;
  };
  SportsInvoice: { bookingId: string };
  FAQ: { vertical: "sports" | "staycation" };
  AcceptInvite: undefined;
  PaymentHistory: { bookingId: string };
  // Future screens: Bookings, Earnings, Profile, etc.
};

// 4. Define the Root flow (Switches between Auth and Main)
export type RootStackParamList = {
  Auth: undefined;
  Main: NavigatorScreenParams<MainStackParamList>;
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
