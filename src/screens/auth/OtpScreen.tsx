// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState, useRef, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, TextInput as RNTextInput, Alert } from "react-native";
import { Text } from "@/components/ui";
import { AuthScreenProps } from "@/navigation/navigation.types";
import { COLORS } from "@/constants/theme";
import { vs, hs, ms, fs } from "@/utils/responsive.utils";
import { ChevronLeft } from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import { SafeAreaView } from "react-native-safe-area-context";

const OTP_LENGTH = 6;
const TIMER_SECONDS = 30;

export const OtpScreen = ({ navigation, route }: AuthScreenProps<"Otp">) => {
  const { email } = route.params;
  const [otp, setOtp] = useState<string[]>(new Array(OTP_LENGTH).fill(""));
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(TIMER_SECONDS);
  const inputRefs = useRef<Array<RNTextInput | null>>([]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (timer > 0) {
      interval = setInterval(() => setTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Auto-advance to next input
    if (text && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit if full
    if (index === OTP_LENGTH - 1 && text) {
      verifyOtp(newOtp.join(""));
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    // Handle backspace auto-delete and move back
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const verifyOtp = async (code: string) => {
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
    // If successful, the auth listener in RootNavigator will automatically route us to Main!
  };

  const handleResend = async () => {
    setTimer(TIMER_SECONDS);
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) Alert.alert("Error", error.message);
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

        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <RNTextInput
              key={index}
              ref={ref => {
                inputRefs.current[index] = ref;
              }}
              style={[
                styles.otpInput,
                digit !== "" && styles.otpInputFilled,
                // Highlight current empty box logic could go here
              ]}
              maxLength={1}
              keyboardType="number-pad"
              value={digit}
              onChangeText={text => handleChange(text, index)}
              onKeyPress={e => handleKeyPress(e, index)}
              editable={!isLoading}
              selectTextOnFocus
            />
          ))}
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
            <TouchableOpacity onPress={handleResend}>
              <Text variant="body2" weight="bold" color={COLORS.text.primary}>
                Resend
              </Text>
            </TouchableOpacity>
          )}
        </View>
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
    marginBottom: vs(80),
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
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: vs(30),
  },
  otpInput: {
    width: ms(48),
    height: ms(56),
    borderWidth: 1.5,
    borderColor: COLORS.surface.fallback,
    borderRadius: ms(12),
    textAlign: "center",
    fontSize: fs(24),
    fontFamily: "Gilroy-Bold",
    color: COLORS.text.primary,
    backgroundColor: COLORS.background,
  },
  otpInputFilled: {
    borderColor: COLORS.warning, // The yellow border from your Figma
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
