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
} from "./navigation.types";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import {
  Calendar,
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
import { DineHomeScreen } from "@/features/dine/screens/DineHomeScreen";
import { DineDashboardScreen } from "@/features/dine/screens/DineDashboardScreen";
import { DineHistoryScreen } from "@/features/dine/screens/DineHistoryScreen";
import { DineEssentialsScreen } from "@/features/dine/screens/DineEssentialsScreen";
import { DineCloseDateScreen } from "@/features/dine/screens/DineCloseDateScreen";
import { DineOffersScreen } from "@/features/dine/screens/DineOffersScreen";
import { DineBookingDetailsScreen } from "@/features/dine/screens/DineBookingDetailsScreen";
import { DinePaymentDetailsScreen } from "@/features/dine/screens/DinePaymentDetailsScreen";
import { LoginScreen } from "@/features/auth/screens/LoginScreen";
import { OtpScreen } from "@/features/auth/screens/OtpScreen";
import { Text } from "@/components/ui";

import { COLORS } from "@/constants/theme";
import { vs, ms, fs, hs } from "@/utils/responsive.utils";

// --- AUTHENTICATION IMPORTS ---
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store";

const PlaceholderScreen = ({ title }: { title: string }) => (
  <View style={styles.placeholderContainer}>
    <Text variant="h2" weight="bold">
      {title}
    </Text>
  </View>
);

const SignupScreen = () => <PlaceholderScreen title="Signup Screen" />;
const SportsProfileScreen = () => <PlaceholderScreen title="Sports Profile" />;
const DineProfileScreen = () => <PlaceholderScreen title="Dine Profile" />;

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainStack = createNativeStackNavigator<MainStackParamList>();
const SportsTab = createBottomTabNavigator<SportsTabParamList>();
const DineTab = createBottomTabNavigator<DineTabParamList>();

const TabIcon =
  (IconComponent: any) =>
  ({ color }: { color: string }) =>
    <IconComponent color={color} size={ms(24)} />;

const SportsTabNavigator = () => {
  return (
    <SportsTab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.text.muted,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: COLORS.surface.primary,
          borderTopWidth: 1,
          borderTopColor: COLORS.border.navBar,
          borderTopLeftRadius: ms(20),
          borderTopRightRadius: ms(20),
          height: vs(80),
          paddingTop: vs(4),
          paddingBottom: vs(25),
          paddingHorizontal: hs(10),
          gap: vs(10),
        },
        tabBarLabelStyle: {
          fontFamily: "Gilroy-Bold",
          fontSize: fs(12),
          lineHeight: fs(12),
          marginTop: vs(2),
        },
      }}>
      <SportsTab.Screen
        name="SportsHome"
        component={SportsHomeScreen}
        options={{ title: "Home", tabBarIcon: TabIcon(Calendar) }}
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
        component={SportsProfileScreen}
        options={{ title: "Profile", tabBarIcon: TabIcon(User) }}
      />
    </SportsTab.Navigator>
  );
};

const DineTabNavigator = () => {
  return (
    <DineTab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.text.muted,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: COLORS.surface.primary,
          borderTopWidth: 1,
          borderTopColor: COLORS.border.navBar,
          borderTopLeftRadius: ms(20),
          borderTopRightRadius: ms(20),
          height: vs(80),
          paddingTop: vs(4),
          paddingBottom: vs(25),
          paddingHorizontal: hs(10),
          gap: vs(10),
        },
        tabBarLabelStyle: {
          fontFamily: "Gilroy-Bold",
          fontSize: fs(12),
          lineHeight: fs(12),
          marginTop: vs(2),
        },
      }}>
      <DineTab.Screen
        name="DineHome"
        component={DineHomeScreen}
        options={{ title: "Home", tabBarIcon: TabIcon(Calendar) }}
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
        component={DineProfileScreen}
        options={{ title: "Profile", tabBarIcon: TabIcon(User) }}
      />
    </DineTab.Navigator>
  );
};

const AuthNavigator = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="Otp" component={OtpScreen} />
    <AuthStack.Screen name="Signup" component={SignupScreen} />
  </AuthStack.Navigator>
);

const MainNavigator = () => (
  <MainStack.Navigator screenOptions={{ headerShown: false }}>
    <MainStack.Screen name="VendorProfile" component={VendorProfileScreen} />
    <MainStack.Screen name="Settings" component={SettingsScreen} />
    <MainStack.Screen name="EditProfile" component={EditProfileScreen} />
    <MainStack.Screen name="AddStaff" component={AddStaffScreen} />
    <MainStack.Screen name="SportsServiceTabs" component={SportsTabNavigator} />
    <MainStack.Screen name="DineServiceTabs" component={DineTabNavigator} />
    <MainStack.Screen name="BookingDetails" component={BookingDetailsScreen} />
    <MainStack.Screen name="DineBookingDetails" component={DineBookingDetailsScreen} />
    <MainStack.Screen name="DinePaymentDetails" component={DinePaymentDetailsScreen} />
    <MainStack.Screen name="DineCloseDate" component={DineCloseDateScreen} />
    <MainStack.Screen name="DineOffers" component={DineOffersScreen} />
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
});
