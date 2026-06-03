// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { Text, PillTabs } from "@/components/ui";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { MainStackParamList } from "@/navigation/navigation.types";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Calendar as CalendarIcon } from "lucide-react-native";
import { useServiceStore } from "@/store/serviceStore";
import { usePayouts } from "../hooks/usePayouts";
import DateTimePicker from "@react-native-community/datetimepicker";

const PendingPayoutCard = ({
  settlementDate,
  amount,
  onPress,
}: {
  settlementDate: string;
  amount: string;
  onPress: () => void;
}) => (
  <TouchableOpacity style={styles.pendingSection} activeOpacity={0.7} onPress={onPress}>
    <View style={styles.dateRow}>
      <CalendarIcon size={ms(18)} color={COLORS.primary} />
      <Text variant="body2" weight="semiBold" style={styles.dateText}>
        {settlementDate}
      </Text>
    </View>
    <View style={styles.settleCard}>
      <Text variant="body2" weight="semiBold">
        Payment will settle at
      </Text>
      <View style={styles.cardBottom}>
        <Text variant="body2" weight="semiBold">
          {settlementDate}
        </Text>
        <Text variant="body2" weight="semiBold" color={COLORS.primary}>
          +₹{amount}
        </Text>
      </View>
    </View>
  </TouchableOpacity>
);

const PayoutListItem = ({
  amount,
  bookings,
  dateRange,
  onPress,
}: {
  amount: string;
  bookings: number;
  dateRange: string;
  onPress: () => void;
}) => (
  <TouchableOpacity style={styles.payoutItem} activeOpacity={0.7} onPress={onPress}>
    <View style={styles.payoutItemHeader}>
      <View>
        <Text variant="caption" weight="semiBold" color={COLORS.text.primary}>
          Payout amount
        </Text>
        <Text variant="h3" weight="semiBold" color={COLORS.success} style={styles.amountText}>
          +₹{amount}
        </Text>
      </View>
      <View style={styles.bookingsInfo}>
        <Text variant="caption" weight="semiBold" color={COLORS.text.primary}>
          Total Bookings
        </Text>
        <Text variant="h3" weight="semiBold" style={styles.bookingsCount}>
          {bookings}
        </Text>
      </View>
    </View>
    <Text variant="body2" weight="semiBold" color={COLORS.text.muted}>
      Payout for {dateRange}
    </Text>
  </TouchableOpacity>
);

export const PayoutsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const route = useRoute<RouteProp<MainStackParamList, "Payouts">>();
  const { venueId } = route.params;
  const { activeVenueName } = useServiceStore();

  const {
    activeTab,
    setActiveTab,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    pendingPayouts,
    historicalPayouts,
    loading,
  } = usePayouts(venueId);

  const [showPicker, setShowPicker] = useState<"start" | "end" | null>(null);

  const tabs = ["Day", "week", "Month", "Custom"];

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handlePayoutPress = (item: any, isPending: boolean = false) => {
    let startDate = "";
    let endDate = "";

    if (isPending) {
      startDate = item.date;
      endDate = item.date;
    } else {
      startDate = item.payout_date;
      // Calculate endDate based on interval
      const start = new Date(startDate);
      const end = new Date(start);

      if (activeTab.toLowerCase() === "week") {
        end.setDate(start.getDate() + 6);
      } else if (activeTab.toLowerCase() === "month") {
        end.setMonth(start.getMonth() + 1);
        end.setDate(0); // Last day of month
      }
      endDate = end.toISOString().split("T")[0];
    }

    navigation.navigate("PayoutDetails", {
      venueId,
      startDate,
      endDate,
      displayLabel: isPending ? item.displayDate : item.display_label,
      totalBookings: isPending ? item.count : item.booking_count,
    });
  };

  return (
    <ScreenContainer backgroundColor={COLORS.background} paddingHorizontal={hs(12)}>
      <View style={styles.header}>
        <Text variant="h3" weight="bold">
          {activeVenueName}
        </Text>
        <Text variant="body2" weight="semiBold" color={COLORS.text.muted}>
          Payouts
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text variant="body1" weight="bold" style={styles.sectionTitle}>
          PENDING PAYOUT
        </Text>

        {loading && pendingPayouts.length === 0 ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginVertical: vs(20) }} />
        ) : (
          pendingPayouts.map((item, index) => (
            <PendingPayoutCard
              key={index}
              settlementDate={item.displayDate}
              amount={Number(item.amount).toFixed(2)}
              onPress={() => handlePayoutPress(item, true)}
            />
          ))
        )}

        <Text variant="body1" weight="bold" style={styles.sectionTitle}>
          PAYOUTS
        </Text>

        <PillTabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          variant="dark"
          style={styles.tabs}
        />

        {activeTab.toLowerCase() === "custom" && (
          <View style={styles.customRangeContainer}>
            <TouchableOpacity
              style={styles.dateSelector}
              onPress={() => setShowPicker("start")}
              activeOpacity={0.7}>
              <Text variant="caption" color={COLORS.text.muted}>
                From
              </Text>
              <View style={styles.dateValueRow}>
                <CalendarIcon size={ms(16)} color={COLORS.primary} />
                <Text variant="body2" weight="semiBold">
                  {formatDate(customStartDate)}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dateSelector}
              onPress={() => setShowPicker("end")}
              activeOpacity={0.7}>
              <Text variant="caption" color={COLORS.text.muted}>
                To
              </Text>
              <View style={styles.dateValueRow}>
                <CalendarIcon size={ms(16)} color={COLORS.primary} />
                <Text variant="body2" weight="semiBold">
                  {formatDate(customEndDate)}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {showPicker && (
          <DateTimePicker
            value={showPicker === "start" ? customStartDate : customEndDate}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowPicker(null);
              if (selectedDate) {
                if (showPicker === "start") {
                  setCustomStartDate(selectedDate);
                } else {
                  setCustomEndDate(selectedDate);
                }
              }
            }}
          />
        )}

        {loading && historicalPayouts.length === 0 ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginVertical: vs(20) }} />
        ) : (
          historicalPayouts.map((item, index) => (
            <PayoutListItem
              key={index}
              amount={Number(item.total_amount).toFixed(2)}
              bookings={item.booking_count}
              dateRange={item.display_label}
              onPress={() => handlePayoutPress(item)}
            />
          ))
        )}
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  header: {
    marginTop: vs(10),
    marginBottom: vs(15),
  },
  scrollContent: { paddingBottom: vs(20) },
  sectionTitle: { textTransform: "uppercase", marginTop: vs(15), marginBottom: vs(10) },
  pendingSection: { marginBottom: vs(15) },
  dateRow: { flexDirection: "row", alignItems: "center", gap: hs(10), marginBottom: vs(8) },
  dateText: { fontSize: fs(14) },
  settleCard: {
    backgroundColor: COLORS.surface.primary,
    borderRadius: ms(10),
    padding: ms(12),
    gap: vs(4),
  },
  cardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tabs: { marginVertical: vs(5) },
  payoutItem: {
    backgroundColor: COLORS.surface.primary,
    borderRadius: ms(10),
    padding: ms(12),
    marginBottom: vs(10),
    gap: vs(10),
  },
  payoutItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  amountText: { fontSize: fs(24), marginTop: vs(4) },
  bookingsInfo: { alignItems: "flex-end" },
  bookingsCount: { fontSize: fs(20), marginTop: vs(4) },
  customRangeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: hs(10),
    marginVertical: vs(10),
  },
  dateSelector: {
    flex: 1,
    backgroundColor: COLORS.surface.primary,
    borderRadius: ms(10),
    padding: ms(10),
    gap: vs(4),
  },
  dateValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(6),
  },
});
