// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, Image } from "react-native";
import { Text, Button } from "@/components/ui";
import { AuthScreenProps } from "@/navigation/navigation.types";
import { COLORS } from "@/constants/theme";
import { vs, hs, ms, fs } from "@/utils/responsive.utils";
import { useAuthLogic } from "../hooks/useAuthLogic";
import { AuthTextInput } from "../components/AuthTextInput";
import { SafeAreaView } from "react-native-safe-area-context";
import { LEGAL_TEXT } from "@/constants/legal";

export const LoginScreen = ({ navigation }: AuthScreenProps<"Login">) => {
  const [email, setEmail] = useState("");
  const { isLoading, loginWithEmail, loginWithGoogle } = useAuthLogic();

  // const handleEmailContinue = () => {
  //   loginWithEmail(email, () => {
  //     navigation.navigate("Otp", { email: email.trim() });
  //   });
  // };

  const handleEmailContinue = () => {
    loginWithEmail(email, isBypass => {
      // If we did NOT bypass with a password, go to the OTP screen.
      // If we DID bypass, do nothing here—the AppNavigator will automatically
      // detect the new session and switch to the Main App Dashboard!
      if (!isBypass) {
        navigation.navigate("Otp", { email: email.trim() });
      }
    });
  };

  const navigateToPrivacyPolicy = () => {
    navigation.navigate("LegalView", {
      title: LEGAL_TEXT.privacy.title,
      content: LEGAL_TEXT.privacy.content,
    });
  };

  const navigateToTerms = () => {
    navigation.navigate("LegalView", {
      title: LEGAL_TEXT.terms.title,
      content: LEGAL_TEXT.terms.content,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Text variant="h1" style={styles.logoText}>
            bookr
          </Text>
        </View>

        <Button
          title="Sign in with Google"
          variant="outline"
          onPress={loginWithGoogle}
          style={styles.googleButton}
          leftIcon={
            <Image
              source={{ uri: "https://img.icons8.com/color/48/google-logo.png" }}
              style={styles.googleIconPlaceholder}
            />
          }
        />

        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text
            variant="caption"
            weight="bold"
            color={COLORS.text.muted}
            style={styles.dividerText}>
            OR
          </Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Replaced with the custom Auth-specific input */}
        <AuthTextInput
          placeholder="Email Address"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isLoading}
          style={styles.emailInput}
        />

        <Button
          title="Continue"
          variant="primary"
          onPress={handleEmailContinue}
          isLoading={isLoading}
          disabled={!email.trim() || isLoading}
          style={styles.continueButton}
        />
      </View>

      <View style={styles.footer}>
        <Text variant="caption" color={COLORS.text.secondary}>
          By continuing, you agree to our
        </Text>
        <View style={styles.footerLinks}>
          <TouchableOpacity onPress={navigateToPrivacyPolicy}>
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
          <TouchableOpacity onPress={navigateToTerms}>
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
    fontSize: fs(64),
    fontFamily: "Gilroy-ExtraBold",
    color: "#4A00E0",
    letterSpacing: -2,
  },
  googleButton: {
    borderRadius: ms(30),
    borderColor: COLORS.surface.fallback,
    height: vs(50),
  },
  googleIconPlaceholder: {
    width: 24,
    height: 24,
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
    backgroundColor: COLORS.text.muted,
  },
  dividerText: {
    marginHorizontal: hs(16),
  },
  emailInput: {
    marginBottom: vs(20),
    height: vs(54),
    // Use your theme's grey (#F5F5F5) instead of the bluish-white
    backgroundColor: COLORS.surface.secondary,
    // Increase thickness slightly to make it visible
    borderWidth: 1.5,
    // Use the darker fallback grey (#EAEAEA) for a visible outline
    borderColor: COLORS.surface.fallback,
    borderRadius: ms(30),
    paddingHorizontal: hs(24),
    fontSize: fs(16),
    fontFamily: "Gilroy-SemiBold",
    color: COLORS.text.primary,
    width: "100%",
  },
  continueButton: {
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
