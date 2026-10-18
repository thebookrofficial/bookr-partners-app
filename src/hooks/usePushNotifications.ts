import { useEffect } from "react";
import { PermissionsAndroid, Platform, Alert, Linking } from "react-native";
import messaging, { FirebaseMessagingTypes } from "@react-native-firebase/messaging";
import { supabase } from "@/lib/supabase";

export const usePushNotifications = () => {
  useEffect(() => {
    requestPermissionsAndToken();

    // This handles notifications when the app is OPEN (Foreground)
    const unsubscribe = messaging().onMessage(
      async (_remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
        // Foreground push notifications are handled by the OS or notification center.
        // Do not show an in-app alert here to avoid duplicate on-screen notifications.
      },
    );

    return unsubscribe;
  }, []);

  const requestPermissionsAndToken = async () => {
    // 1. On Android 13+, explicitly request the POST_NOTIFICATIONS permission
    if (Platform.OS === "android" && Platform.Version >= 33) {
      await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
    }

    // 2. Request/Check permission through Firebase (handles iOS and general Android notification settings)
    const authStatus = await messaging().requestPermission();

    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (!enabled) {
      // If notifications are totally disabled or denied, prompt the user on every cold start
      Alert.alert(
        "Notifications Disabled",
        "You will miss important booking alerts! Please enable notifications in your phone settings to receive new booking banners.",
        [
          { text: "Not Now", style: "cancel" },
          { text: "Open Settings", onPress: () => Linking.openSettings() },
        ],
      );
      return;
    }

    if (enabled) {
      try {
        if (Platform.OS === "ios") {
          await messaging().registerDeviceForRemoteMessages();
        }

        // 1. Get the FCM Token
        const token = await messaging().getToken();

        // 2. Get the currently logged-in vendor
        const {
          data: { session },
        } = await supabase.auth.getSession();

        // 3. Save the token to the database asynchronously (non-blocking)
        if (session?.user?.id && token) {
          supabase
            .from("user_devices")
            .upsert(
              {
                user_id: session.user.id,
                fcm_token: token,
                platform: Platform.OS,
                last_seen_at: new Date().toISOString(),
              },
              { onConflict: "fcm_token" },
            )
            .then(({ error }) => {
              if (error) {
                console.error("Failed to store FCM token asynchronously:", error);
              }
            });
        }
      } catch (error: any) {
        // iOS Simulator does not have aps-environment entitlement; ignore gracefully
        if (
          error?.message?.includes("aps-environment") ||
          error?.code === "messaging/unknown"
        ) {
          console.warn("APNs remote messages not supported on this simulator/environment.");
        } else {
          console.error("Failed to get or store FCM token:", error);
        }
      }
    }
  };
};
