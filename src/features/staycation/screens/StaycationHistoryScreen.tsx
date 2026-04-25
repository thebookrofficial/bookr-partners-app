// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState } from "react";
import { View, StyleSheet, SectionList, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { Text, PillTabs } from "@/components/ui";
import { StaycationHeader } from "../components/StaycationHeader";
import { StaycationBookingCard } from "../components/StaycationBookingCard";
import { Calendar, Plus } from "lucide-react-native";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { StaycationTabParamList } from "@/navigation/navigation.types";
import { useStaycationHome } from "../hooks/useStaycationHome";

const USER_PROFILE = require("../../../assets/icons/ic-user-profile.png");

const MOCK_DATA = [
  {
    date: "22 Apr 2026",
    data: [
      {
        id: "1",
        name: "Chirag Patil",
        phone: "+91 89346 93456",
        amount: "2000",
        status: "Complete" as const,
        checkIn: "22 Apr",
        checkOut: "23 Apr",
        guestCount: 2,
      },
      {
        id: "2",
        name: "Yash Jadhav",
        phone: "+91 89346 93456",
        amount: "2500",
        status: "Complete" as const,
        checkIn: "21 Apr",
        checkOut: "24 Apr",
        guestCount: 2,
      },
    ],
  },
  {
    date: "21 Apr 2026",
    data: [
      {
        id: "3",
        name: "Ritesh Patil",
        phone: "+91 89346 93456",
        amount: "2000",
        status: "Complete" as const,
        checkIn: "21 Apr",
        checkOut: "22 Apr",
        guestCount: 2,
      },
      {
        id: "4",
        name: "Shivtej Patil",
        phone: "+91 89346 93456",
        amount: "2000",
        status: "Complete" as const,
        checkIn: "21 Apr",
        checkOut: "22 Apr",
        guestCount: 2,
      },
    ],
  },
];

export const StaycationHistoryScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<StaycationTabParamList, "StaycationHistory">>();

  // Extract serviceId with fallback from parent navigator
  let serviceId = route.params?.serviceId;
  if (!serviceId) {
    const parentState = navigation.getParent()?.getState();
    const tabRoute = parentState?.routes.find((r: any) => r.name === "StaycationServiceTabs");
    const tabParams = tabRoute?.params as any;
    serviceId = tabParams?.serviceId || tabParams?.params?.serviceId || "";
  }

  const { venue } = useStaycationHome(serviceId);
  const [activeTab, setActiveTab] = useState("Private Rooms");

  return (
    <ScreenContainer scrollable={false} paddingHorizontal={hs(12)}>
      <StaycationHeader
        title={venue?.name || "Vally view farmhouse"}
        subtitle="History"
        imageSource={venue?.cover_image_url ? { uri: venue.cover_image_url } : USER_PROFILE}
      />

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

      <View style={styles.filterRow}>
        <Text variant="body2" weight="semiBold" style={styles.monthText}>
          Apr 2026
        </Text>
        <TouchableOpacity>
          <Calendar size={ms(16)} color={COLORS.text.primary} />
        </TouchableOpacity>
      </View>

      <SectionList
        sections={MOCK_DATA}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <StaycationBookingCard
            {...item}
            onPress={() =>
              (navigation as any).navigate("StaycationBookingDetails", {
                booking: item,
                isFromHistory: true,
              })
            }
          />
        )}
        renderSectionHeader={({ section: { date, data } }) => (
          <View style={styles.sectionHeader}>
            <Text variant="body2" weight="semiBold" style={styles.sectionDate}>
              {date}
            </Text>
            <Text variant="body2" weight="semiBold" style={styles.sectionCount}>
              {data.length}/5
            </Text>
          </View>
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Floating Action Button */}
      <View style={styles.fabContainer}>
        <TouchableOpacity style={styles.fab} activeOpacity={0.8}>
          <Plus size={ms(30)} color="#fff" />
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
    color: "#000",
  },
  pillTabs: {
    flex: 1,
    marginVertical: 0,
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
    color: "#000",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: vs(6),
    paddingHorizontal: hs(6),
  },
  sectionDate: {
    fontSize: fs(14),
    color: "#000",
  },
  sectionCount: {
    fontSize: fs(14),
    color: "#000",
  },
  listContent: {
    paddingBottom: vs(120),
  },
  fabContainer: {
    position: "absolute",
    bottom: vs(100),
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
