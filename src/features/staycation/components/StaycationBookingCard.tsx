// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React from "react";
import { View, StyleSheet, TouchableOpacity, Linking, Alert } from "react-native";
import { Text, Avatar } from "@/components/ui";
import { Phone, Calendar } from "lucide-react-native";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
import { StaycationBooking } from "../types/staycation.types";

interface StaycationBookingCardProps extends StaycationBooking {
  onPress?: () => void;
}

export const StaycationBookingCard = ({
  name,
  phone,
  avatarUrl,
  amount,
  status,
  checkIn,
  checkOut,
  guestCount,
  onPress,
}: StaycationBookingCardProps) => {
  const handleCall = () => {
    if (phone) {
      const cleanPhone = phone.replace(/[^\d+]/g, "");
      const url = `tel:${cleanPhone}`;
      Linking.openURL(url).catch(() => Alert.alert("Error", "Could not open dialer."));
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "Advance":
      case "Full":
      case "Complete":
        return "#63A1FD";
      case "Offline":
      case "Remaining":
        return "#E55959";
      default:
        return COLORS.text.muted;
    }
  };

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={styles.cardContainer}>
      <View style={styles.avatarWrapper}>
        <Avatar source={avatarUrl ? { uri: avatarUrl } : undefined} size={50} />
      </View>

      <View style={styles.mainContent}>
        {/* Top Header Section */}
        <View style={styles.topHeader}>
          <View style={styles.namePhoneContainer}>
            <Text variant="body1" weight="bold" color={COLORS.text.primary} style={styles.nameText}>
              {name}
            </Text>
            <TouchableOpacity onPress={handleCall} style={styles.phoneRow}>
              <Phone size={ms(18)} color={COLORS.text.primary} fill={COLORS.text.primary} />
              <Text
                variant="body2"
                weight="medium"
                color={COLORS.text.primary}
                style={styles.phoneText}>
                {phone}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.amountStatusWrapper}>
            <Text variant="body1" weight="semiBold" style={styles.amountText}>
              ₹{amount}
            </Text>
            <Text
              variant="body2"
              weight="semiBold"
              style={[styles.statusLabel, { color: getStatusColor() }]}>
              {status}
            </Text>
          </View>
        </View>

        {/* Details Row */}
        <View style={styles.detailsRow}>
          <View style={styles.iconLabelPair}>
            <Calendar size={ms(20)} color={COLORS.text.primary} />
            <Text variant="body2" weight="semiBold" color={COLORS.text.primary}>
              {checkIn} - {checkOut}
            </Text>
          </View>
          <View style={styles.guestAndCallRow}>
            <Text variant="body2" weight="semiBold" color={COLORS.text.primary}>
              {guestCount} Guest
            </Text>
            <TouchableOpacity style={styles.callButton} activeOpacity={0.7} onPress={handleCall}>
              <Text variant="body2" weight="bold" color={COLORS.text.inverse}>
                Call
              </Text>
            </TouchableOpacity>
          </View>
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
    paddingHorizontal: hs(6),
    paddingVertical: vs(10),
    marginBottom: vs(10),
    width: "100%",
  },
  avatarWrapper: {
    marginRight: hs(10),
    alignSelf: "flex-start",
  },
  mainContent: {
    flex: 1,
    gap: vs(10),
  },
  topHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  namePhoneContainer: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: "#CBDFFE",
    paddingBottom: vs(4),
    marginRight: hs(10),
  },
  nameText: {
    fontSize: fs(16),
    lineHeight: fs(16),
    marginBottom: vs(6),
  },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(6),
  },
  phoneText: {
    fontSize: fs(14),
  },
  amountStatusWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  amountText: {
    fontSize: fs(14),
    color: "#00B562",
    lineHeight: fs(14),
  },
  statusLabel: {
    fontSize: fs(10),
    lineHeight: fs(10),
    marginTop: vs(2),
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  iconLabelPair: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(8),
  },
  guestAndCallRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(10),
  },
  callButton: {
    backgroundColor: COLORS.text.primary,
    paddingHorizontal: hs(14),
    paddingVertical: vs(4),
    borderRadius: ms(6),
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.25)",
  },
});
