// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useEffect, useState, useRef } from "react";
import { View, StyleSheet, TouchableOpacity, Animated, InteractionManager } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@/components/ui";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";

export const CustomTabBar = ({ state, descriptors, navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { routes } = state;

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
  const widthAnim = useRef(new Animated.Value(73)).current;
  const capsuleOpacity = useRef(new Animated.Value(1)).current;
  const profileWidth = useRef(new Animated.Value(0)).current;

  const profileIndex = routes.indexOf(profileRoute);

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
            toValue: 65,
            duration: 120,
            useNativeDriver: false,
          }),
          Animated.spring(profileWidth, {
            toValue: 50,
            useNativeDriver: false,
            friction: 6,
            tension: 60,
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
        }).start();

        const activeLayout = layouts[state.index];
        if (activeLayout) {
          Animated.parallel([
            Animated.spring(translateX, {
              toValue: activeLayout.x + (activeLayout.width - 73) / 2,
              useNativeDriver: false,
              friction: 8,
              tension: 50,
            }),
            Animated.sequence([
              Animated.timing(widthAnim, {
                toValue: 92,
                duration: 120,
                useNativeDriver: false,
              }),
              Animated.spring(widthAnim, {
                toValue: 73,
                useNativeDriver: false,
                friction: 6,
                tension: 60,
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
    <View style={[styles.tabBarContainer, { paddingBottom: Math.max(insets.bottom, vs(16)) }]}>
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
    </View>
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
