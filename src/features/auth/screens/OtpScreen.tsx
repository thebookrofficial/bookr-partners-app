// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput as RNTextInput,
  Image,
  ScrollView,
  Dimensions,
} from "react-native";
import { Text, Button } from "@/components/ui";
import { AuthScreenProps } from "@/navigation/navigation.types";
import { COLORS } from "@/constants/theme";
import { vs, hs, ms, fs } from "@/utils/responsive.utils";
import { useAuthLogic } from "../hooks/useAuthLogic";
import { LEGAL_TEXT } from "@/constants/legal";

// Assets
import LoginIllustration from "@/assets/images/login-screen-client-side.svg";
import DividerLine from "@/assets/icons/ic_divider_line.svg";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const OTP_LENGTH = 6;
const TIMER_SECONDS = 30;

export const OtpScreen = ({ navigation, route }: AuthScreenProps<"Otp">) => {
  const { email } = route.params;
  const { isLoading, verifyOtpCode, resendOtpCode } = useAuthLogic();

  const [code, setCode] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [timer, setTimer] = useState(TIMER_SECONDS);

  const hasSubmitted = useRef(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (timer > 0) {
      interval = setInterval(() => setTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  useEffect(() => {
    if (code.length === OTP_LENGTH && !hasSubmitted.current) {
      hasSubmitted.current = true;
      (globalThis as any).otpSubmitTime = Date.now(); // PERFORMANCE TRACKING
      verifyOtpCode(email, code);
    } else if (code.length < OTP_LENGTH) {
      hasSubmitted.current = false;
    }
  }, [code, email, verifyOtpCode]);

  const handleChangeText = (text: string) => {
    const numericText = text.replace(/[^0-9]/g, "");
    setCode(numericText);
  };

  const handleResend = () => {
    resendOtpCode(email, () => setTimer(TIMER_SECONDS));
  };

  const handleLoginPress = () => {
    if (code.length === OTP_LENGTH) {
      (globalThis as any).otpSubmitTime = Date.now(); // PERFORMANCE TRACKING
      verifyOtpCode(email, code);
    }
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
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.illustrationContainer}>
          <LoginIllustration width={hs(380)} height={vs(345)} />
        </View>
      </View>

      <View style={styles.bottomSheet}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}>
          <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit>
            Login
          </Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit code sent to{"\n"}
            <Text style={styles.emailText}>{email}</Text>
          </Text>

          <View style={styles.otpContainer}>
            {new Array(OTP_LENGTH).fill(0).map((_, index) => {
              const digit = code[index] || "";
              const isCurrentBox = isFocused && code.length === index;

              return (
                <View
                  key={index}
                  style={[
                    styles.otpBox,
                    digit !== "" && styles.otpBoxFilled,
                    isCurrentBox && styles.otpBoxFocused,
                  ]}>
                  <Text style={styles.otpText}>{digit}</Text>
                </View>
              );
            })}

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
              autoComplete="one-time-code"
              textContentType="oneTimeCode"
            />
          </View>

          <View style={styles.resendContainer}>
            <Text style={styles.resendLabel}>Didn’t received the OTP? </Text>
            {timer > 0 ? (
              <Text style={styles.timerText}>Resend in {timer}s</Text>
            ) : (
              <TouchableOpacity onPress={handleResend} disabled={isLoading}>
                <Text style={styles.resendText}>Resend</Text>
              </TouchableOpacity>
            )}
          </View>

          <Button
            title="Login"
            variant="primary"
            onPress={handleLoginPress}
            isLoading={isLoading}
            disabled={code.length !== OTP_LENGTH || isLoading}
            style={styles.loginButton}
            textStyle={styles.loginButtonText}
          />

          <View style={styles.dividerContainer}>
            <DividerLine
              width={hs(70)}
              height={1}
              stroke={COLORS.text.muted}
              style={styles.dividerLine}
            />
            <Text style={styles.dividerText}>Or login with</Text>
            <DividerLine
              width={hs(70)}
              height={1}
              stroke={COLORS.text.muted}
              style={styles.dividerLine}
            />
          </View>

          <TouchableOpacity style={styles.socialButton}>
            <Image
              source={{ uri: "https://img.icons8.com/color/48/google-logo.png" }}
              style={styles.socialIcon}
            />
            <Text style={styles.socialButtonText}>Sign in with Google</Text>
          </TouchableOpacity>

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
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.danger,
  },
  header: {
    height: SCREEN_HEIGHT * 0.4,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: vs(40),
  },
  logoContainer: {
    alignItems: "center",
    zIndex: 10,
  },
  logo: {
    width: hs(180),
    height: vs(70),
  },
  partnerText: {
    fontFamily: "Gilroy-Bold",
    fontSize: fs(36),
    color: COLORS.text.inverse,
    marginTop: vs(-10),
  },
  illustrationContainer: {
    position: "absolute",
    bottom: vs(-20),
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  bottomSheet: {
    flex: 1,
    backgroundColor: "#F0F0F0",
    borderTopLeftRadius: ms(30),
    borderTopRightRadius: ms(30),
    paddingHorizontal: hs(30),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  scrollContent: {
    paddingTop: vs(30),
    paddingBottom: vs(40),
    alignItems: "center",
  },
  title: {
    fontFamily: "Gilroy-Bold",
    fontSize: fs(34),
    color: COLORS.danger,
    marginBottom: vs(12),
    textAlign: "center",
    width: "100%",
    lineHeight: fs(42), // Added explicit line height
    paddingTop: vs(4), // Added padding to prevent clipping
  },
  subtitle: {
    fontFamily: "Gilroy-Medium",
    fontSize: fs(14),
    color: COLORS.text.muted,
    textAlign: "center",
    marginBottom: vs(28),
    lineHeight: fs(20),
  },
  emailText: {
    fontFamily: "Gilroy-Bold",
    color: COLORS.text.primary,
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: vs(20),
    position: "relative",
  },
  otpBox: {
    width: ms(48),
    height: ms(56),
    borderWidth: 1.5,
    borderColor: "transparent", // Default to transparent
    borderRadius: ms(21),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E1E1E1",
  },
  otpBoxFilled: {
    borderColor: COLORS.danger, // Red border when filled
    backgroundColor: "#E1E1E1",
  },
  otpBoxFocused: {
    borderColor: COLORS.danger, // Red border when focused
    borderWidth: 2,
  },
  otpText: {
    fontSize: fs(24), // Increased from 14
    fontFamily: "Gilroy-Bold",
    color: COLORS.text.primary,
  },
  hiddenInput: {
    position: "absolute",
    width: "100%",
    height: "100%",
    opacity: 0,
    zIndex: 99,
  },
  resendContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: vs(28),
  },
  resendLabel: {
    fontFamily: "Gilroy-Medium",
    fontSize: fs(16),
    color: COLORS.text.muted,
  },
  resendText: {
    fontFamily: "Gilroy-Bold",
    fontSize: fs(16),
    color: COLORS.danger,
  },
  timerText: {
    fontFamily: "Gilroy-Medium",
    fontSize: fs(16),
    color: COLORS.text.muted,
  },
  loginButton: {
    width: "100%",
    height: vs(54),
    borderRadius: ms(21),
    backgroundColor: COLORS.danger,
    marginBottom: vs(28),
  },
  loginButtonText: {
    fontFamily: "Gilroy-Bold",
    fontSize: fs(16),
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: vs(28),
    width: "100%",
    justifyContent: "center",
  },
  dividerLine: {
    width: hs(70),
    height: 1,
    tintColor: COLORS.text.muted,
  },
  dividerText: {
    fontFamily: "Gilroy-Medium",
    fontSize: fs(16),
    color: COLORS.text.muted,
    marginHorizontal: hs(10),
  },
  socialButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: vs(54),
    backgroundColor: "#E1E1E1",
    borderRadius: ms(21),
    marginBottom: vs(20),
  },
  socialIcon: {
    width: 24,
    height: 24,
    marginRight: hs(10),
  },
  socialButtonText: {
    fontFamily: "Gilroy-Bold",
    fontSize: fs(14),
    color: COLORS.text.muted,
  },
  footer: {
    alignItems: "center",
    marginTop: vs(20),
  },
  footerLinks: {
    flexDirection: "row",
    marginTop: vs(4),
  },
  linkText: {
    textDecorationLine: "underline",
  },
});
