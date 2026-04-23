// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState } from "react";
import { View, StyleSheet, ActivityIndicator, SectionList, TouchableOpacity } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MainStackParamList, DineTabParamList } from "@/navigation/navigation.types";
import { Search, ChevronRight, SlidersHorizontal } from "lucide-react-native";
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { Text, TextInput } from "@/components/ui";
import { ServiceHeader } from "@/features/sports/components/ServiceHeader";
import { DinePaymentCard } from "../components/DinePaymentCard";
import { DineFilterBottomSheet } from "../components/DineFilterBottomSheet";
import { useDineHistory } from "../hooks/useDineHistory";
import { COLORS } from "@/constants/theme";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";

const USER_PROFILE = require("../../../assets/icons/ic-user-profile.png");

export const DineHistoryScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const route = useRoute<RouteProp<DineTabParamList, "DineHistory">>();
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  // Safely resolve serviceId from params or parent navigator
  let serviceId = route.params?.serviceId;
  if (!serviceId) {
    const parentState = (navigation as any).getParent()?.getState();
    const tabRoute = parentState?.routes.find((r: any) => r.name === "DineServiceTabs");
    const tabParams = tabRoute?.params as any;
    serviceId = tabParams?.serviceId || tabParams?.params?.serviceId || "";
  }

  const {
    loading,
    searchQuery,
    setSearchQuery,
    filter,
    setFilter,
    customRange,
    setCustomRange,
    historyGroups,
  } = useDineHistory(serviceId);

  const handleCardPress = (paymentId: string) => {
    navigation.navigate("DinePaymentDetails", {
      bookingId: paymentId,
    });
  };

  const renderSectionHeader = ({ section }: { section: any }) => (
    <View style={styles.sectionHeader}>
      <View style={styles.dateGroup}>
        <Text variant="body2" weight="semiBold" style={styles.dateText}>
          {section.date}
        </Text>
        <ChevronRight size={ms(16)} color={COLORS.text.primary} style={styles.chevron} />
      </View>
      <View style={styles.settlementGroup}>
        <Text variant="body2" weight="semiBold" style={styles.settlementAmount}>
          {section.settlement}
        </Text>
        <Text variant="body2" style={styles.settlementLabel}>
          Settlement
        </Text>
      </View>
    </View>
  );

  return (
    <ScreenContainer scrollable={false} paddingHorizontal={hs(12)}>
      <ServiceHeader title="Hotel tikka lab" imageSource={USER_PROFILE} />

      <View style={styles.searchRow}>
        <View style={styles.searchWrapper}>
          <TextInput
            placeholder="Search for mobile number , Date , Name"
            value={searchQuery}
            onChangeText={setSearchQuery}
            leftIcon={<Search size={ms(20)} color={COLORS.text.secondary} />}
            variant="filled"
          />
        </View>
        <TouchableOpacity
          style={styles.filterBtn}
          activeOpacity={0.7}
          onPress={() => setIsFilterSheetOpen(true)}>
          <SlidersHorizontal size={ms(20)} color={COLORS.text.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <SectionList
          showsVerticalScrollIndicator={false}
          sections={historyGroups}
          keyExtractor={item => item.id}
          renderSectionHeader={renderSectionHeader}
          renderItem={({ item }) => (
            <DinePaymentCard {...item} onPress={() => handleCardPress(item.id)} />
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text variant="body1" color={COLORS.text.secondary} style={styles.emptyText}>
              No history found.
            </Text>
          }
        />
      )}

      <DineFilterBottomSheet
        visible={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        currentFilter={filter}
        currentCustomRange={customRange}
        onApply={(newFilter, range) => {
          setFilter(newFilter);
          setCustomRange(range);
        }}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(10),
    marginVertical: vs(12),
  },
  searchWrapper: {
    flex: 1,
  },
  filterBtn: {
    width: ms(48),
    height: ms(48),
    backgroundColor: COLORS.surface.primary,
    borderRadius: ms(10),
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border.navBar,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: vs(10),
    paddingHorizontal: hs(6),
    marginBottom: vs(6),
    backgroundColor: COLORS.background,
  },
  dateGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateText: {
    fontSize: ms(14),
    textTransform: "capitalize",
  },
  chevron: {
    marginLeft: hs(6),
    transform: [{ rotate: "90deg" }],
  },
  settlementGroup: {
    alignItems: "center",
  },
  settlementAmount: {
    fontSize: ms(14),
    color: "#00B562",
    lineHeight: ms(14),
  },
  settlementLabel: {
    fontSize: fs(10),
    color: COLORS.text.muted,
  },
  listContent: {
    paddingBottom: vs(120),
  },
  emptyText: {
    textAlign: "center",
    marginTop: vs(40),
  },
});
