// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import { NativeStackScreenProps } from "@react-navigation/native-stack";

// 1. Define the screens in the Authentication flow
export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

// 2. Define the screens in the Main Business flow
export type MainStackParamList = {
  Dashboard: undefined;
  VendorProfile: undefined;
  AddStaff: undefined;
  EditProfile: undefined;
  AddService: undefined;
  // Future screens: Bookings, Earnings, Profile, etc.
};

// 3. Define the Root flow (Switches between Auth and Main)
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

// 4. Export Screen Props for easy typing inside the screen components
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

// 5. Global declaration so the `useNavigation` hook is strictly typed everywhere
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
