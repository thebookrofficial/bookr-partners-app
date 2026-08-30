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
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { hs } from "@/utils/responsive.utils";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "@/constants/theme";
import { useServiceStore } from "@/store/serviceStore";

export interface ScreenContainerProps {
  children: React.ReactNode;
  scrollable?: boolean;
  style?: ViewStyle;
  paddingHorizontal?: number;
  backgroundColor?: string;
  refreshing?: boolean;
  onRefresh?: () => void;
  footer?: React.ReactNode;
  hideTabBarOnScroll?: boolean;
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
  hideTabBarOnScroll = false,
}: ScreenContainerProps) => {
  const Container = scrollable ? ScrollView : View;

  const { setTabBarVisible } = useServiceStore();
  const lastScrollY = React.useRef(0);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!hideTabBarOnScroll) return;
    const currentY = event.nativeEvent.contentOffset.y;
    if (currentY <= 0) {
      setTabBarVisible(true);
      lastScrollY.current = currentY;
      return;
    }

    if (currentY > lastScrollY.current + 10) {
      setTabBarVisible(false);
      lastScrollY.current = currentY;
    } else if (currentY < lastScrollY.current - 10) {
      setTabBarVisible(true);
      lastScrollY.current = currentY;
    }
  };

  React.useEffect(() => {
    return () => {
      if (hideTabBarOnScroll) {
        setTabBarVisible(true);
      }
    };
  }, [hideTabBarOnScroll, setTabBarVisible]);

  // Handle focus loss for horizontal swipe navigators safely (prevents crashes in tests)
  const { NavigationContext } = require("@react-navigation/native");
  const navigation: any = React.useContext(NavigationContext);

  React.useEffect(() => {
    if (!navigation) return;

    const unsubscribeFocus = navigation.addListener("focus", () => {
      if (hideTabBarOnScroll) setTabBarVisible(true);
    });

    const unsubscribeBlur = navigation.addListener("blur", () => {
      if (hideTabBarOnScroll) setTabBarVisible(true);
    });

    return () => {
      unsubscribeFocus();
      unsubscribeBlur();
    };
  }, [navigation, hideTabBarOnScroll, setTabBarVisible]);

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
        onScroll: scrollable ? handleScroll : undefined,
        scrollEventThrottle: scrollable ? 16 : undefined,
        keyboardShouldPersistTaps: "handled" as const,
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
