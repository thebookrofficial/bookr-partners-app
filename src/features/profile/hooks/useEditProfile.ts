// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store";
import { Alert } from "react-native";

export const useEditProfile = () => {
  const { profile, setProfile, clientProfile } = useAuthStore();
  const [isUpdating, setIsUpdating] = useState(false);

  const updateProfile = async (newName: string, newPhone: string) => {
    if (!profile || !clientProfile) return;
    setIsUpdating(true);

    try {
      // 1. Update Profile (Blueprint Table 4.1)
      // Uses optimistic locking via version column
      const { data: updatedProfile, error: pError } = await supabase
        .from("profiles")
        .update({
          full_name: newName,
          phone: newPhone,
          version: profile.version + 1,
        })
        .eq("id", profile.id)
        .eq("version", profile.version)
        .select()
        .single();

      if (pError) throw pError;

      // 2. Refresh local store with updated profile data
      if (updatedProfile) {
        setProfile(updatedProfile);
        Alert.alert("Success", "Profile updated successfully!");
      }
    } catch (error: any) {
      console.error("Update Error:", error);
      Alert.alert(
        "Update Failed",
        "Data may have been modified elsewhere. Please refresh and try again.",
      );
    } finally {
      setIsUpdating(false);
    }
  };

  return { updateProfile, isUpdating };
};
