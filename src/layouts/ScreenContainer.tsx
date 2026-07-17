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
  RefreshControl,
} from "react-native";
import { hs } from "@/utils/responsive.utils";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "@/constants/theme";

export interface ScreenContainerProps {
  children: React.ReactNode;
  scrollable?: boolean;
  style?: ViewStyle;
  paddingHorizontal?: number;
  backgroundColor?: string;
  refreshing?: boolean;
  onRefresh?: () => void;
  footer?: React.ReactNode;
}

export const ScreenContainer = ({
  children,
  scrollable = false,
  style,
  paddingHorizontal = hs(24),
  backgroundColor = COLORS.background,
  refreshing = false,
  onRefresh,
  footer,
}: ScreenContainerProps) => {
  const Container = scrollable ? ScrollView : View;

  const containerProps = scrollable
    ? {
        showsVerticalScrollIndicator: false,
        contentContainerStyle: [styles.innerContent, { paddingHorizontal }],
        refreshControl: onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        ) : undefined,
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
        {footer && <View style={styles.footerContainer}>{footer}</View>}
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
  footerContainer: {
    width: "100%",
  },
});
