// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useEffect, useState, useRef } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  InteractionManager,
  Easing,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@/components/ui";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { useServiceStore } from "@/store/serviceStore";

export const CustomTabBar = ({ state, descriptors, navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { routes } = state;
  const { isTabBarVisible, setTabBarVisible } = useServiceStore();

  useEffect(() => {
    setTabBarVisible(true);
  }, [state.index, setTabBarVisible]);

  // Filter out any hidden screens
  const visibleRoutes = routes.filter((route: any) => {
    const { options } = descriptors[route.key];
    if (
      options.tabBarButton &&
      typeof options.tabBarButton === "function" &&
      options.tabBarButton() === null
    ) {
      return false;
    }
    if (options.tabBarItemStyle?.display === "none") {
      return false;
    }
    return true;
  });

  const profileRoute = visibleRoutes.find((r: any) => r.name.toLowerCase().includes("profile"));
  const capsuleRoutes = visibleRoutes.filter((r: any) => !r.name.toLowerCase().includes("profile"));

  const [layouts, setLayouts] = useState<{ [key: number]: { x: number; width: number } }>({});

  const translateX = useRef(new Animated.Value(0)).current;
  const widthAnim = useRef(new Animated.Value(hs(73))).current;
  const capsuleOpacity = useRef(new Animated.Value(1)).current;
  const profileWidth = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  const profileIndex = routes.indexOf(profileRoute);

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: isTabBarVisible ? 0 : vs(150),
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isTabBarVisible, translateY]);

  useEffect(() => {
    InteractionManager.runAfterInteractions(() => {
      const isProfileActive = state.index === profileIndex;

      if (isProfileActive) {
        Animated.parallel([
          Animated.timing(capsuleOpacity, {
            toValue: 0,
            duration: 180,
            useNativeDriver: false,
          }),
          Animated.timing(widthAnim, {
            toValue: 0,
            duration: 180,
            useNativeDriver: false,
          }),
        ]).start();

        Animated.sequence([
          Animated.timing(profileWidth, {
            toValue: 75, // Fluid stretch out (50 + 25)
            duration: 150,
            useNativeDriver: false,
            easing: Easing.out(Easing.ease),
          }),
          Animated.timing(profileWidth, {
            toValue: 50, // Settle to final size
            duration: 150,
            useNativeDriver: false,
            easing: Easing.in(Easing.ease),
          }),
        ]).start();
      } else {
        Animated.timing(capsuleOpacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: false,
        }).start();

        Animated.timing(profileWidth, {
          toValue: 0,
          duration: 150,
          useNativeDriver: false,
          easing: Easing.inOut(Easing.ease),
        }).start();

        const activeLayout = layouts[state.index];
        if (activeLayout) {
          const CAPSULE_WIDTH = hs(73);
          const targetX = activeLayout.x + (activeLayout.width - CAPSULE_WIDTH) / 2;

          Animated.parallel([
            Animated.timing(translateX, {
              toValue: targetX,
              useNativeDriver: false,
              duration: 300,
              easing: Easing.inOut(Easing.ease),
            }),
            Animated.sequence([
              Animated.timing(widthAnim, {
                toValue: CAPSULE_WIDTH + 25, // Safely stretch mid-flight
                duration: 150,
                useNativeDriver: false,
                easing: Easing.out(Easing.ease),
              }),
              Animated.timing(widthAnim, {
                toValue: CAPSULE_WIDTH, // Shrink exactly back to perfect capsule
                duration: 150,
                useNativeDriver: false,
                easing: Easing.in(Easing.ease),
              }),
            ]),
          ]).start();
        }
      }
    });
  }, [state.index, layouts, profileIndex, capsuleOpacity, profileWidth, translateX, widthAnim]);

  const renderTab = (route: any, isProfile = false) => {
    const { options } = descriptors[route.key];
    const label =
      options.tabBarLabel !== undefined
        ? options.tabBarLabel
        : options.title !== undefined
        ? options.title
        : route.name;

    const isFocused = state.index === routes.indexOf(route);

    const onPress = () => {
      const event = navigation.emit({
        type: "tabPress",
        target: route.key,
        canPreventDefault: true,
      });

      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate({ name: route.name, merge: true });
      }
    };

    const Icon = options.tabBarIcon;

    if (isProfile) {
      return (
        <View
          key={route.key}
          style={[styles.profileOuterContainer, isFocused && styles.profileOuterContainerActive]}>
          <Animated.View
            style={[
              styles.profileIndicator,
              {
                width: profileWidth,
                left: Animated.subtract(hs(32.5), Animated.divide(profileWidth, 2)),
              },
            ]}
          />
          <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.profileTabItem}>
            {Icon &&
              Icon({ color: isFocused ? "#63A1FD" : "#8E8E93", focused: isFocused, size: ms(24) })}
            <Text
              weight="bold"
              style={[
                styles.tabLabel,
                isFocused ? styles.tabLabelActive : styles.tabLabelInactive,
              ]}>
              {label}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <TouchableOpacity
        key={route.key}
        onPress={onPress}
        activeOpacity={0.8}
        style={styles.capsuleTabItem}>
        {Icon &&
          Icon({ color: isFocused ? "#63A1FD" : "#8E8E93", focused: isFocused, size: ms(24) })}
        <Text
          weight="bold"
          style={[styles.tabLabel, isFocused ? styles.tabLabelActive : styles.tabLabelInactive]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <Animated.View
      style={[
        styles.tabBarContainer,
        { paddingBottom: Math.max(insets.bottom, vs(16)), transform: [{ translateY }] },
      ]}>
      <View style={styles.capsuleContainer}>
        <Animated.View
          style={[
            styles.capsuleIndicator,
            {
              left: translateX,
              width: widthAnim,
              opacity: capsuleOpacity,
            },
          ]}
        />
        {capsuleRoutes.map((route: any) => {
          const idx = routes.indexOf(route);
          return (
            <View
              key={route.key}
              onLayout={event => {
                const { x, width } = event.nativeEvent.layout;
                setLayouts(prev => ({
                  ...prev,
                  [idx]: { x, width },
                }));
              }}
              style={styles.tabWrapper}>
              {renderTab(route, false)}
            </View>
          );
        })}
      </View>
      {profileRoute && renderTab(profileRoute, true)}
    </Animated.View>
  );
};

export const renderCustomTabBar = (props: any) => <CustomTabBar {...props} />;

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: "row",
    position: "absolute",
    bottom: vs(12),
    left: hs(10),
    right: hs(10),
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "space-between",
    gap: hs(8),
  },
  capsuleContainer: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: ms(36),
    paddingVertical: vs(6),
    paddingHorizontal: hs(0),
    alignItems: "center",
    justifyContent: "space-around",
    borderWidth: 1,
    borderColor: "#E8F0FE",
    boxShadow: "0px 0px 25px rgba(0, 0, 0, 0.16)",
  },
  capsuleTabItem: {
    alignItems: "center",
    justifyContent: "center",
    height: vs(50),
    paddingHorizontal: hs(4),
    borderRadius: ms(25),
    width: "100%",
  },
  capsuleIndicator: {
    position: "absolute",
    height: vs(50),
    borderRadius: ms(25),
    backgroundColor: "#E8F0FE",
  },
  profileOuterContainer: {
    width: hs(65),
    height: vs(65),
    borderRadius: ms(31),
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E8F0FE",
    boxShadow: "0px 0px 25px rgba(0, 0, 0, 0.16)",
  },
  profileOuterContainerActive: {
    borderColor: "#E8F0FE",
  },
  profileIndicator: {
    position: "absolute",
    height: vs(50),
    borderRadius: ms(25),
    backgroundColor: "#E8F0FE",
  },
  profileTabItem: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: ms(25),
    width: hs(73),
    height: vs(50),
  },
  tabWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tabLabel: {
    fontSize: fs(11),
    marginTop: vs(2),
  },
  tabLabelActive: {
    color: "#63A1FD",
  },
  tabLabelInactive: {
    color: "#8E8E93",
  },
});
