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

    // --- TEST ACCOUNT PASSWORD BYPASS ---
    if (formattedEmail === "test.client@gmail.com") {
      // Simulation delay for realism
      setTimeout(() => {
        setIsLoading(false);
        onSuccess(false); // Force navigation to OTP screen even for test account
      }, 800);
      return;
    }
    // ------------------------------------

    // --- NORMAL OTP FLOW FOR EVERYONE ELSE ---
    const { error } = await supabase.auth.signInWithOtp({
      email: formattedEmail,
    });

    setIsLoading(false);

    if (error) {
      Alert.alert("Login Error", error.message);
    } else {
      // Pass 'false' so the UI knows to navigate to the OTP screen
      onSuccess(false);
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

    // HARDCODED BYPASS FOR GOOGLE REVIEWER
    if (formattedEmail === "test.client@gmail.com" && code === "123456") {
      const { error } = await supabase.auth.signInWithPassword({
        email: formattedEmail,
        password: "@TheBookr!official18",
      });
      setIsLoading(false);
      if (error) Alert.alert("Reviewer Login Error", error.message);
      return;
    }

    // 1. Verify the OTP
    const { data: authData, error: authError } = await supabase.auth.verifyOtp({
      email: formattedEmail,
      token: code,
      type: "email",
    });

    if (authError) {
      setIsLoading(false);
      Alert.alert("Verification Failed", authError.message);
      return;
    }

    // 2. Ensure we have a user
    const user = authData.user;
    if (!user) {
      setIsLoading(false);
      Alert.alert("Error", "User session not found after verification.");
      return;
    }

    // 3. IMPORTANT: Check the client_profiles table for a valid business role
    const { data: clientProfile } = await supabase
      .from("client_profiles")
      .select("client_role, account_status")
      .eq("user_id", user.id)
      .single();

    // 4. Determine if they are authorized
    const isAuthorized =
      clientProfile &&
      (clientProfile.client_role === "owner" || clientProfile.client_role === "staff") &&
      clientProfile.account_status !== "suspended" &&
      clientProfile.account_status !== "banned";

    const pendingInviteToken = await AsyncStorage.getItem("@pending_invite_token");

    if (!isAuthorized && !pendingInviteToken) {
      // If they are just a 'user' or have no client profile, boot them out
      await supabase.auth.signOut();
      setIsLoading(false);
      Alert.alert(
        "Access Denied",
        "This app is strictly for Bookr Business Partners. Please use the main Bookr app to book venues.",
      );
      return;
    }

    // If they made it here, they are an owner/staff, and the session is valid!
    setIsLoading(false);
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
