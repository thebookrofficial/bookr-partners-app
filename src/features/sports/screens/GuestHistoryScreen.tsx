// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React from "react";
import { View, StyleSheet, TouchableOpacity, Image } from "react-native";
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { Text } from "@/components/ui";
import {
  ArrowLeft,
  // Bell,
  Settings,
} from "lucide-react-native";
import { BookingCard } from "../components/BookingCard";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
import { useNavigation } from "@react-navigation/native";

export const GuestHistoryScreen = () => {
  const navigation = useNavigation();

  return (
    <ScreenContainer scrollable backgroundColor={COLORS.background} paddingHorizontal={hs(12)}>
      {/* 1. Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={ms(24)} color={COLORS.text.primary} />
        </TouchableOpacity>

        <Text variant="h3" weight="bold" style={styles.headerTitle}>
          Guest History
        </Text>

        <View style={styles.headerActions}>
          {/* <TouchableOpacity style={styles.iconBtn}>
            <Bell size={ms(24)} color={COLORS.text.primary} />
          </TouchableOpacity> */}
          <TouchableOpacity style={styles.iconBtn}>
            <Settings size={ms(24)} color={COLORS.text.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Profile Overview */}
      <View style={styles.profileSection}>
        <Image source={{ uri: "https://placeholder.com/100" }} style={styles.largeAvatar} />
        <View style={styles.profileInfo}>
          <Text variant="body1" weight="semiBold">
            Chirag Patil
          </Text>
          <Text variant="body1" weight="semiBold">
            +91 98344 8943
          </Text>
          <Text variant="body1" weight="medium">
            13 Total Bookings
          </Text>
        </View>
      </View>

      {/* 3. Stats Tabs */}
      <View style={styles.statsTabsContainer}>
        {/* Past Booking (Active) */}
        <View style={[styles.statTab, styles.statTabActive]}>
          <Text variant="body1" weight="semiBold" color={COLORS.text.inverse}>
            12
          </Text>
          <Text variant="caption" weight="semiBold" color={COLORS.text.inverse}>
            Past Booking
          </Text>
        </View>

        {/* Upcoming (Inactive) */}
        <View style={styles.statTab}>
          <Text variant="body1" weight="semiBold" color={COLORS.text.primary}>
            1
          </Text>
          <Text variant="caption" weight="semiBold" color={COLORS.text.muted}>
            Upcoming
          </Text>
        </View>

        {/* Cancelled (Inactive / Danger) */}
        <View style={styles.statTab}>
          <Text variant="body1" weight="semiBold" color={COLORS.text.primary}>
            0
          </Text>
          <Text variant="caption" weight="semiBold" color={COLORS.danger}>
            Cancelled
          </Text>
        </View>
      </View>

      {/* 4. Bookings List */}
      <View style={styles.listSection}>
        <Text variant="body1" weight="bold" style={styles.sectionTitle}>
          PAST BOOKINGS
        </Text>

        {/* Month Group 1 */}
        <Text variant="body2" weight="semiBold" style={styles.monthHeader}>
          Apr 2026
        </Text>
        <BookingCard
          name="Chirag Patil"
          subtitle="Ground 2 (11 v 11)"
          date="Mon, 28 Apr 2026"
          time="7 Am - 8 Am"
          price="₹1600"
          status="Online"
          hideCallButton={true}
        />
        <BookingCard
          name="Chirag Patil"
          subtitle="Ground 2 (11 v 11)"
          date="Mon, 21 Apr 2026"
          time="7 Pm - 8 Pm"
          price="₹100"
          status="Online"
          hideCallButton={true}
        />
        <BookingCard
          name="Chirag Patil"
          subtitle="Ground 1 (9 v 9)"
          date="Mon, 14 Apr 2026"
          time="6 Pm - 7 Pm"
          price="₹800"
          status="Offline"
          // REMOVED: isOfflineRecord={true} - Now it renders with a clean background!
          hideCallButton={true}
        />
        <BookingCard
          name="Chirag Patil"
          subtitle="Ground 2 (11 v 11)"
          date="Mon, 7 Apr 2026"
          time="7 Pm - 8 Pm"
          price="₹100"
          status="Online"
          hideCallButton={true}
        />

        {/* Month Group 2 */}
        <Text variant="body2" weight="semiBold" style={styles.monthHeader}>
          Mar 2026
        </Text>
        <BookingCard
          name="Chirag Patil"
          subtitle="Ground 2 (11 v 11)"
          date="Mon, 7 Apr 2026"
          time="7 Pm - 8 Pm"
          price="₹100"
          status="Online"
          hideCallButton={true}
        />
      </View>

      {/* Bottom Padding */}
      <View style={{ height: vs(40) }} />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: vs(10),
    marginBottom: vs(20),
  },
  backBtn: {
    paddingRight: hs(10),
  },
  headerTitle: {
    flex: 1,
    fontSize: fs(20),
  },
  headerActions: {
    flexDirection: "row",
    gap: hs(10),
  },
  iconBtn: {
    padding: hs(4),
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: hs(20),
    marginBottom: vs(24),
  },
  largeAvatar: {
    width: ms(100),
    height: ms(100),
    borderRadius: ms(50),
    backgroundColor: COLORS.surface.fallback,
  },
  profileInfo: {
    justifyContent: "center",
    gap: vs(4),
  },
  statsTabsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: hs(14),
    marginBottom: vs(24),
  },
  statTab: {
    flex: 1,
    backgroundColor: COLORS.surface.primary,
    borderRadius: ms(10),
    paddingVertical: vs(10),
    alignItems: "center",
    justifyContent: "center",
    gap: vs(4),
  },
  statTabActive: {
    backgroundColor: COLORS.primary,
    borderWidth: 1,
    borderColor: "#CBDFFE",
  },
  listSection: {
    width: "100%",
  },
  sectionTitle: {
    marginBottom: vs(12),
  },
  monthHeader: {
    marginBottom: vs(10),
    marginTop: vs(6),
  },
});
