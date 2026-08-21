import React, { useEffect } from "react";
import { StatusBar, useColorScheme, LogBox } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppNavigator } from "@/navigation";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import * as Sentry from "@sentry/react-native";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useAutoStartCheck } from "@/hooks/useAutoStartCheck";
import { AutoStartPrompt } from "@/components/ui/AutoStartPrompt";
import { GlobalKeyboardAccessory } from "@/components/ui/GlobalKeyboardAccessory";
import Config from "react-native-config";
import { withStallion } from "react-native-stallion";

// Sentry Initialization
Sentry.init({
  dsn: Config.SENTRY_DSN,
  sendDefaultPii: true,
  enableLogs: true,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  integrations: [Sentry.mobileReplayIntegration(), Sentry.feedbackIntegration()],
});

/**
 * Safely configures Google Sign-In to prevent fatal crashes if
 * environment variables fail to load in release mode.
 */
const initializeGoogleSignIn = () => {
  // Use the actual ID as a hard fallback so Google Auth works in release!
  const clientId =
    Config.GOOGLE_WEB_CLIENT_ID ||
    "1077467918306-rc8kc027ijd7oheqomq550s44udqfu32.apps.googleusercontent.com";

  if (!clientId) {
    Sentry.captureMessage("Google Web Client ID is missing in Config");
    console.warn("GOOGLE_WEB_CLIENT_ID is missing in your .env file!");
    return;
  }

  try {
    GoogleSignin.configure({
      scopes: ["https://www.googleapis.com/auth/userinfo.email"],
      webClientId: clientId,
      iosClientId:
        Config.GOOGLE_IOS_CLIENT_ID ||
        "1077467918306-tp2i1l8u4u802hrf63g7cngiibrir66l.apps.googleusercontent.com",
      offlineAccess: true, // Required for Supabase auth persistence
    });
  } catch (error) {
    Sentry.captureException(error);
    console.error("GoogleSignin Configuration Error:", error);
  }
};

// Run global initializations
initializeGoogleSignIn();

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

function App() {
  const isDarkMode = useColorScheme() === "dark";

  // Initialize push notifications
  usePushNotifications();

  useEffect(() => {
    // Ignore specific warnings that might clutter logs in production
    LogBox.ignoreLogs(["NON-FATAL_WARNING_TO_IGNORE"]);
  }, []);

  const { needsAutoStart, openAutoStartSettings } = useAutoStartCheck();

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar
          barStyle={isDarkMode ? "light-content" : "dark-content"}
          backgroundColor="transparent"
          translucent
        />
        <AppNavigator />
        <AutoStartPrompt visible={needsAutoStart} onFixSettings={openAutoStartSettings} />
        <GlobalKeyboardAccessory />
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

// 1. Wrap the App with Stallion first
const StallionApp = withStallion(App);

// 2. Then wrap the StallionApp with Sentry to catch any OTA update errors
export default Sentry.wrap(StallionApp);
