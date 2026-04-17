// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ViewStyle,
} from "react-native";
import { hs } from "@/utils/responsive.utils";
import { SafeAreaView } from "react-native-safe-area-context";

export interface ScreenContainerProps {
  children: React.ReactNode;
  scrollable?: boolean;
  style?: ViewStyle;
  paddingHorizontal?: number;
  backgroundColor?: string;
}

export const ScreenContainer = ({
  children,
  scrollable = false,
  style,
  paddingHorizontal = hs(24),
  backgroundColor = "#FFFFFF",
}: ScreenContainerProps) => {
  const Container = scrollable ? ScrollView : View;

  const containerProps = scrollable
    ? {
        showsVerticalScrollIndicator: false,
        contentContainerStyle: [styles.innerContent, { paddingHorizontal }],
      }
    : { style: [styles.innerContent, { paddingHorizontal }] };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <Container {...containerProps} style={!scrollable ? containerProps.style : undefined}>
          <View style={[styles.wrapper, style]}>{children}</View>
        </Container>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  innerContent: {
    flexGrow: 1,
  },
  wrapper: {
    flex: 1,
  },
});
