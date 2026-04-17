// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React from "react";
import { View, StyleSheet, TouchableOpacity, Image } from "react-native";
import { Text } from "@/components/ui";
import { Phone, Calendar, Clock } from "lucide-react-native";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";

interface BookingCardProps {
  name: string;
  phone?: string;
  subtitle?: string;
  date: string;
  time: string;
  price: string;
  status: "Online" | "Offline" | "Advance" | "Settlement" | "Full";
  avatarUrl?: string;
  isOfflineRecord?: boolean;
  hideCallButton?: boolean;
  hideDateText?: boolean;
  useClockIcon?: boolean;
  onPress?: () => void;
  onCallPress?: () => void;
}

export const BookingCard = ({
  name,
  phone,
  subtitle,
  date,
  time,
  price,
  status,
  avatarUrl,
  isOfflineRecord = false,
  hideCallButton = false,
  hideDateText = false,
  useClockIcon = false,
  onPress,
  onCallPress,
}: BookingCardProps) => {
  const textColor = isOfflineRecord ? COLORS.text.muted : COLORS.text.primary;
  const iconColor = isOfflineRecord ? COLORS.text.muted : COLORS.text.primary;
  const cardBg = isOfflineRecord ? "#E0E0E0" : COLORS.surface.primary;

  const getStatusColor = () => {
    if (status === "Offline") return COLORS.danger;
    if (status === "Online") return COLORS.primary;
    return COLORS.text.muted;
  };

  const getPriceColor = () => {
    if (isOfflineRecord && status === "Offline") return COLORS.danger;
    return "#00B562";
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[styles.cardContainer, { backgroundColor: cardBg }]}>
      <Image source={{ uri: avatarUrl || "https://placeholder.com/50" }} style={styles.avatar} />

      <View style={styles.rightContent}>
        <View style={styles.topRow}>
          <View style={styles.namePhoneWrapper}>
            <Text variant="body1" weight="bold" color={textColor}>
              {name}
            </Text>

            {phone ? (
              <View style={styles.phoneRow}>
                <Phone size={ms(18)} color={iconColor} fill={iconColor} />
                <Text variant="body2" weight="medium" color={textColor}>
                  {phone}
                </Text>
              </View>
            ) : subtitle ? (
              <View style={styles.phoneRow}>
                <Text variant="body2" weight="medium" color={textColor}>
                  {subtitle}
                </Text>
              </View>
            ) : null}
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

        <View style={styles.bottomRow}>
          {useClockIcon ? (
            <Clock size={ms(16)} color={iconColor} />
          ) : (
            <Calendar size={ms(20)} color={iconColor} />
          )}

          {!hideDateText && (
            <Text variant="body2" weight="semiBold" color={textColor} style={styles.dateText}>
              {date}
            </Text>
          )}

          <Text
            variant="body2"
            weight="semiBold"
            color={textColor}
            /* FIXED: Using predefined style instead of inline object */
            style={[styles.timeText, hideDateText && styles.timeTextExpanded]}>
            {time}
          </Text>

          {!hideCallButton && (
            <TouchableOpacity style={styles.callButton} onPress={onCallPress} activeOpacity={0.7}>
              <Text
                variant="caption"
                weight="bold"
                color={COLORS.text.inverse}
                style={styles.callText}>
                Call
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: vs(10),
    paddingHorizontal: hs(6),
    gap: hs(10),
    borderRadius: ms(10),
    marginBottom: vs(10),
    width: "100%",
    minHeight: vs(97),
  },
  avatar: {
    width: ms(50),
    height: ms(50),
    borderRadius: ms(25),
    backgroundColor: COLORS.danger,
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
    borderBottomColor: "#CBDFFE",
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
    flex: 1,
  },
  timeText: {
    marginRight: hs(6),
  },
  timeTextExpanded: {
    flex: 1,
    marginLeft: hs(4),
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
