// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text, Avatar } from "@/components/ui";
import { Phone } from "lucide-react-native";
import { hs, vs, ms } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";

interface DinePaymentCardProps {
  name: string;
  phone: string;
  amount: string;
  type: string;
  typeColor: string;
  amountColor: string;
  time: string;
  avatarUrl?: string;
  onPress?: () => void;
}

export const DinePaymentCard = ({
  name,
  phone,
  amount,
  type,
  typeColor,
  amountColor,
  time,
  avatarUrl,
  onPress,
}: DinePaymentCardProps) => {
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={styles.cardContainer}>
      <View style={styles.avatarWrapper}>
        <Avatar source={avatarUrl ? { uri: avatarUrl } : undefined} size={50} />
      </View>

      <View style={styles.mainContent}>
        {/* Top Section: Name, Phone and Amount */}
        <View style={styles.topRow}>
          <View style={styles.namePhoneContainer}>
            <Text variant="body1" weight="bold" color={COLORS.text.primary} style={styles.nameText}>
              {name}
            </Text>
            <View style={styles.phoneRow}>
              <Phone size={ms(16)} color={COLORS.text.primary} />
              <Text
                variant="body2"
                weight="medium"
                color={COLORS.text.primary}
                style={styles.phoneText}>
                {phone}
              </Text>
            </View>
          </View>

          <View style={styles.amountContainer}>
            <Text
              variant="body2"
              weight="semiBold"
              style={[styles.amountText, { color: amountColor }]}>
              {amount}
            </Text>
          </View>
        </View>

        {/* Bottom Section: Payment Type and Time */}
        <View style={styles.bottomRow}>
          <View style={styles.typeContainer}>
            <Text variant="body2" weight="semiBold" style={[styles.typeText, { color: typeColor }]}>
              {type}
            </Text>
          </View>
          <Text
            variant="body2"
            weight="semiBold"
            color={COLORS.text.primary}
            style={styles.timeText}>
            {time}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    flexDirection: "row",
    backgroundColor: "#F4F7FC",
    borderRadius: ms(10),
    padding: ms(10),
    marginBottom: vs(10),
    width: "100%",
    alignItems: "center",
  },
  avatarWrapper: {
    marginRight: hs(10),
  },
  mainContent: {
    flex: 1,
    gap: vs(10),
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  namePhoneContainer: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: "#CBDFFE",
    paddingBottom: vs(4),
    marginRight: hs(10),
    gap: vs(6),
  },
  nameText: {
    fontSize: ms(16),
    lineHeight: ms(15),
  },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(6),
  },
  phoneText: {
    fontSize: ms(14),
  },
  amountContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  amountText: {
    fontSize: ms(14),
    lineHeight: ms(14),
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  typeContainer: {
    flex: 1,
  },
  typeText: {
    fontSize: ms(14),
  },
  timeText: {
    fontSize: ms(14),
  },
});
