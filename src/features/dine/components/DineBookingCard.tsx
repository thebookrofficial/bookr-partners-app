// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React from "react";
import { View, StyleSheet, TouchableOpacity, Linking, Alert } from "react-native";
import { Text, Avatar } from "@/components/ui";
import { Phone, Calendar, Users } from "lucide-react-native";
import { hs, vs, ms } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";

interface DineBookingCardProps {
  name: string;
  phone: string;
  date: string;
  time: string;
  guestCount: string;
  occasion?: string;
  status: "Online" | "Offline";
  avatarUrl?: string;
  onPress?: () => void;
}

export const DineBookingCard = ({
  name,
  phone,
  date,
  time,
  guestCount,
  occasion,
  status,
  avatarUrl,
  onPress,
}: DineBookingCardProps) => {
  const handleCall = () => {
    if (phone) {
      const cleanPhone = phone.replace(/[^\d+]/g, "");
      const url = `tel:${cleanPhone}`;
      Linking.openURL(url).catch(() => Alert.alert("Error", "Could not open dialer."));
    }
  };

  const statusColor = status === "Online" ? "#00B562" : "#E55959";

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
            <View style={styles.phoneRow}>
              <Phone size={ms(18)} color={COLORS.text.secondary} fill={COLORS.text.secondary} />
              <Text
                variant="body2"
                weight="medium"
                color={COLORS.text.primary}
                style={styles.phoneText}>
                {phone}
              </Text>
            </View>
          </View>

          <View style={styles.statusActionWrapper}>
            <Text
              variant="body2"
              weight="semiBold"
              style={[styles.statusLabel, { color: statusColor }]}>
              {status}
            </Text>
            <TouchableOpacity style={styles.callButton} onPress={handleCall} activeOpacity={0.7}>
              <Text variant="body2" weight="bold" color={COLORS.text.inverse}>
                Call
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Date and Time Row */}
        <View style={styles.detailsRow}>
          <View style={styles.iconLabelPair}>
            <Calendar size={ms(20)} color={COLORS.text.secondary} />
            <Text variant="body2" weight="semiBold" color={COLORS.text.primary}>
              {date}
            </Text>
          </View>
          <Text variant="body2" weight="semiBold" color={COLORS.text.primary}>
            {time}
          </Text>
        </View>

        {/* Guest and Occasion Row */}
        <View style={styles.detailsRow}>
          <View style={styles.iconLabelPair}>
            <Users size={ms(20)} color={COLORS.text.secondary} fill={COLORS.text.secondary} />
            <Text variant="body2" weight="semiBold" color={COLORS.text.primary}>
              {guestCount}
            </Text>
          </View>
          <Text
            variant="body2"
            weight="semiBold"
            color={occasion ? COLORS.text.primary : COLORS.text.muted}>
            {occasion || "-"}
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
    marginBottom: vs(12),
    width: "100%",
    minHeight: vs(100),
  },
  avatarWrapper: {
    marginRight: hs(12),
    paddingTop: vs(2),
    alignSelf: "center",
  },
  avatar: {
    width: ms(50),
    height: ms(50),
    borderRadius: ms(25),
    backgroundColor: COLORS.surface.secondary,
  },
  mainContent: {
    flex: 1,
    gap: vs(10),
  },
  topHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  namePhoneContainer: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: "#CBDFFE",
    paddingBottom: vs(6),
    marginRight: hs(12),
  },
  nameText: {
    fontSize: ms(16),
    lineHeight: ms(16),
    marginBottom: vs(4),
  },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(6),
  },
  phoneText: {
    fontSize: ms(14),
  },
  statusActionWrapper: {
    alignItems: "flex-end",
    gap: vs(6),
  },
  statusLabel: {
    fontSize: ms(14),
    lineHeight: ms(14),
  },
  callButton: {
    backgroundColor: COLORS.text.primary,
    paddingHorizontal: hs(16),
    paddingVertical: vs(5),
    borderRadius: ms(6),
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.15)",
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  iconLabelPair: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(10),
  },
});
