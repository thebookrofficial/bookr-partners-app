// src/App.tsx
import React from "react";
import { StatusBar, useColorScheme } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
// Update this line to use the correct relative path
import { AppNavigator } from "@/navigation";
import { GoogleSignin } from "@react-native-google-signin/google-signin";

import { withStallion } from "react-native-stallion";
import * as Sentry from "@sentry/react-native";

import { usePushNotifications } from "@/hooks/usePushNotifications";
import Config from "react-native-config";

Sentry.init({
  dsn: Config.SENTRY_DSN,

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Enable Logs
  enableLogs: true,

  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration(), Sentry.feedbackIntegration()],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

// 1. Global Initializations
// eslint-disable-next-line no-console
console.log("Configured Google Web Client ID:", Config.GOOGLE_WEB_CLIENT_ID);

if (!Config.GOOGLE_WEB_CLIENT_ID) {
  console.warn("GOOGLE_WEB_CLIENT_ID is missing in your .env file!");
}

GoogleSignin.configure({
  scopes: ["https://www.googleapis.com/auth/userinfo.email"],
  webClientId: Config.GOOGLE_WEB_CLIENT_ID,
  offlineAccess: true, // Required to consistently get the idToken
});

function App() {
  const isDarkMode = useColorScheme() === "dark";

  usePushNotifications();

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

export default Sentry.wrap(withStallion(App));
