// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { Text, Button } from "@/components/ui";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { MainStackParamList } from "@/navigation/navigation.types";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ChevronDown, ChevronUp } from "lucide-react-native";
import { useServiceStore } from "@/store/serviceStore";
import { usePayoutDetails } from "../hooks/usePayoutDetails";

const DetailRow = ({
  label,
  value,
  weight = "medium",
}: {
  label: string;
  value: string;
  weight?: "medium" | "semiBold" | "bold";
}) => (
  <View style={styles.detailRow}>
    <Text
      variant="body2"
      weight={weight === "medium" ? "medium" : weight === "semiBold" ? "semiBold" : "bold"}
      color={COLORS.text.primary}>
      {label}
    </Text>
    <Text
      variant="body2"
      weight={weight === "medium" ? "medium" : weight === "semiBold" ? "semiBold" : "bold"}
      color={COLORS.text.primary}>
      {value}
    </Text>
  </View>
);

const ExpandableSection = ({
  title,
  amount,
  children,
  defaultExpanded = false,
}: {
  title: string;
  amount: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <View style={styles.sectionContainer}>
      <TouchableOpacity
        style={styles.sectionHeader}
        activeOpacity={0.7}
        onPress={() => setIsExpanded(!isExpanded)}>
        <View style={styles.headerTitleRow}>
          <Text variant="body2" weight="bold" color={COLORS.text.primary}>
            {title}
          </Text>
          {isExpanded ? (
            <ChevronUp size={ms(16)} color={COLORS.text.primary} />
          ) : (
            <ChevronDown size={ms(16)} color={COLORS.text.primary} />
          )}
        </View>
        <Text variant="body2" weight="bold" color={COLORS.text.primary}>
          {amount}
        </Text>
      </TouchableOpacity>

      {isExpanded && <View style={styles.sectionContent}>{children}</View>}
    </View>
  );
};

export const PayoutDetailsScreen = () => {
  const _navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const route = useRoute<RouteProp<MainStackParamList, "PayoutDetails">>();
  const { venueId, startDate, endDate, displayLabel } = route.params;
  const { activeVenueName } = useServiceStore();

  const { breakdown, loading } = usePayoutDetails(venueId, startDate, endDate);

  if (loading && !breakdown) {
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
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={COLORS.primary} size="large" />
        </View>
      </ScreenContainer>
    );
  }

  // Total online bookings from breakdown
  const onlineCount = breakdown?.count || 0;

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
        <View style={styles.summaryHeader}>
          <Text variant="body1" weight="bold">
            {displayLabel}
          </Text>
          <Text variant="body1" weight="bold">
            {onlineCount} Bookings
          </Text>
        </View>

        <View style={styles.detailsCard}>
          <ExpandableSection
            title="Total Customer Paid"
            amount={`+₹${breakdown?.totalPaid || 0}`}
            defaultExpanded>
            <DetailRow
              label={`${breakdown?.full.count || 0} Full payments`}
              value={`₹${breakdown?.full.total || 0}`}
            />
            <DetailRow
              label={`${breakdown?.advance.count || 0} Advance payments`}
              value={`₹${breakdown?.advance.total || 0}`}
            />
          </ExpandableSection>

          <View style={styles.divider} />

          <ExpandableSection title="Bookr fees" amount={`-₹${breakdown?.commission || 0}`}>
            <DetailRow
              label={`Commission`}
              value={`-₹${breakdown?.commission || 0}`}
              weight="semiBold"
            />
          </ExpandableSection>

          <View style={styles.divider} />

          <ExpandableSection title="Handling Fees" amount={`-₹${breakdown?.gateway || 0}`}>
            <DetailRow label="Charges" value={`-₹${breakdown?.gateway || 0}`} weight="semiBold" />
          </ExpandableSection>

          <View style={styles.divider} />

          <View style={styles.finalPayoutRow}>
            <Text variant="body2" weight="bold">
              Final Payout
            </Text>
            <Text variant="body2" weight="bold" color={COLORS.success}>
              ₹{breakdown?.finalPayout || 0}
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Button
            title="Download"
            variant="primary"
            style={styles.downloadBtn}
            textStyle={styles.downloadBtnText}
            onPress={() => {}}
          />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  header: {
    marginTop: vs(10),
    marginBottom: vs(15),
  },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollContent: { paddingBottom: vs(20) },
  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: vs(10),
    marginBottom: vs(15),
  },
  detailsCard: {
    backgroundColor: COLORS.surface.primary,
    borderWidth: 1,
    borderColor: "#CBDFFE",
    borderRadius: ms(10),
    paddingVertical: vs(12),
    paddingHorizontal: hs(12),
  },
  sectionContainer: { marginBottom: vs(5) },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: vs(5),
  },
  headerTitleRow: { flexDirection: "row", alignItems: "center", gap: hs(6) },
  sectionContent: { marginTop: vs(8), gap: vs(8) },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  divider: {
    height: 1,
    backgroundColor: "#CBDFFE",
    marginVertical: vs(10),
  },
  finalPayoutRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: vs(5),
  },
  footer: {
    marginTop: vs(20),
    alignItems: "flex-end",
  },
  downloadBtn: {
    backgroundColor: "#000",
    borderRadius: ms(10),
    paddingHorizontal: hs(10),
    paddingVertical: vs(8),
    height: vs(34),
  },
  downloadBtnText: {
    fontSize: fs(12),
    color: "#FFF",
  },
});
