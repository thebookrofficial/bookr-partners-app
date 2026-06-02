// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, Image, ScrollView, Dimensions } from "react-native";
import { Text, Button } from "@/components/ui";
import { AuthScreenProps } from "@/navigation/navigation.types";
import { COLORS } from "@/constants/theme";
import { vs, hs, ms, fs } from "@/utils/responsive.utils";
import { useAuthLogic } from "../hooks/useAuthLogic";
import { AuthTextInput } from "../components/AuthTextInput";
import { LEGAL_TEXT } from "@/constants/legal";

// Assets
import LoginIllustration from "@/assets/images/login-screen-client-side.svg";
import EmailIcon from "@/assets/icons/ic_email_outline.svg";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export const LoginScreen = ({ navigation }: AuthScreenProps<"Login">) => {
  const [email, setEmail] = useState("");
  const { isLoading, loginWithEmail, loginWithGoogle } = useAuthLogic();

  const handleEmailContinue = () => {
    loginWithEmail(email, isBypass => {
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
    <View style={styles.container}>
      <View style={styles.header}>
        {/* <View style={styles.logoContainer}>
          <Image
            source={require("@/assets/images/white_bookr_logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.partnerText}>Partner</Text>
        </View> */}

        <View style={styles.illustrationContainer}>
          <LoginIllustration width={hs(440)} height={vs(400)} />
        </View>
      </View>
      <View style={styles.bottomSheet}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}>
          <Text style={styles.welcomeTitle} numberOfLines={1} adjustsFontSizeToFit>
            Welcome Back!
          </Text>

          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <EmailIcon width={hs(20)} height={vs(16)} />
              <AuthTextInput
                placeholder="Email address"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
                style={styles.emailInput}
              />
            </View>
          </View>

          <Button
            title="Continue with email address"
            variant="primary"
            onPress={handleEmailContinue}
            isLoading={isLoading}
            disabled={!email.trim() || isLoading}
            style={styles.continueButton}
            textStyle={styles.continueButtonText}
          />

          <View style={styles.dividerContainer}>
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Or login with</Text>
              <View style={styles.dividerLine} />
            </View>
            <Text style={styles.dividerText}>Or login with</Text>
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Or login with</Text>
              <View style={styles.dividerLine} />
            </View>
          </View>

          <TouchableOpacity style={styles.socialButton} onPress={loginWithGoogle}>
            <Image
              source={{ uri: "https://img.icons8.com/color/48/google-logo.png" }}
              style={styles.socialIcon}
            />
            <Text style={styles.socialButtonText}>Sign in with Google</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.socialButton}>
            <Image
              source={{ uri: "https://img.icons8.com/ios-filled/50/000000/mac-os.png" }}
              style={styles.socialIcon}
            />
            <Text style={styles.socialButtonText}>Sign in with Apple</Text>
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
    bottom: vs(-26),
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
    boxShadow: "0px -5px 60px rgba(0, 0, 0, 0.46)",
  },
  scrollContent: {
    paddingTop: vs(30),
    paddingBottom: vs(40),
    alignItems: "center",
  },
  welcomeTitle: {
    fontFamily: "Gilroy-Bold",
    fontSize: fs(34),
    color: COLORS.danger,
    marginBottom: vs(28),
    textAlign: "center",
    width: "100%",
    lineHeight: fs(42), // Added explicit line height
    paddingTop: vs(4), // Added padding to prevent clipping
  },
  inputContainer: {
    width: "100%",
    marginBottom: vs(28),
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E1E1E1",
    borderRadius: ms(21),
    paddingHorizontal: hs(20),
    height: vs(54),
  },
  inputIcon: {
    width: hs(24),
    height: vs(24),
    marginRight: hs(10),
  },
  emailInput: {
    flex: 1,
    height: "100%",
    backgroundColor: "transparent",
    borderWidth: 0,
    paddingHorizontal: 0,
    fontSize: fs(14),
    fontFamily: "Gilroy-Bold",
  },
  continueButton: {
    width: "100%",
    height: vs(54),
    borderRadius: ms(21),
    backgroundColor: COLORS.danger,
    marginBottom: vs(28),
  },
  continueButtonText: {
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
