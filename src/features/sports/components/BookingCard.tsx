// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React from "react";
import { View, StyleSheet, TouchableOpacity, Image } from "react-native";
import { Text } from "@/components/ui";
import { Phone, Calendar } from "lucide-react-native";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";

interface BookingCardProps {
  name: string;
  phone: string;
  date: string;
  time: string;
  price: string;
  status: "Online" | "Offline" | "Advance" | "Settlement" | "Full";
  avatarUrl?: string;
  isOfflineRecord?: boolean; // Controls the greyed-out UI
  onCallPress?: () => void;
}

export const BookingCard = ({
  name,
  phone,
  date,
  time,
  price,
  status,
  avatarUrl,
  isOfflineRecord = false,
  onCallPress,
}: BookingCardProps) => {
  // Figma colors based on active vs offline state
  const textColor = isOfflineRecord ? COLORS.text.muted : COLORS.text.primary;
  const iconColor = isOfflineRecord ? COLORS.text.muted : COLORS.text.primary;
  const cardBg = isOfflineRecord ? "#E0E0E0" : COLORS.surface.primary;

  const getStatusColor = () => {
    if (status === "Offline") return COLORS.danger;
    if (status === "Online") return COLORS.primary;
    return COLORS.text.muted; // Advance, Full, Settlement
  };

  const getPriceColor = () => {
    // Figma shows green price even for some offline records, matching CSS precisely
    if (isOfflineRecord && status === "Offline") return COLORS.danger;
    return "#00B562";
  };

  return (
    <View style={[styles.cardContainer, { backgroundColor: cardBg }]}>
      <Image source={{ uri: avatarUrl || "https://placeholder.com/50" }} style={styles.avatar} />

      <View style={styles.rightContent}>
        {/* Top Row: Name, Phone, Price & Status */}
        <View style={styles.topRow}>
          <View style={styles.namePhoneWrapper}>
            <Text variant="body1" weight="bold" color={textColor}>
              {name}
            </Text>
            <View style={styles.phoneRow}>
              <Phone size={ms(18)} color={iconColor} fill={iconColor} />
              <Text variant="body2" weight="medium" color={textColor}>
                {phone}
              </Text>
            </View>
          </View>

          <View style={styles.priceStatusWrapper}>
            <Text variant="body2" weight="semiBold" color={getPriceColor()}>
              {price}
            </Text>
            <Text
              variant="caption"
              weight="semiBold"
              color={getStatusColor()}
              style={styles.statusText}>
              {status}
            </Text>
          </View>
        </View>

        {/* Bottom Row: Date, Time & Call Action */}
        <View style={styles.bottomRow}>
          <Calendar size={ms(20)} color={iconColor} />
          <Text variant="body2" weight="semiBold" color={textColor} style={styles.dateText}>
            {date}
          </Text>
          <Text variant="body2" weight="semiBold" color={textColor} style={styles.timeText}>
            {time}
          </Text>
          <TouchableOpacity style={styles.callButton} onPress={onCallPress} activeOpacity={0.7}>
            <Text
              variant="caption"
              weight="bold"
              color={COLORS.text.inverse}
              style={styles.callText}>
              Call
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: vs(10),
    paddingHorizontal: hs(6), // Exact Figma padding
    gap: hs(10),
    borderRadius: ms(10),
    marginBottom: vs(10),
    width: "100%",
    minHeight: vs(97), // Exact Figma height
  },
  avatar: {
    width: ms(50),
    height: ms(50),
    borderRadius: ms(25),
    backgroundColor: COLORS.danger, // Figma default red
  },
  rightContent: {
    flex: 1,
    flexDirection: "column",
    gap: vs(10),
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  namePhoneWrapper: {
    flex: 1,
    flexDirection: "column",
    alignItems: "flex-start",
    paddingBottom: vs(4),
    borderBottomWidth: 1,
    borderBottomColor: "#CBDFFE", // Line only sits under the name/phone
    marginRight: hs(10),
  },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(6),
    marginTop: vs(2),
  },
  priceStatusWrapper: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  statusText: {
    fontSize: fs(10),
    lineHeight: fs(12),
    marginTop: vs(2),
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(8),
    width: "100%",
  },
  dateText: {
    flex: 1, // Pushes time and call button to the right seamlessly
  },
  timeText: {
    marginRight: hs(6),
  },
  callButton: {
    backgroundColor: "#000000",
    paddingHorizontal: hs(14),
    paddingVertical: vs(4),
    borderRadius: ms(6),
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  callText: {
    fontSize: fs(14),
    lineHeight: fs(14),
  },
});
