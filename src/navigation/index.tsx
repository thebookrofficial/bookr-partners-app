// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RootStackParamList, AuthStackParamList, MainStackParamList } from "./navigation.types";
import { View, Text, StyleSheet } from "react-native";
import { VendorProfileScreen } from "@/features/profile/screens/VendorProfileScreen";
import { SettingsScreen } from "@/features/settings/screens/SettingsScreen"; // Added Import
import { COLORS } from "@/constants/theme";

const PlaceholderScreen = ({ title }: { title: string }) => (
  <View style={styles.placeholderContainer}>
    <Text style={styles.placeholderText}>{title}</Text>
  </View>
);
const LoginScreen = () => <PlaceholderScreen title="Login Screen" />;
const SignupScreen = () => <PlaceholderScreen title="Signup Screen" />;

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainStack = createNativeStackNavigator<MainStackParamList>(); // Added Main Stack

// The Auth Flow
const AuthNavigator = () => {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Signup" component={SignupScreen} />
    </AuthStack.Navigator>
  );
};

// The Main Business Flow (Authenticated)
const MainNavigator = () => {
  return (
    <MainStack.Navigator screenOptions={{ headerShown: false }}>
      <MainStack.Screen name="VendorProfile" component={VendorProfileScreen} />
      <MainStack.Screen name="Settings" component={SettingsScreen} />
    </MainStack.Navigator>
  );
};

// The Root Flow (The gatekeeper)
export const AppNavigator = () => {
  const isAuthenticated = true; // Placeholder for Auth State

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
  placeholderText: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.text.primary,
  },
});
