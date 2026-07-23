// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useEffect, useState, useRef } from "react";
import { View, StyleSheet, TouchableOpacity, Animated } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@/components/ui";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { useServiceStore } from "@/store/serviceStore";

export const CustomTabBar = ({ state, descriptors, navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { routes } = state;
  const { isTabBarVisible, setTabBarVisible } = useServiceStore();

  const [activeTabIndex, setActiveTabIndex] = useState<number>(state.index);

  useEffect(() => {
    setTabBarVisible(true);
  }, [state.index, setTabBarVisible]);

  useEffect(() => {
    setActiveTabIndex(state.index);
  }, [state.index]);

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
  const capsuleOpacity = useRef(new Animated.Value(1)).current;
  const profileOpacity = useRef(new Animated.Value(0)).current;
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
    const isProfileActive = activeTabIndex === profileIndex;

    if (isProfileActive) {
      Animated.parallel([
        Animated.timing(capsuleOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.spring(profileOpacity, {
          toValue: 1,
          tension: 140,
          friction: 12,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(profileOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(capsuleOpacity, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();

      const activeLayout = layouts[activeTabIndex];
      if (activeLayout) {
        const CAPSULE_WIDTH = hs(73);
        const targetX = activeLayout.x + (activeLayout.width - CAPSULE_WIDTH) / 2;

        Animated.spring(translateX, {
          toValue: targetX,
          tension: 160,
          friction: 15,
          useNativeDriver: true,
        }).start();
      }
    }
  }, [activeTabIndex, layouts, profileIndex, capsuleOpacity, profileOpacity, translateX]);

  const renderTab = (route: any, isProfile = false) => {
    const { options } = descriptors[route.key];
    const label =
      options.tabBarLabel !== undefined
        ? options.tabBarLabel
        : options.title !== undefined
        ? options.title
        : route.name;

    const routeIndex = routes.indexOf(route);
    const isFocused = activeTabIndex === routeIndex;

    const onPress = () => {
      // 1. Instantly update local state for 0ms visual feedback
      setActiveTabIndex(routeIndex);

      // 2. Emit navigation tabPress event
      const event = navigation.emit({
        type: "tabPress",
        target: route.key,
        canPreventDefault: true,
      });

      // 3. Navigate if allowed
      if (state.index !== routeIndex && !event.defaultPrevented) {
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
                opacity: profileOpacity,
                transform: [{ scale: profileOpacity }],
              },
            ]}
          />
          <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.profileTabItem}>
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
        activeOpacity={0.7}
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
              opacity: capsuleOpacity,
              transform: [{ translateX }],
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
    left: 0,
    width: hs(73),
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
    width: hs(50),
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
