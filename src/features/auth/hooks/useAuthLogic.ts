// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import { useState } from "react";
import { Alert } from "react-native";
import { supabase } from "@/lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  GoogleSignin,
  statusCodes,
  isSuccessResponse,
  isErrorWithCode,
} from "@react-native-google-signin/google-signin";

export const useAuthLogic = () => {
  const [isLoading, setIsLoading] = useState(false);

  // We added an 'isBypass' flag to the onSuccess callback
  const loginWithEmail = async (email: string, onSuccess: (isBypass?: boolean) => void) => {
    if (!email.trim() || !email.includes("@")) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }

    const formattedEmail = email.trim().toLowerCase();
    setIsLoading(true);

    try {
      /**
       * ⚠️ DO NOT REMOVE — Google Play Store Reviewer Bypass (Step 1 of 2)
       *
       * The Play Store review team uses test.client@gmail.com to evaluate the app.
       * Real OTP emails cannot be sent to reviewer accounts, so we skip the OTP
       * send for this address and route them straight to the OTP screen.
       * Step 2 is in verifyOtpCode() below where code "123456" triggers a real login.
       *
       * Removing this will cause Play Store review rejection.
       */
      if (formattedEmail === "test.client@gmail.com") {
        // Simulation delay for realism
        setTimeout(() => {
          setIsLoading(false);
          onSuccess(false); // Navigate to OTP screen; reviewer enters 123456 there
        }, 800);
        return;
      }

      // --- NORMAL OTP FLOW FOR EVERYONE ELSE ---
      const { error } = await supabase.auth.signInWithOtp({
        email: formattedEmail,
      });

      if (error) {
        Alert.alert("Login Error", error.message);
      } else {
        // Pass 'false' so the UI knows to navigate to the OTP screen
        onSuccess(false);
      }
    } catch (e: any) {
      console.error("loginWithEmail error:", e);
      Alert.alert("Login Error", e.message || "Failed to request OTP.");
    } finally {
      if (formattedEmail !== "test.client@gmail.com") {
        setIsLoading(false);
      }
    }
  };

  const loginWithGoogle = async () => {
    try {
      setIsLoading(true);
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();

      if (isSuccessResponse(response)) {
        if (response.data.idToken) {
          const { error } = await supabase.auth.signInWithIdToken({
            provider: "google",
            token: response.data.idToken,
          });
          if (error) throw error;
        } else {
          console.error("Google Sign-In Success but No ID Token. Check webClientId in .env");
          throw new Error("No ID token present!");
        }
      } else {
        return;
      }
    } catch (error: any) {
      if (isErrorWithCode(error)) {
        if (error.code === statusCodes.IN_PROGRESS) {
          // operation is in progress already
        } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
          Alert.alert("Error", "Google Play Services not available or outdated.");
        } else {
          Alert.alert("Google Login Error", error.message);
        }
      } else {
        Alert.alert("Google Login Error", error?.message || "An unknown error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtpCode = async (email: string, code: string) => {
    setIsLoading(true);
    const formattedEmail = email.trim().toLowerCase();

    try {
      /**
       * ⚠️ DO NOT REMOVE — Google Play Store Reviewer Bypass (Step 2 of 2)
       *
       * When the reviewer enters OTP code "123456" for test.client@gmail.com,
       * we use signInWithPassword() to authenticate them directly against Supabase.
       * This bypasses the real OTP flow which requires an actual email inbox.
       *
       * IMPORTANT — Do NOT wrap this call with AbortController or a timeout.
       * Any abortion of this request will prevent the session token from being
       * written to AsyncStorage, causing the login to silently fail.
       *
       * The real session is created here and persisted by the Supabase SDK.
       * onAuthStateChange (in navigation/index.tsx) then navigates the user.
       *
       * Removing or modifying this will cause Play Store review rejection.
       */
      if (formattedEmail === "test.client@gmail.com" && code === "123456") {
        const { error } = await supabase.auth.signInWithPassword({
          email: formattedEmail,
          password: "@TheBookr!official18",
        });
        if (error) {
          Alert.alert("Reviewer Login Error", error.message);
        }
        return;
      }

      // 1. Verify the OTP
      const { data: authData, error: authError } = await supabase.auth.verifyOtp({
        email: formattedEmail,
        token: code,
        type: "email",
      });

      if (authError) {
        Alert.alert("Verification Failed", authError.message);
        return;
      }

      // 2. Ensure we have a user
      const user = authData.user;
      if (!user) {
        Alert.alert("Error", "User session not found after verification.");
        return;
      }

      /**
       * ⚠️ DO NOT REMOVE — Business Partner Authorization Gate
       *
       * This check ensures that only valid Bookr Business Partners (owners or
       * staff with an active account) can access this app. Regular Bookr users
       * (customers who book venues) share the same Supabase auth system but
       * must NOT be able to log into this partner-facing app.
       *
       * Logic:
       *  - Fetches client_profiles for the authenticated user.
       *  - If client_role is NOT "owner" or "staff", or account_status is
       *    "suspended" or "banned", signs them out immediately.
       *  - Exception: users with a pending staff @pending_invite_token are
       *    allowed through so they can complete the invite flow.
       *
       * Removing this gate would allow any regular Bookr customer to log in.
       */
      const { data: clientProfile, error: profileError } = await supabase
        .from("client_profiles")
        .select("client_role, account_status")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileError) {
        Alert.alert("Error", "Could not fetch user profile details.");
        return;
      }

      // Authorized = active owner or staff; suspended/banned accounts are rejected
      const isAuthorized =
        clientProfile &&
        (clientProfile.client_role === "owner" || clientProfile.client_role === "staff") &&
        clientProfile.account_status !== "suspended" &&
        clientProfile.account_status !== "banned";

      const pendingInviteToken = await AsyncStorage.getItem("@pending_invite_token");

      let hasPendingInvite = false;
      if (user.email) {
        const { data: invites } = await supabase
          .from("staff_invites")
          .select("id")
          .eq("email", user.email)
          .eq("status", "pending")
          .limit(1);
        if (invites && invites.length > 0) hasPendingInvite = true;
      }

      if (!isAuthorized && !pendingInviteToken && !hasPendingInvite) {
        // Regular Bookr user — boot them out and direct to the consumer app
        await supabase.auth.signOut();
        Alert.alert(
          "Access Denied",
          "This app is strictly for Bookr Business Partners. Please use the main Bookr app to book venues.",
        );
        return;
      }
    } catch (e: any) {
      console.error("verifyOtpCode error:", e);
      Alert.alert("Verification Error", e.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const resendOtpCode = async (email: string, onResent: () => void) => {
    const formattedEmail = email.trim().toLowerCase();

    const { error } = await supabase.auth.signInWithOtp({ email: formattedEmail });

    if (error) {
      Alert.alert("Error", error.message);
    } else {
      onResent();
    }
  };

  const logout = async () => {
    Alert.alert("Log Out", "Are you sure you want to log out of your account?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          setIsLoading(true);
          const { error } = await supabase.auth.signOut();
          setIsLoading(false);
          if (error) {
            Alert.alert("Logout Failed", error.message);
          }
        },
      },
    ]);
  };

  return {
    isLoading,
    loginWithEmail,
    loginWithGoogle,
    verifyOtpCode,
    resendOtpCode,
    logout,
  };
};
