// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  RootStackParamList,
  AuthStackParamList,
  MainStackParamList,
  SportsTabParamList,
  DineTabParamList,
  StaycationTabParamList,
  EventTabParamList,
} from "./navigation.types";
import { View, StyleSheet, ActivityIndicator, Text as RNText } from "react-native";
import {
  CalendarCheck,
  FileText,
  History as HistoryIcon,
  LayoutDashboard,
  MoreHorizontal,
  User,
} from "lucide-react-native";

import { VendorProfileScreen } from "@/features/profile/screens/VendorProfileScreen";
import { SettingsScreen } from "@/features/settings/screens/SettingsScreen";
import { EditProfileScreen } from "@/features/profile/screens/EditProfileScreen";
import { AddStaffScreen } from "@/features/profile/screens/AddStaffScreen";
import { SportsHomeScreen } from "@/features/sports/screens/SportsHomeScreen";
import { BookingDetailsScreen } from "@/features/sports/screens/BookingDetailsScreen";
import { GuestHistoryScreen } from "@/features/sports/screens/GuestHistoryScreen";
import { SportsHistoryScreen } from "@/features/sports/screens/SportsHistoryScreen";
import { SportsDashboardScreen } from "@/features/sports/screens/SportsDashboardScreen";
import { SportsEssentialsScreen } from "@/features/sports/screens/SportsEssentialsScreen";
import { BlockUnblockScreen } from "@/features/sports/screens/BlockUnblockScreen";
import { BulkBookingScreen } from "@/features/sports/screens/BulkBookingScreen";
import { BulkBookingDetailsScreen } from "@/features/sports/screens/BulkBookingDetailsScreen";
import { StaycationBookingDetailsScreen } from "@/features/staycation/screens/StaycationBookingDetailsScreen";
import { StaycationOffersScreen } from "@/features/staycation/screens/StaycationOffersScreen";
import { StaycationHomeScreen } from "@/features/staycation/screens/StaycationHomeScreen";
import { StaycationHistoryScreen } from "@/features/staycation/screens/StaycationHistoryScreen";
import { StaycationDashboardScreen } from "@/features/staycation/screens/StaycationDashboardScreen";
import { StaycationEssentialsScreen } from "@/features/staycation/screens/StaycationEssentialsScreen";
import { StaycationCloseDateScreen } from "@/features/staycation/screens/StaycationCloseDateScreen";
import { DineHomeScreen } from "@/features/dine/screens/DineHomeScreen";
import { DineDashboardScreen } from "@/features/dine/screens/DineDashboardScreen";
import { DineHistoryScreen } from "@/features/dine/screens/DineHistoryScreen";
import { DineEssentialsScreen } from "@/features/dine/screens/DineEssentialsScreen";
import { DineCloseDateScreen } from "@/features/dine/screens/DineCloseDateScreen";
import { DineOffersScreen } from "@/features/dine/screens/DineOffersScreen";
import { DineBookingDetailsScreen } from "@/features/dine/screens/DineBookingDetailsScreen";
import { DinePaymentDetailsScreen } from "@/features/dine/screens/DinePaymentDetailsScreen";
import { EventHomeScreen } from "@/features/event/screens/EventHomeScreen";
import { EventEssentialsScreen } from "@/features/event/screens/EventEssentialsScreen";
import { EventOffersScreen } from "@/features/event/screens/EventOffersScreen";
import { EventGuestInviteScreen } from "@/features/event/screens/EventGuestInviteScreen";
import { EventDashboardScreen } from "@/features/event/screens/EventDashboardScreen";
import { EventScanScreen } from "@/features/event/screens/EventScanScreen";
import { EventEntryDetailsScreen } from "@/features/event/screens/EventEntryDetailsScreen";
import { LegalViewScreen } from "@/features/settings/screens/LegalViewScreen";
import { LoginScreen } from "@/features/auth/screens/LoginScreen";
import { OtpScreen } from "@/features/auth/screens/OtpScreen";

import { COLORS } from "@/constants/theme";
import { vs, ms, fs, hs } from "@/utils/responsive.utils";

// --- AUTHENTICATION IMPORTS ---
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store";

const PlaceholderScreen = ({ title }: { title: string }) => (
  <View style={styles.placeholderContainer}>
    <RNText style={styles.placeholderText}>{title}</RNText>
  </View>
);

const SignupScreen = () => <PlaceholderScreen title="Signup Screen" />;

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainStack = createNativeStackNavigator<MainStackParamList>();
const SportsTab = createBottomTabNavigator<SportsTabParamList>();
const DineTab = createBottomTabNavigator<DineTabParamList>();
const StaycationTab = createBottomTabNavigator<StaycationTabParamList>();
const EventTab = createBottomTabNavigator<EventTabParamList>();

const TabIcon =
  (IconComponent: any) =>
  ({ color }: { color: string }) =>
    <IconComponent color={color} size={ms(24)} />;

const COMMON_TAB_SCREEN_OPTIONS = {
  headerShown: false,
  tabBarActiveTintColor: COLORS.primary,
  tabBarInactiveTintColor: COLORS.text.muted,
  tabBarStyle: {
    position: "absolute" as const,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface.primary,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.navBar,
    borderTopLeftRadius: ms(20),
    borderTopRightRadius: ms(20),
    height: vs(73),
    paddingTop: vs(10),
    paddingBottom: vs(25),
    paddingHorizontal: hs(10),
    elevation: 0,
    shadowOpacity: 0,
  },
  tabBarItemStyle: {
    marginHorizontal: 0,
  },
  tabBarLabelStyle: {
    fontFamily: "Gilroy-Bold",
    fontSize: fs(12),
    lineHeight: fs(12),
    marginTop: vs(2),
  },
};

const SportsTabNavigator = () => {
  return (
    <SportsTab.Navigator screenOptions={COMMON_TAB_SCREEN_OPTIONS}>
      <SportsTab.Screen
        name="SportsHome"
        component={SportsHomeScreen}
        options={{ title: "Home", tabBarIcon: TabIcon(CalendarCheck) }}
      />
      <SportsTab.Screen
        name="SportsHistory"
        component={SportsHistoryScreen}
        options={{ title: "History", tabBarIcon: TabIcon(HistoryIcon) }}
      />
      <SportsTab.Screen
        name="SportsDashboard"
        component={SportsDashboardScreen}
        options={{ title: "Dashboard", tabBarIcon: TabIcon(LayoutDashboard) }}
      />
      <SportsTab.Screen
        name="SportsEssentials"
        component={SportsEssentialsScreen}
        options={{ title: "Essentials", tabBarIcon: TabIcon(MoreHorizontal) }}
      />
      <SportsTab.Screen
        name="SportsProfile"
        component={VendorProfileScreen}
        options={{ title: "Profile", tabBarIcon: TabIcon(User) }}
      />
    </SportsTab.Navigator>
  );
};

const DineTabNavigator = () => {
  return (
    <DineTab.Navigator screenOptions={COMMON_TAB_SCREEN_OPTIONS}>
      <DineTab.Screen
        name="DineHome"
        component={DineHomeScreen}
        options={{ title: "Home", tabBarIcon: TabIcon(CalendarCheck) }}
      />
      <DineTab.Screen
        name="DineHistory"
        component={DineHistoryScreen}
        options={{ title: "History", tabBarIcon: TabIcon(HistoryIcon) }}
      />
      <DineTab.Screen
        name="DineDashboard"
        component={DineDashboardScreen}
        options={{ title: "Dashboard", tabBarIcon: TabIcon(LayoutDashboard) }}
      />
      <DineTab.Screen
        name="DineEssentials"
        component={DineEssentialsScreen}
        options={{ title: "Essentials", tabBarIcon: TabIcon(MoreHorizontal) }}
      />
      <DineTab.Screen
        name="DineProfile"
        component={VendorProfileScreen}
        options={{ title: "Profile", tabBarIcon: TabIcon(User) }}
      />
    </DineTab.Navigator>
  );
};

const StaycationTabNavigator = () => {
  return (
    <StaycationTab.Navigator screenOptions={COMMON_TAB_SCREEN_OPTIONS}>
      <StaycationTab.Screen
        name="StaycationHome"
        component={StaycationHomeScreen}
        options={{ title: "Home", tabBarIcon: TabIcon(CalendarCheck) }}
      />
      <StaycationTab.Screen
        name="StaycationHistory"
        component={StaycationHistoryScreen}
        options={{ title: "History", tabBarIcon: TabIcon(HistoryIcon) }}
      />
      <StaycationTab.Screen
        name="StaycationDashboard"
        component={StaycationDashboardScreen}
        options={{ title: "Dashboard", tabBarIcon: TabIcon(LayoutDashboard) }}
      />
      <StaycationTab.Screen
        name="StaycationEssentials"
        component={StaycationEssentialsScreen}
        options={{ title: "Essentials", tabBarIcon: TabIcon(MoreHorizontal) }}
      />
      <StaycationTab.Screen
        name="StaycationProfile"
        component={VendorProfileScreen}
        options={{ title: "Profile", tabBarIcon: TabIcon(User) }}
      />
      <StaycationTab.Screen
        name="StaycationCloseDate"
        component={StaycationCloseDateScreen}
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: { display: "none" },
        }}
      />
    </StaycationTab.Navigator>
  );
};

const ScanTabIcon = () => (
  <View style={styles.scanButton}>
    <View style={styles.scanInner}>
      <View style={styles.scanLine} />
    </View>
  </View>
);

const EventTabNavigator = () => {
  return (
    <EventTab.Navigator
      screenOptions={{
        ...COMMON_TAB_SCREEN_OPTIONS,
        tabBarStyle: {
          ...COMMON_TAB_SCREEN_OPTIONS.tabBarStyle,
          paddingTop: vs(4), // Slightly less padding to accommodate elevated scan button
        },
      }}>
      <EventTab.Screen
        name="EventHome"
        component={EventHomeScreen}
        options={{
          title: "Bookings",
          tabBarIcon: TabIcon(FileText), // Better match for Figma list icon
        }}
      />
      <EventTab.Screen
        name="EventDashboard"
        component={EventDashboardScreen}
        options={{ title: "Dashboard", tabBarIcon: TabIcon(LayoutDashboard) }}
      />
      <EventTab.Screen
        name="EventScan"
        component={EventScanScreen}
        options={{
          title: "Scan",
          tabBarIcon: ScanTabIcon,
          tabBarLabelStyle: {
            color: COLORS.text.primary,
            fontSize: fs(12),
            fontFamily: "Gilroy-Bold",
          },
        }}
      />
      <EventTab.Screen
        name="EventEssentials"
        component={EventEssentialsScreen}
        options={{ title: "Essentials", tabBarIcon: TabIcon(MoreHorizontal) }}
      />
      <EventTab.Screen
        name="EventProfile"
        component={VendorProfileScreen}
        options={{ title: "Profile", tabBarIcon: TabIcon(User) }}
      />
    </EventTab.Navigator>
  );
};

const AuthNavigator = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="Otp" component={OtpScreen} />
    <AuthStack.Screen name="Signup" component={SignupScreen} />
    <AuthStack.Screen name="LegalView" component={LegalViewScreen} />
  </AuthStack.Navigator>
);

const MainNavigator = () => (
  <MainStack.Navigator screenOptions={{ headerShown: false }}>
    <MainStack.Screen name="VendorProfile" component={VendorProfileScreen} />
    <MainStack.Screen name="Settings" component={SettingsScreen} />
    <MainStack.Screen name="EditProfile" component={EditProfileScreen} />
    <MainStack.Screen name="AddStaff" component={AddStaffScreen} />
    <MainStack.Screen name="LegalView" component={LegalViewScreen} />
    <MainStack.Screen name="SportsServiceTabs" component={SportsTabNavigator} />
    <MainStack.Screen name="DineServiceTabs" component={DineTabNavigator} />
    <MainStack.Screen name="StaycationServiceTabs" component={StaycationTabNavigator} />
    <MainStack.Screen name="EventServiceTabs" component={EventTabNavigator} />
    <MainStack.Screen name="BookingDetails" component={BookingDetailsScreen} />
    <MainStack.Screen name="StaycationBookingDetails" component={StaycationBookingDetailsScreen} />
    <MainStack.Screen name="StaycationOffers" component={StaycationOffersScreen} />
    <MainStack.Screen name="DineBookingDetails" component={DineBookingDetailsScreen} />
    <MainStack.Screen name="DinePaymentDetails" component={DinePaymentDetailsScreen} />
    <MainStack.Screen name="DineCloseDate" component={DineCloseDateScreen} />
    <MainStack.Screen name="DineOffers" component={DineOffersScreen} />
    <MainStack.Screen name="EventOffers" component={EventOffersScreen} />
    <MainStack.Screen name="EventGuestInvite" component={EventGuestInviteScreen} />
    <MainStack.Screen name="EventEntryDetails" component={EventEntryDetailsScreen} />
    <MainStack.Screen name="GuestHistory" component={GuestHistoryScreen} />
    <MainStack.Screen name="BlockUnblock" component={BlockUnblockScreen} />
    <MainStack.Screen name="BulkBooking" component={BulkBookingScreen} />
    <MainStack.Screen name="BulkBookingDetails" component={BulkBookingDetailsScreen} />
  </MainStack.Navigator>
);

export const AppNavigator = () => {
  const { session, isInitialized, setSession, setInitialized } = useAuthStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setInitialized(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => subscription.unsubscribe();
  }, [setSession, setInitialized]);

  if (!isInitialized) {
    return (
      <View style={styles.placeholderContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {session ? (
          <RootStack.Screen name="Main" component={MainNavigator} />
        ) : (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  placeholderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  placeholderText: {
    fontSize: fs(24),
    fontWeight: "bold",
    color: COLORS.text.primary,
  },
  scanButton: {
    width: ms(56),
    height: ms(56),
    borderRadius: ms(28),
    backgroundColor: COLORS.text.primary,
    justifyContent: "center",
    alignItems: "center",
    marginTop: vs(-30),
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  scanInner: {
    width: ms(24),
    height: ms(24),
    borderWidth: 2,
    borderColor: COLORS.text.inverse,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  scanLine: {
    width: "80%",
    height: 2,
    backgroundColor: COLORS.text.inverse,
  },
});
