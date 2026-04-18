// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { Text, TextInput, Button } from "@/components/ui";
import { AuthScreenProps } from "@/navigation/navigation.types";
import { COLORS } from "@/constants/theme";
import { vs, hs, ms, fs } from "@/utils/responsive.utils";
import { supabase } from "@/lib/supabase";
import { SafeAreaView } from "react-native-safe-area-context";

export const LoginScreen = ({ navigation }: AuthScreenProps<"Login">) => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailLogin = async () => {
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
      // Navigate to OTP screen and pass the email
      navigation.navigate("Otp", { email: email.trim() });
    }
  };

  const handleGoogleLogin = () => {
    Alert.alert("Google Auth", "Requires Native Google Sign-In package setup.");
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Background patterns would go here as an absolute ImageBackground */}

      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Text variant="h1" style={styles.logoText}>
            bookr
          </Text>
        </View>
        {/* Google Login */}
        <Button
          title="Sign in with Google"
          variant="outline"
          onPress={handleGoogleLogin}
          style={styles.googleButton}
          leftIcon={
            <View style={styles.googleIconPlaceholder}>
              <Text style={styles.googleIconText}>G</Text>
            </View>
          }
        />

        {/* Divider */}
        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text variant="caption" color={COLORS.text.muted} style={styles.dividerText}>
            OR
          </Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Email Login */}
        <TextInput
          variant="filled"
          placeholder="Email Address"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isLoading}
        />

        <Button
          title="Continue"
          variant="primary"
          onPress={handleEmailLogin}
          isLoading={isLoading}
          disabled={!email.trim() || isLoading}
          style={styles.continueButton}
        />
      </View>

      {/* Footer Terms */}
      <View style={styles.footer}>
        <Text variant="caption" color={COLORS.text.secondary}>
          By continuing, you agree to our
        </Text>
        <View style={styles.footerLinks}>
          <TouchableOpacity>
            <Text
              variant="caption"
              weight="bold"
              color={COLORS.text.primary}
              style={styles.linkText}>
              Privacy Policy
            </Text>
          </TouchableOpacity>
          <Text variant="caption" color={COLORS.text.secondary}>
            {" "}
            and{" "}
          </Text>
          <TouchableOpacity>
            <Text
              variant="caption"
              weight="bold"
              color={COLORS.text.primary}
              style={styles.linkText}>
              Terms of Service
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: hs(24),
    paddingBottom: vs(40),
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: vs(80),
  },
  logoText: {
    fontSize: fs(61),
    fontFamily: "Gilroy-ExtraBold",
    color: "#4A00E0", // Exact purple from your Figma image
    letterSpacing: 1,
  },
  googleButton: {
    borderRadius: ms(30),
    borderColor: COLORS.surface.fallback,
    height: vs(50),
  },
  googleIconPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#DB4437", // Google Red
    alignItems: "center",
    justifyContent: "center",
  },
  googleIconText: {
    color: "#fff",
    fontSize: fs(12),
    fontWeight: "bold",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: vs(24),
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.surface.fallback,
  },
  dividerText: {
    marginHorizontal: hs(16),
  },
  continueButton: {
    marginTop: vs(8),
    borderRadius: ms(30),
  },
  footer: {
    alignItems: "center",
    marginBottom: vs(30),
  },
  footerLinks: {
    flexDirection: "row",
    marginTop: vs(4),
  },
  linkText: {
    textDecorationLine: "underline",
  },
});
