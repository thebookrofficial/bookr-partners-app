// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState } from "react";
import { View, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { Text, PillTabs } from "@/components/ui";
import { ServiceHeader } from "@/features/sports/components/ServiceHeader";
import { StaycationBookingCard } from "../components/StaycationBookingCard";
import { StaycationBooking } from "../types/staycation.types";
import { Calendar, Plus } from "lucide-react-native";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";

const USER_PROFILE = require("../../../assets/icons/ic-user-profile.png");

const MOCK_DATA: StaycationBooking[] = [
  {
    id: "1",
    name: "Chirag Patil",
    phone: "+91 89346 93456",
    amount: "500",
    status: "Advance",
    checkIn: "16 Apr",
    checkOut: "17 Apr",
    guestCount: 3,
  },
  {
    id: "2",
    name: "Yash Jadhav",
    phone: "+91 89346 93456",
    amount: "10000",
    status: "Full",
    checkIn: "20 Apr",
    checkOut: "22 Apr",
    guestCount: 2,
  },
  {
    id: "3",
    name: "Om Powar",
    phone: "+91 89346 93456",
    amount: "800",
    status: "Offline",
    checkIn: "23 Apr",
    checkOut: "24 Apr",
    guestCount: 3,
  },
  {
    id: "4",
    name: "Yash Jadhav",
    phone: "+91 89346 93456",
    amount: "1000",
    status: "Advance",
    checkIn: "30 Apr",
    checkOut: "02 May",
    guestCount: 2,
  },
];

export const StaycationHistoryScreen = () => {
  const [activeTab, setActiveTab] = useState("Private Rooms");

  return (
    <ScreenContainer scrollable={false} paddingHorizontal={hs(12)}>
      <ServiceHeader title="Hilltop Mountain Resort" imageSource={USER_PROFILE} />

      <View style={styles.tabRow}>
        <Text variant="body1" weight="bold" style={styles.bookingsLabel}>
          Bookings
        </Text>
        <PillTabs
          tabs={["Private Rooms", "Delux Rooms", "Cottages"]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          variant="dark"
          style={styles.pillTabs}
        />
      </View>

      <View style={styles.subtitleRow}>
        <Text variant="body1" weight="bold" style={styles.categorySubtitle}>
          {activeTab}
        </Text>
      </View>

      <View style={styles.filterRow}>
        <Text variant="body2" weight="semiBold" style={styles.monthText}>
          Apr 2026
        </Text>
        <TouchableOpacity>
          <Calendar size={ms(16)} color={COLORS.text.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={MOCK_DATA}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <StaycationBookingCard {...item} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Floating Action Button */}
      <View style={styles.fabContainer}>
        <TouchableOpacity style={styles.fab} activeOpacity={0.8}>
          <Plus size={ms(30)} color={COLORS.text.inverse} />
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  tabRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(10),
    marginVertical: vs(10),
    height: vs(40),
  },
  bookingsLabel: {
    fontSize: fs(16),
  },
  pillTabs: {
    flex: 1,
    marginVertical: 0,
  },
  subtitleRow: {
    height: vs(40),
    justifyContent: "center",
  },
  categorySubtitle: {
    fontSize: fs(16),
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: vs(10),
    paddingHorizontal: hs(6),
  },
  monthText: {
    fontSize: fs(14),
  },
  listContent: {
    paddingBottom: vs(120),
  },
  fabContainer: {
    position: "absolute",
    bottom: vs(100), // Adjusted to be above bottom tabs
    right: hs(12),
  },
  fab: {
    width: ms(60),
    height: ms(60),
    borderRadius: ms(30),
    backgroundColor: "#63A1FD",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
});
