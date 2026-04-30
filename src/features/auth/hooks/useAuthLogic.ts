// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import { useState } from "react";
import { Alert } from "react-native";
import { supabase } from "@/lib/supabase";
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

      // console.log("Google Sign-In Response:", JSON.stringify(response, null, 2));

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

    const { error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: code,
      type: "email",
    });

    setIsLoading(false);

    if (error) {
      Alert.alert("Verification Failed", error.message);
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
