// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useEffect, useState, useRef } from "react";
import { View, StyleSheet, TouchableOpacity, Animated } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@/components/ui";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { useServiceStore } from "@/store/serviceStore";

export const CustomTabBar = ({ state, descriptors, navigation, fullTabs }: any) => {
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

  // If fullTabs is provided, use it. Otherwise, fallback to visibleRoutes from state.
  const tabsToRender = fullTabs || visibleRoutes;

  const profileRoute = tabsToRender.find(
    (r: any) => r.isProfile || (r.name && r.name.toLowerCase().includes("profile")),
  );
  const capsuleRoutes = tabsToRender.filter(
    (r: any) => !(r.isProfile || (r.name && r.name.toLowerCase().includes("profile"))),
  );

  const [layouts, setLayouts] = useState<{ [key: number]: { x: number; width: number } }>({});

  const translateX = useRef(new Animated.Value(0)).current;
  const capsuleOpacity = useRef(new Animated.Value(1)).current;
  const profileOpacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  // Determine active indices for the indicator
  const activeRouteName = routes[activeTabIndex]?.name;
  const isProfileActive =
    profileRoute && (profileRoute.name || profileRoute.key) === activeRouteName;
  const activeCapsuleIndex = capsuleRoutes.findIndex(
    (t: any) => (t.name || t.key) === activeRouteName,
  );

  const profileIndex = routes.findIndex(
    (r: any) => r.name === (profileRoute?.name || profileRoute?.key),
  );

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: isTabBarVisible ? 0 : vs(150),
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isTabBarVisible, translateY]);

  useEffect(() => {
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

      const activeLayout = layouts[activeCapsuleIndex];
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
  }, [
    activeTabIndex,
    layouts,
    profileIndex,
    capsuleOpacity,
    profileOpacity,
    translateX,
    isProfileActive,
    activeCapsuleIndex,
  ]);

  const renderTab = (tab: any, isProfile = false) => {
    const isCustom = !!fullTabs;
    const routeIndex = isCustom
      ? routes.findIndex((r: any) => r.name === tab.name)
      : routes.indexOf(tab);
    const route = isCustom ? routes[routeIndex] : tab;

    let label, Icon, isDisabled;
    if (isCustom) {
      label = tab.label;
      Icon = tab.Icon;
      isDisabled = tab.disabled;
    } else {
      const { options } = descriptors[route.key];
      label =
        options.tabBarLabel !== undefined
          ? options.tabBarLabel
          : options.title !== undefined
          ? options.title
          : route.name;
      Icon = options.tabBarIcon;
      isDisabled = options.accessibilityState?.disabled === true;
    }

    const isFocused = routeIndex !== -1 && activeTabIndex === routeIndex;

    const onPress = () => {
      if (isDisabled) {
        return;
      }
      if (!route) return; // Failsafe

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

    if (isProfile) {
      return (
        <View
          key={route?.key || tab.name || label}
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
        key={route?.key || tab.name || label}
        onPress={onPress}
        activeOpacity={isDisabled ? 1 : 0.7}
        style={[styles.capsuleTabItem, isDisabled && { opacity: 0.4 }]}>
        {Icon &&
          Icon({
            color: isDisabled ? "#8E8E93" : isFocused ? "#63A1FD" : "#8E8E93",
            focused: isFocused,
            size: ms(24),
          })}
        <Text
          weight="bold"
          style={[
            styles.tabLabel,
            isDisabled
              ? styles.tabLabelInactive
              : isFocused
              ? styles.tabLabelActive
              : styles.tabLabelInactive,
          ]}>
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
        {capsuleRoutes.map((tab: any, idx: number) => {
          return (
            <View
              key={tab.name || tab.key}
              onLayout={event => {
                const { x, width } = event.nativeEvent.layout;
                setLayouts(prev => ({
                  ...prev,
                  [idx]: { x, width },
                }));
              }}
              style={styles.tabWrapper}>
              {renderTab(tab, false)}
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
