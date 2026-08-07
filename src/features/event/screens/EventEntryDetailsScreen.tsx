// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React from "react";
import { View, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, Phone, Ticket, CreditCard } from "lucide-react-native";
import { useNavigation, useRoute } from "@react-navigation/native";

import { Text } from "@/components/ui/Text";
import { Avatar } from "@/components/ui/Avatar";
import { COLORS } from "@/constants/theme";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { useEventEntryDetails } from "../hooks/useEventEntryDetails";
import { MainScreenProps } from "@/navigation/navigation.types";

const USER_PROFILE = require("../../../assets/icons/ic-user-profile.png");

/**
 * EventEntryDetailsScreen
 * Displays detailed information about an event entry, including user details and payment info.
 */
export const EventEntryDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<MainScreenProps<"EventEntryDetails">["route"]>();
  const bookingId = route.params.entryId;

  // console.log("DEBUG - Received Params:", route.params); // Look for 'entryId' here in your terminal
  const { data, loading, error } = useEventEntryDetails(bookingId);

  const handleBack = () => {
    navigation.goBack();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  if (error || !data) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text color={COLORS.danger}>Failed to load entry details.</Text>
        <TouchableOpacity onPress={handleBack} style={{ marginTop: vs(20) }}>
          <Text weight="bold" color={COLORS.primary}>
            Go Back
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <ChevronLeft size={ms(24)} color={COLORS.text.primary} strokeWidth={2.5} />
          </TouchableOpacity>
          <View style={styles.userInfo}>
            <Avatar source={data.avatarUrl ? { uri: data.avatarUrl } : USER_PROFILE} size={50} />
            <Text variant="h3" family="gilroy" weight="bold" style={styles.userName}>
              {data.name}
            </Text>
          </View>
        </View>

        {/* Entry Details Section */}
        <View style={styles.section}>
          <Text variant="body1" family="gilroy" weight="bold" style={styles.sectionTitle}>
            ENTRY DETAILS
          </Text>

          {/* Mobile No */}
          <View style={styles.detailItem}>
            <View style={styles.labelRow}>
              <Phone size={ms(18)} color={COLORS.text.primary} />
              <Text variant="body1" family="gilroy" weight="medium" style={styles.label}>
                Mobile No
              </Text>
            </View>
            <View style={styles.valueContainer}>
              <Text variant="body1" family="gilroy" weight="semiBold">
                {data.phone}
              </Text>
            </View>
          </View>

          {/* Pass Type */}
          <View style={styles.detailItem}>
            <View style={styles.labelRow}>
              <Ticket size={ms(18)} color={COLORS.text.primary} />
              <Text variant="body1" family="gilroy" weight="bold" style={styles.label}>
                Pass Type
              </Text>
            </View>
            <View style={styles.valueContainer}>
              <Text variant="body1" family="gilroy" weight="bold" color={COLORS.primary}>
                {data.passType}
              </Text>
            </View>
          </View>

          {/* Date and Time Row */}
          <View style={styles.row}>
            <View style={[styles.detailItem, styles.halfWidth, styles.marginRight]}>
              <Text variant="body1" family="gilroy" weight="medium" style={styles.labelOnly}>
                Date Of Entry
              </Text>
              <View style={styles.valueContainer}>
                <Text variant="body1" family="gilroy" weight="semiBold">
                  {data.entryDate}
                </Text>
              </View>
            </View>
            <View style={[styles.detailItem, styles.halfWidth, styles.marginLeft]}>
              <Text variant="body1" family="gilroy" weight="medium" style={styles.labelOnly}>
                Entry Time
              </Text>
              <View style={styles.valueContainer}>
                <Text variant="body1" family="gilroy" weight="semiBold">
                  {data.entryTime}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Payment Details Section */}
        <View style={styles.paymentSection}>
          <View style={styles.paymentHeader}>
            <CreditCard size={ms(20)} color={COLORS.text.primary} />
            <Text variant="body1" family="gilroy" weight="bold" style={styles.paymentTitle}>
              PAYMENT DETAILS
            </Text>
          </View>

          <View style={styles.paymentRow}>
            <Text variant="body1" family="gilroy" weight="semiBold">
              Method
            </Text>
            <Text variant="body1" family="gilroy" weight="medium">
              {data.paymentMethod}
            </Text>
          </View>

          <View style={styles.paymentRow}>
            <Text variant="body1" family="gilroy" weight="semiBold">
              Transaction Date
            </Text>
            <Text variant="body1" family="gilroy" weight="medium">
              {data.transactionDate}
            </Text>
          </View>

          <View style={styles.paymentRow}>
            <Text variant="body1" family="gilroy" weight="semiBold">
              Transaction Time
            </Text>
            <Text variant="body1" family="gilroy" weight="medium">
              {data.transactionTime}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centerContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: { paddingHorizontal: hs(16), paddingTop: vs(20), paddingBottom: vs(40) },
  header: { flexDirection: "row", alignItems: "center", marginBottom: vs(24) },
  backButton: { marginRight: hs(8) },
  userInfo: { flexDirection: "row", alignItems: "center", flex: 1 },
  userName: { marginLeft: hs(12), fontSize: fs(22) },
  section: { marginBottom: vs(24) },
  sectionTitle: { marginBottom: vs(16), textTransform: "uppercase" },
  detailItem: { marginBottom: vs(16) },
  labelRow: { flexDirection: "row", alignItems: "center", marginBottom: vs(6) },
  label: { marginLeft: hs(8) },
  labelOnly: { marginBottom: vs(6) },
  valueContainer: {
    backgroundColor: COLORS.surface.primary,
    borderRadius: ms(10),
    paddingVertical: vs(12),
    paddingHorizontal: hs(12),
    justifyContent: "center",
  },
  row: { flexDirection: "row", alignItems: "center" },
  halfWidth: { flex: 1 },
  marginRight: { marginRight: hs(10) },
  marginLeft: { marginLeft: hs(10) },
  paymentSection: { marginTop: vs(8) },
  paymentHeader: { flexDirection: "row", alignItems: "center", marginBottom: vs(12) },
  paymentTitle: { marginLeft: hs(8), textTransform: "uppercase" },
  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: vs(6),
  },
});
