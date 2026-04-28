// src/hooks/usePushNotifications.ts
import { useEffect } from "react";
import { Alert, PermissionsAndroid, Platform } from "react-native";
import messaging, { FirebaseMessagingTypes } from "@react-native-firebase/messaging";

export const usePushNotifications = () => {
  useEffect(() => {
    requestPermissionsAndToken();

    // Added explicit type for remoteMessage
    const unsubscribe = messaging().onMessage(
      async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
        Alert.alert(
          remoteMessage.notification?.title || "New Notification",
          remoteMessage.notification?.body || "You have a new update.",
        );
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
        const token = await messaging().getToken();
        // eslint-disable-next-line no-console
        console.log("FCM Device Token:", token);
      } catch (error) {
        console.error("Failed to get FCM token:", error);
      }
    }
  };
};
