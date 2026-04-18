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

  const loginWithEmail = async (email: string, onSuccess: () => void) => {
    if (!email.trim() || !email.includes("@")) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
    });
    setIsLoading(false);

    if (error) {
      Alert.alert("Login Error", error.message);
    } else {
      onSuccess();
    }
  };

  const loginWithGoogle = async () => {
    try {
      setIsLoading(true);
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();

      // v11+: Check if the response was successful before accessing data
      if (isSuccessResponse(response)) {
        if (response.data.idToken) {
          const { error } = await supabase.auth.signInWithIdToken({
            provider: "google",
            token: response.data.idToken, // ID Token is now nested inside `data`
          });
          if (error) throw error;
        } else {
          throw new Error("No ID token present!");
        }
      } else {
        // Sign in was cancelled by the user.
        // We removed the console.log to fix the ESLint warning!
        return;
      }
    } catch (error: any) {
      // v11+: Use the built-in type guard for error checking
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
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "email",
    });
    setIsLoading(false);

    if (error) {
      Alert.alert("Verification Failed", error.message);
    }
  };

  const resendOtpCode = async (email: string, onResent: () => void) => {
    const { error } = await supabase.auth.signInWithOtp({ email });
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
