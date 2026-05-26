// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { Text, PillTabs } from "@/components/ui";
import { ServiceHeader } from "@/features/sports/components/ServiceHeader";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { MainStackParamList } from "@/navigation/navigation.types";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Calendar } from "lucide-react-native";
import { useServiceStore } from "@/store/serviceStore";

const PendingPayoutCard = ({
  settlementDate,
  amount,
}: {
  settlementDate: string;
  amount: string;
}) => (
  <View style={styles.pendingSection}>
    <View style={styles.dateRow}>
      <Calendar size={ms(18)} color={COLORS.primary} />
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
          +{amount}
        </Text>
      </View>
    </View>
  </View>
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
          +{amount}
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

  const [activeTab, setActiveTab] = useState("week");

  const tabs = ["Day", "week", "Month", "Custom"];

  return (
    <ScreenContainer backgroundColor={COLORS.background} paddingHorizontal={hs(12)}>
      <ServiceHeader title={activeVenueName} subtitle="Payouts" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text variant="body1" weight="bold" style={styles.sectionTitle}>
          PENDING PAYOUT
        </Text>

        <PendingPayoutCard settlementDate="26 April 2026" amount="₹7000" />
        <PendingPayoutCard settlementDate="25 April 2026" amount="₹6700" />

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

        <PayoutListItem
          amount="₹6700"
          bookings={279}
          dateRange="19 April - 25 April"
          onPress={() => navigation.navigate("PayoutDetails", { venueId, payoutId: "1" })}
        />
        <PayoutListItem
          amount="₹7700"
          bookings={320}
          dateRange="12 April - 18 April"
          onPress={() => navigation.navigate("PayoutDetails", { venueId, payoutId: "2" })}
        />
        <PayoutListItem
          amount="₹7400"
          bookings={312}
          dateRange="5 April - 11 April"
          onPress={() => navigation.navigate("PayoutDetails", { venueId, payoutId: "3" })}
        />
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
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
});
