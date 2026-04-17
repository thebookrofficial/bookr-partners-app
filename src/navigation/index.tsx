// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RootStackParamList, AuthStackParamList } from "./navigation.types";
import { View, Text, StyleSheet } from "react-native";
import { VendorProfileScreen } from "@/features/profile/screens/VendorProfileScreen";

// --- TEMPORARY PLACEHOLDERS ---
// We will replace these with our actual UI screens next!
const PlaceholderScreen = ({ title }: { title: string }) => (
  <View style={styles.placeholderContainer}>
    <Text style={styles.placeholderText}>{title}</Text>
  </View>
);
const LoginScreen = () => <PlaceholderScreen title="Login Screen" />;
const SignupScreen = () => <PlaceholderScreen title="Signup Screen" />;
// const DashboardScreen = () => <PlaceholderScreen title="Vendor Dashboard" />;
// ------------------------------

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();

// The Auth Flow (Users who are NOT logged in)
const AuthNavigator = () => {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Signup" component={SignupScreen} />
    </AuthStack.Navigator>
  );
};

// The Root Flow (The gatekeeper)
export const AppNavigator = () => {
  // TODO: We will replace this with Zustand / Supabase auth state later
  const isAuthenticated = true;

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          // If logged in, show the business dashboard
          <RootStack.Screen name="Main" component={VendorProfileScreen} />
        ) : (
          // If NOT logged in, force them to the Auth flow
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
    backgroundColor: "#FFFFFF",
  },
  placeholderText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1A1A1A",
  },
});
