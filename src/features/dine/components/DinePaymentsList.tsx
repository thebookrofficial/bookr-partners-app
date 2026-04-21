// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "@/components/ui";
import { hs, vs, ms } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
import { DinePaymentCard } from "./DinePaymentCard";

interface DinePaymentsListProps {
  payments: any[];
}

export const DinePaymentsList = ({ payments }: DinePaymentsListProps) => {
  return (
    <View style={styles.container}>
      {payments.map((section, sectionIndex) => (
        <View key={`section-${sectionIndex}`} style={styles.sectionContainer}>
          <Text
            variant="body2"
            weight="semiBold"
            color={COLORS.text.primary}
            style={styles.dateHeader}>
            {section.date}
          </Text>
          <View style={styles.listContainer}>
            {section.data.map((payment: any) => (
              <DinePaymentCard key={payment.id} {...payment} />
            ))}
          </View>
        </View>
      ))}
      {payments.length === 0 && (
        <Text variant="body2" color={COLORS.text.secondary} style={styles.emptyText}>
          No payments found.
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  sectionContainer: {
    marginBottom: vs(20),
  },
  dateHeader: {
    fontSize: ms(14),
    marginBottom: vs(12),
    paddingHorizontal: hs(6),
  },
  listContainer: {
    width: "100%",
    paddingHorizontal: hs(6),
  },
  emptyText: {
    textAlign: "center",
    marginTop: vs(30),
  },
});
