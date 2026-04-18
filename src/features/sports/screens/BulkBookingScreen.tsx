// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { Text } from "@/components/ui";
import { ServiceHeader } from "../components/ServiceHeader";
import { BookingCard } from "../components/BookingCard";
import { Plus } from "lucide-react-native";
import { hs, vs, ms } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
import { MainStackParamList } from "@/navigation/navigation.types";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

export const BulkBookingScreen = () => {
  const [activeTab, setActiveTab] = useState<"multiple" | "single">("multiple");

  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();

  const renderContent = () => {
    if (activeTab === "multiple") {
      return (
        <View style={styles.listContainer}>
          {[1, 2, 3].map(id => (
            <BookingCard
              key={id}
              name="Chirag Patil"
              phone="+91 89346 93456"
              date="7 Apr - 14 Apr"
              time="7 Pm - 8 Pm"
              price="" // Price not shown in bulk preview figma
              status="Full" // Placeholder status
              hideCallButton={false}
            />
          ))}
        </View>
      );
    }

    return (
      <View style={styles.listContainer}>
        <BookingCard
          name="Chirag Patil"
          phone="+91 89346 93456"
          date="15 Apr"
          time="7 Am - 12 Pm"
          price=""
          status="Full"
          hideCallButton={false}
        />
      </View>
    );
  };

  return (
    <ScreenContainer backgroundColor={COLORS.background} paddingHorizontal={hs(12)}>
      <ServiceHeader title="Elite Strikers Club" subtitle="Bulk Booking" />

      {/* Custom Pill Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "multiple" ? styles.tabActive : styles.tabInactive]}
          onPress={() => setActiveTab("multiple")}>
          <Text
            variant="body2"
            weight="semiBold"
            color={activeTab === "multiple" ? COLORS.text.inverse : COLORS.text.muted}>
            Multiple days
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "single" ? styles.tabActive : styles.tabInactive]}
          onPress={() => setActiveTab("single")}>
          <Text
            variant="body2"
            weight="semiBold"
            color={activeTab === "single" ? COLORS.text.inverse : COLORS.text.muted}>
            Single days
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {renderContent()}
        <View style={{ height: vs(100) }} />
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() =>
          navigation.navigate("BulkBookingDetails", {
            bookingId: "new",
            type: activeTab === "multiple" ? "multi" : "single",
          })
        }>
        <Plus size={ms(30)} color={COLORS.text.inverse} />
      </TouchableOpacity>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.surface.primary,
    borderRadius: ms(10),
    padding: ms(4),
    marginVertical: vs(10),
    gap: hs(10),
  },
  tab: {
    flex: 1,
    height: vs(32),
    justifyContent: "center",
    alignItems: "center",
    borderRadius: ms(8),
  },
  tabActive: {
    backgroundColor: "#282828",
  },
  tabInactive: {
    backgroundColor: "transparent",
  },
  listContainer: {
    marginTop: vs(10),
  },
  fab: {
    position: "absolute",
    bottom: vs(30),
    right: hs(12),
    width: ms(58),
    height: ms(58),
    borderRadius: ms(32),
    backgroundColor: "#63A1FD",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 4,
  },
});
