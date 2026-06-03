// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import { Platform, PermissionsAndroid, Linking, Alert } from "react-native";
import messaging from "@react-native-firebase/messaging";
import { supabase } from "@/lib/supabase";

export const notificationService = {
  /**
   * Check if the app has notification permissions.
   */
  async checkPermission() {
    const authStatus = await messaging().hasPermission();
    return (
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL
    );
  },

  /**
   * Request notification permissions and register the device.
   */
  async requestPermission() {
    try {
      if (Platform.OS === "android" && Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          return false;
        }
      }

      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        await this.registerDevice();
      }

      return enabled;
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  },

  /**
   * Register the device token in Supabase.
   */
  async registerDevice() {
    try {
      const token = await messaging().getToken();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user?.id && token) {
        const { error } = await supabase.from("user_devices").upsert(
          {
            user_id: session.user.id,
            fcm_token: token,
            platform: Platform.OS,
            last_seen_at: new Date().toISOString(),
            is_active: true, // Assuming this column exists for soft-disable
          },
          { onConflict: "fcm_token" },
        );

        if (error) throw error;
      }
    } catch (error) {
      console.error("Failed to register device:", error);
    }
  },

  /**
   * Unregister the device from notifications.
   */
  async unregisterDevice() {
    try {
      const token = await messaging().getToken();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user?.id && token) {
        // Option 1: Set is_active to false in DB
        await supabase.from("user_devices").update({ is_active: false }).eq("fcm_token", token);

        // Option 2: Delete token from FCM (hard disable)
        // await messaging().deleteToken();
      }
    } catch (error) {
      console.error("Failed to unregister device:", error);
    }
  },

  /**
   * Open system settings for the app.
   */
  openSettings() {
    if (Platform.OS === "ios") {
      Linking.openURL("app-settings:");
    } else {
      Linking.openSettings();
    }
  },

  /**
   * Handle the "Allow Notifications" toggle.
   */
  async toggleNotifications(currentlyEnabled: boolean) {
    if (currentlyEnabled) {
      // User wants to turn it OFF
      Alert.alert(
        "Disable Notifications",
        "To fully turn off notifications, you need to disable them in your phone's system settings. Would you like to go there now?",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Open Settings",
            onPress: () => {
              this.openSettings();
              this.unregisterDevice();
            },
          },
          {
            text: "Just Disable in App",
            onPress: () => this.unregisterDevice(),
          },
        ],
      );
      return false; // UI will update locally, but system permission stays until user changes it
    } else {
      // User wants to turn it ON
      return await this.requestPermission();
    }
  },
};
