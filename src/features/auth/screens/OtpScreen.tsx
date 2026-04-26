// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, TextInput as RNTextInput } from "react-native";
import { Text } from "@/components/ui";
import { AuthScreenProps } from "@/navigation/navigation.types";
import { COLORS } from "@/constants/theme";
import { vs, hs, ms, fs } from "@/utils/responsive.utils";
import { ChevronLeft } from "lucide-react-native";
import { useAuthLogic } from "../hooks/useAuthLogic";
import { SafeAreaView } from "react-native-safe-area-context";
import { LEGAL_TEXT } from "@/constants/legal";

const OTP_LENGTH = 6;
const TIMER_SECONDS = 30;

export const OtpScreen = ({ navigation, route }: AuthScreenProps<"Otp">) => {
  const { email } = route.params;
  const { isLoading, verifyOtpCode, resendOtpCode } = useAuthLogic();

  // Now we just use a simple string instead of an array!
  const [code, setCode] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [timer, setTimer] = useState(TIMER_SECONDS);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (timer > 0) {
      interval = setInterval(() => setTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // Trigger API call the exact millisecond the 6th digit is typed
  useEffect(() => {
    if (code.length === OTP_LENGTH) {
      verifyOtpCode(email, code);
    }
  }, [code, email, verifyOtpCode]);

  const handleChangeText = (text: string) => {
    // Sanitize: Only allow numbers
    const numericText = text.replace(/[^0-9]/g, "");
    setCode(numericText);
  };

  const handleResend = () => {
    resendOtpCode(email, () => setTimer(TIMER_SECONDS));
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
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ChevronLeft color={COLORS.text.primary} size={24} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Text variant="h1" style={styles.logoText}>
            bookr
          </Text>
        </View>

        <Text variant="h2" weight="bold" style={styles.title}>
          Email Verification
        </Text>
        <Text variant="body2" color={COLORS.text.secondary} style={styles.subtitle}>
          Enter the 6-digit code sent to {email}
        </Text>

        {/* The New OTP Container */}
        <View style={styles.otpContainer}>
          {/* 1. Render the 6 visual UI boxes */}
          {new Array(OTP_LENGTH).fill(0).map((_, index) => {
            const digit = code[index] || "";
            const isCurrentBox = isFocused && code.length === index;

            return (
              <View
                key={index}
                style={[
                  styles.otpBox,
                  digit !== "" && styles.otpBoxFilled,
                  isCurrentBox && styles.otpBoxFocused, // Highlights the box you are currently on!
                ]}>
                <Text style={styles.otpText}>{digit}</Text>
              </View>
            );
          })}

          {/* 2. The single, invisible master input sitting on top */}
          <RNTextInput
            value={code}
            onChangeText={handleChangeText}
            maxLength={OTP_LENGTH}
            keyboardType="number-pad"
            style={styles.hiddenInput}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            autoFocus
            editable={!isLoading}
            autoComplete="one-time-code" // Helps with native OTP autofill
            textContentType="oneTimeCode"
          />
        </View>

        <View style={styles.resendContainer}>
          <Text variant="body2" color={COLORS.text.secondary}>
            Didn't receive it?{" "}
          </Text>
          {timer > 0 ? (
            <Text variant="body2" color={COLORS.text.muted}>
              Resend in {timer}s
            </Text>
          ) : (
            <TouchableOpacity onPress={handleResend} disabled={isLoading}>
              <Text variant="body2" weight="bold" color={COLORS.text.primary}>
                Resend
              </Text>
            </TouchableOpacity>
          )}
        </View>
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
  header: {
    paddingHorizontal: hs(20),
    paddingTop: vs(20),
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: hs(24),
    paddingBottom: vs(40),
  },
  logoContainer: {
    marginBottom: vs(40),
  },
  logoText: {
    fontSize: fs(48),
    fontFamily: "Gilroy-ExtraBold",
    color: "#4A00E0",
    letterSpacing: -1.5,
  },
  title: {
    color: "#4A00E0",
    marginBottom: vs(8),
  },
  subtitle: {
    textAlign: "center",
    marginBottom: vs(40),
  },

  // Updated Styles for the new pattern
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: vs(30),
    position: "relative", // Required for absolute positioning the hidden input
  },
  otpBox: {
    width: ms(48),
    height: ms(56),
    borderWidth: 1.5,
    borderColor: COLORS.surface.fallback,
    borderRadius: ms(12),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
  },
  otpBoxFilled: {
    borderColor: COLORS.warning,
  },
  otpBoxFocused: {
    borderColor: COLORS.primary, // Gives a nice visual cue for where you are typing
  },
  otpText: {
    fontSize: fs(24),
    fontFamily: "Gilroy-Bold",
    color: COLORS.text.primary,
  },
  hiddenInput: {
    position: "absolute",
    width: "100%",
    height: "100%",
    opacity: 0, // This makes it completely invisible!
    zIndex: 99, // Keeps it on top so taps register
  },

  resendContainer: {
    flexDirection: "row",
    alignItems: "center",
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
