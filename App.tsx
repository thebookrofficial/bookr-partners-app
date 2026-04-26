// src/App.tsx
import React from "react";
import { StatusBar, useColorScheme } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
// Update this line to use the correct relative path
import { AppNavigator } from "@/navigation";
import { GoogleSignin } from "@react-native-google-signin/google-signin";

import { withStallion } from "react-native-stallion";

// 1. Global Initializations
GoogleSignin.configure({
  scopes: ["https://www.googleapis.com/auth/userinfo.email"],
  webClientId: "YOUR_NEW_WEB_CLIENT_ID.apps.googleusercontent.com",
});

function App() {
  const isDarkMode = useColorScheme() === "dark";

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent
      />
      <AppNavigator />
    </SafeAreaProvider>
  );
}

export default withStallion(App);
