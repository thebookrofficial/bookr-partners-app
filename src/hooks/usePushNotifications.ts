// src/hooks/usePushNotifications.ts
import { useEffect } from "react";
import { PermissionsAndroid, Platform } from "react-native"; // Removed 'Alert' import
import messaging, { FirebaseMessagingTypes } from "@react-native-firebase/messaging";
import { supabase } from "@/lib/supabase";

export const usePushNotifications = () => {
  useEffect(() => {
    requestPermissionsAndToken();

    // This handles notifications when the app is OPEN (Foreground)
    const unsubscribe = messaging().onMessage(
      async (_remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
        // We removed the Alert.alert() here!
        // The app will now receive the data silently without interrupting the user.
        // (Optional) Later, you can trigger a subtle custom Toast component here instead!
      },
    );

    return unsubscribe;
  }, []);

  const requestPermissionsAndToken = async () => {
    if (Platform.OS === "android" && Platform.Version >= 33) {
      await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
    }

    const authStatus = await messaging().requestPermission();

    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      try {
        // 1. Get the FCM Token
        const token = await messaging().getToken();

        // 2. Get the currently logged-in vendor
        const {
          data: { session },
        } = await supabase.auth.getSession();

        // 3. Save the token to the database
        if (session?.user?.id && token) {
          await supabase.from("user_devices").upsert(
            {
              user_id: session.user.id,
              fcm_token: token,
              platform: Platform.OS,
              last_seen_at: new Date().toISOString(),
            },
            { onConflict: "fcm_token" },
          );
        }
      } catch (error) {
        console.error("Failed to get or store FCM token:", error);
      }
    }
  };
};
