// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { Text, PillTabs } from "@/components/ui";
import { ServiceHeader } from "../components/ServiceHeader";
import { LegendIndicator } from "../components/LegendIndicator";
import { TimeSlotGrid, TimeSlotData } from "../components/TimeSlotGrid";
import { BookingCard } from "../components/BookingCard";
import { Calendar as CalendarIcon, Plus } from "lucide-react-native";
import { hs, vs, ms } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";

// --- DUMMY DATA MATCHING FIGMA ---
const DUMMY_SLOTS: TimeSlotData[] = [
  { id: "1", time: "7 AM", status: "unavailable" },
  { id: "2", time: "8 AM", status: "unavailable" },
  { id: "3", time: "9 AM", status: "unavailable" },
  { id: "4", time: "10 AM", status: "unavailable" },
  { id: "5", time: "11 AM", status: "unavailable" },
  { id: "6", time: "12 AM", status: "unavailable" }, // Note: usually 12 PM, keeping Figma text
  { id: "7", time: "1 Pm", status: "available" },
  { id: "8", time: "2 Pm", status: "available" },
  { id: "9", time: "3 Pm", status: "available" },
  { id: "10", time: "4 Pm", status: "available" },
  { id: "11", time: "5 Pm", status: "available" },
  { id: "12", time: "6 Pm", status: "available" },
  { id: "13", time: "7 Pm", status: "online" },
  { id: "14", time: "8 PM", status: "manual" },
  { id: "15", time: "9 Pm", status: "online" },
  { id: "16", time: "10 Pm", status: "online" },
  { id: "17", time: "11 PM", status: "manual" },
  { id: "18", time: "12 Am", status: "manual" },
];

export const SportsHomeScreen = () => {
  const [activeGround, setActiveGround] = useState("Ground 1");

  return (
    <View style={styles.root}>
      <ScreenContainer scrollable backgroundColor={COLORS.background} paddingHorizontal={hs(12)}>
        {/* 1. Header */}
        <ServiceHeader title="Elite Strikers Club" category="Football" />

        {/* 2. Date Selector */}
        <TouchableOpacity style={styles.dateRow}>
          <Text variant="body2" weight="semiBold" color={COLORS.text.primary}>
            Today, 03 Apr 2026
          </Text>
          <CalendarIcon size={ms(16)} color="#00327B" />
        </TouchableOpacity>

        {/* 3. Ground Selector */}
        <View style={styles.groundTabs}>
          <PillTabs
            tabs={["Ground 1", "Ground 2"]}
            activeTab={activeGround}
            onTabChange={setActiveGround}
            variant="primary"
            style={{ marginTop: vs(10), marginBottom: vs(10) }}
          />
        </View>

        {/* 4. Time Slots Section */}
        <Text variant="body1" weight="bold" style={styles.sectionTitle}>
          TIME SLOT
        </Text>
        <LegendIndicator />
        <TimeSlotGrid slots={DUMMY_SLOTS} />

        {/* 5. Bookings List */}
        <View style={styles.bookingsContainer}>
          <BookingCard
            name="Chirag Patil"
            phone="+91 89346 93456"
            date="Mon, 7 Apr 2026"
            time="7 Pm - 8 Pm"
            price="₹800"
            status="Online"
          />
          <BookingCard
            name="Yash Jadhav"
            phone="+91 89346 93456"
            date="Mon, 7 Apr 2026"
            time="8 Pm - 9 Pm"
            price="₹100"
            status="Online"
          />
          <BookingCard
            name="Rohit Sharma"
            phone="+91 89346 93456"
            date="Mon, 7 Apr 2026"
            time="4 Pm - 5 Pm"
            price="₹800"
            status="Offline"
            isOfflineRecord={true}
          />
        </View>

        {/* Bottom Spacer for the Absolute Tab Bar + FAB */}
        <View style={{ height: vs(120) }} />
      </ScreenContainer>

      {/* 6. Floating Action Button (FAB) */}
      <TouchableOpacity style={styles.fab} activeOpacity={0.8}>
        <Plus size={ms(30)} color={COLORS.text.inverse} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  dateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: vs(6),
    marginBottom: vs(6),
  },
  groundTabs: {
    marginTop: -vs(10), // Adjusting PillTabs default margin to match Figma tightness
    marginBottom: vs(10),
  },
  sectionTitle: {
    textTransform: "uppercase",
    marginBottom: vs(6),
  },
  bookingsContainer: {
    marginTop: vs(20),
    width: "100%",
  },
  fab: {
    position: "absolute",
    right: hs(12),
    bottom: vs(95), // Sits right above the 73px tab bar
    width: ms(58),
    height: ms(58),
    borderRadius: ms(29),
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.22,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
});
