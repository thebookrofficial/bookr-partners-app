// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  RootStackParamList,
  AuthStackParamList,
  MainStackParamList,
  SportsTabParamList,
} from "./navigation.types";
import { View, StyleSheet } from "react-native";
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
import { Text } from "@/components/ui";

import { COLORS } from "@/constants/theme";
import { vs, ms, fs, hs } from "@/utils/responsive.utils";

const PlaceholderScreen = ({ title }: { title: string }) => (
  <View style={styles.placeholderContainer}>
    <Text variant="h2" weight="bold">
      {title}
    </Text>
  </View>
);

const LoginScreen = () => <PlaceholderScreen title="Login Screen" />;
const SignupScreen = () => <PlaceholderScreen title="Signup Screen" />;
const SportsHomeScreen = () => <PlaceholderScreen title="Sports Home" />;
const SportsHistoryScreen = () => <PlaceholderScreen title="Sports History" />;
const SportsDashboardScreen = () => <PlaceholderScreen title="Sports Dashboard" />;
const SportsEssentialsScreen = () => <PlaceholderScreen title="Sports Essentials" />;
const SportsProfileScreen = () => <PlaceholderScreen title="Sports Profile" />;

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainStack = createNativeStackNavigator<MainStackParamList>();
const SportsTab = createBottomTabNavigator<SportsTabParamList>();

/**
 * FIX: Defining Icons outside the render function to prevent
 * 'react/no-unstable-nested-components' and re-mounting issues.
 */
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
          height: vs(80), // Exact Figma height
          paddingTop: vs(4),
          paddingBottom: vs(25), // Handles visual centering & safe area
          paddingHorizontal: hs(10),
          boxShadow: "0px -1px 10px rgba(203, 223, 254, 1)",
          gap: vs(10),
        },
        tabBarLabelStyle: {
          fontFamily: "Gilroy-Bold", // Exact Figma font
          fontSize: fs(12),
          lineHeight: fs(12),
          marginTop: vs(2), // 2px gap from Figma
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

const AuthNavigator = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Login" component={LoginScreen} />
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
  </MainStack.Navigator>
);

export const AppNavigator = () => {
  const isAuthenticated = true;

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
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
