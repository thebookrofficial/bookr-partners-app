// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, Switch, AppState, AppStateStatus } from "react-native";
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { Text } from "@/components/ui";
import { ArrowLeft, Bell, Calendar, Percent, Info } from "lucide-react-native";
import { vs, hs, ms, fs } from "@/utils/responsive.utils";
import { useNavigation } from "@react-navigation/native";
import { COLORS } from "@/constants/theme";
import { notificationService } from "../services/notificationService";

export const NotificationSettingsScreen = () => {
  const navigation = useNavigation();

  const [settings, setSettings] = useState({
    all: false,
    bookings: true,
    promotions: false,
    system: true,
  });

  // 1. Initial Check & AppState Listener
  useEffect(() => {
    checkCurrentStatus();

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === "active") {
        checkCurrentStatus();
      }
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, []);

  const checkCurrentStatus = async () => {
    const isEnabled = await notificationService.checkPermission();
    setSettings(prev => ({ ...prev, all: isEnabled }));
  };

  const handleToggleAll = async () => {
    const result = await notificationService.toggleNotifications(settings.all);
    // Note: If turning OFF, it might return false or show an Alert.
    // We update the state based on what the user actually did (or system status)
    if (result !== undefined) {
      setSettings(prev => ({ ...prev, all: result }));
    }
  };

  const toggleSetting = (key: keyof typeof settings) => {
    if (key === "all") {
      handleToggleAll();
    } else {
      setSettings(prev => ({
        ...prev,
        [key]: !prev[key],
      }));
      // Future: Call a service to persist individual preferences to Supabase
    }
  };

  const renderToggle = (
    icon: React.ReactNode,
    label: string,
    description: string,
    value: boolean,
    onToggle: () => void,
    disabled = false,
  ) => (
    <View style={[styles.row, disabled && styles.disabledRow]}>
      <View style={styles.iconContainer}>{icon}</View>
      <View style={styles.textContainer}>
        <Text variant="body1" weight="bold" color={COLORS.text.primary}>
          {label}
        </Text>
        <Text variant="caption" color={COLORS.text.muted}>
          {description}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        disabled={disabled}
        trackColor={{ false: COLORS.border.pillActive, true: COLORS.primary }}
        thumbColor={COLORS.surface.primary}
      />
    </View>
  );

  return (
    <ScreenContainer scrollable backgroundColor={COLORS.background} paddingHorizontal={hs(12)}>
      {/* 1. App Bar */}
      <View style={styles.appBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={ms(20)} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text variant="h3" weight="bold">
          Notification Center
        </Text>
      </View>

      {/* 2. Global Toggle */}
      <View style={styles.sectionContainer}>
        {renderToggle(
          <Bell size={ms(20)} color={settings.all ? COLORS.primary : COLORS.text.muted} />,
          "Allow Notifications",
          "Turn on/off all push notifications",
          settings.all,
          () => toggleSetting("all"),
        )}
      </View>

      <View style={styles.divider} />

      {/* 3. Specific Toggles */}
      <View style={styles.sectionContainer}>
        <Text variant="body1" weight="bold" style={styles.sectionTitle}>
          PREFERENCES
        </Text>

        <View style={styles.listContainer}>
          {renderToggle(
            <Calendar size={ms(20)} color={COLORS.primary} />,
            "Booking Updates",
            "Get notified about new bookings, cancellations, and reschedules",
            settings.bookings && settings.all,
            () => toggleSetting("bookings"),
            !settings.all,
          )}

          {renderToggle(
            <Percent size={ms(20)} color={COLORS.primary} />,
            "Promotional Offers",
            "Receive updates about discounts, seasonal offers, and marketing tips",
            settings.promotions && settings.all,
            () => toggleSetting("promotions"),
            !settings.all,
          )}

          {renderToggle(
            <Info size={ms(20)} color={COLORS.primary} />,
            "System Alerts",
            "Important updates regarding your account, maintenance, and security",
            settings.system && settings.all,
            () => toggleSetting("system"),
            !settings.all,
          )}
        </View>
      </View>

      {/* 4. Footer Information */}
      <View style={styles.footer}>
        <Text variant="caption" color={COLORS.text.muted} style={styles.footerText}>
          Changing these settings will only affect push notifications sent to this device. You can
          further customize notification delivery in your device's system settings.
        </Text>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  appBar: {
    flexDirection: "row",
    alignItems: "center",
    height: vs(37),
    marginTop: vs(6),
    marginBottom: vs(30),
    gap: hs(10),
  },
  backBtn: {
    justifyContent: "center",
    alignItems: "center",
  },
  sectionContainer: {
    marginBottom: vs(15),
    width: "100%",
  },
  sectionTitle: {
    textTransform: "uppercase",
    marginBottom: vs(15),
    color: COLORS.text.muted,
  },
  listContainer: {
    gap: vs(16),
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface.primary,
    padding: ms(12),
    borderRadius: ms(12),
    gap: hs(12),
  },
  disabledRow: {
    opacity: 0.6,
  },
  iconContainer: {
    width: hs(32),
    height: hs(32),
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderRadius: ms(8),
  },
  textContainer: {
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border.navBar,
    marginVertical: vs(20),
    width: "100%",
  },
  footer: {
    marginTop: vs(40),
    paddingHorizontal: hs(10),
  },
  footerText: {
    textAlign: "center",
    lineHeight: fs(16),
  },
});
