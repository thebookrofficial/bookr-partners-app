// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useEffect, useRef } from "react";
import { View, StyleSheet, TouchableOpacity, Image, Animated } from "react-native";
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
  status: "Online" | "Offline" | "Settlement";
  avatarUrl?: string;
  isOfflineRecord?: boolean;
  hideDateText?: boolean;
  useClockIcon?: boolean;
  isDisabled?: boolean; // NEW: Triggers the greyed-out state
  isPaymentPending?: boolean; // NEW: Triggers the red blinking text
  isHighlighted?: boolean;
  onPress?: () => void;
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
  hideDateText = false,
  useClockIcon = false,
  isDisabled = false,
  isPaymentPending = false,
  isHighlighted = false,
  onPress,
}: BookingCardProps) => {
  const textColor = isDisabled ? COLORS.text.secondary : COLORS.text.primary;
  const iconColor = COLORS.text.muted;
  const cardBg = isHighlighted ? "#E8F0FE" : isDisabled ? "#E0E0E0" : COLORS.surface.primary;

  const highlightStyle = isHighlighted
    ? {
        borderColor: COLORS.primary,
        borderWidth: 2,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      }
    : {};

  // Blinking Animation Logic
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isPaymentPending) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(fadeAnim, {
            toValue: 0.2,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      fadeAnim.setValue(1); // Reset to fully visible if not pending
    }
  }, [isPaymentPending, fadeAnim]);

  const getStatusColor = () => {
    if (isDisabled) return COLORS.text.muted; // Mute status color if past
    if (status === "Offline") return COLORS.danger;
    if (status === "Online") return COLORS.primary;
    return COLORS.text.muted;
  };

  const getPriceColor = () => {
    if (isDisabled && !isPaymentPending) return COLORS.text.muted;
    return "#00B562";
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[styles.cardContainer, { backgroundColor: cardBg }, highlightStyle]}>
      <View style={[styles.avatarContainer, isDisabled && styles.avatarDisabled]}>
        <Image
          source={avatarUrl ? { uri: avatarUrl } : require("@/assets/images/avatar_man.png")}
          style={styles.avatar}
        />
      </View>

      <View style={styles.rightContent}>
        <View style={styles.topRow}>
          <View style={styles.namePhoneWrapper}>
            <Text variant="body1" weight="bold" color={textColor} style={{ fontSize: fs(20) }}>
              {name}
            </Text>

            {phone ? (
              <View style={styles.phoneRow}>
                <Phone size={ms(18)} color={iconColor} fill={iconColor} />
                <Text
                  variant="body2"
                  weight="medium"
                  color={textColor}
                  style={{ fontSize: fs(16) }}>
                  {phone}
                </Text>
              </View>
            ) : subtitle ? (
              <View style={styles.phoneRow}>
                <Text
                  variant="body2"
                  weight="medium"
                  color={textColor}
                  style={{ fontSize: fs(16) }}>
                  {subtitle}
                </Text>
              </View>
            ) : null}
          </View>

          <View style={styles.priceStatusWrapper}>
            <View style={styles.priceRow}>
              {isPaymentPending && (
                <Animated.Text style={[styles.blinkingText, { opacity: fadeAnim }]}>
                  Payment Pending
                </Animated.Text>
              )}
              <Text
                variant="body2"
                weight="semiBold"
                color={getPriceColor()}
                style={{ fontSize: fs(16) }}>
                {price}
              </Text>
            </View>

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
            <Text
              variant="body2"
              weight="semiBold"
              color={textColor}
              style={[styles.dateText, { fontSize: fs(16) }]}>
              {date}
            </Text>
          )}

          <Text
            variant="body2"
            weight="semiBold"
            color={textColor}
            style={[
              styles.timeText,
              { fontSize: fs(16) },
              hideDateText && styles.timeTextExpanded,
            ]}>
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
    alignItems: "center",
    paddingVertical: vs(10),
    paddingHorizontal: hs(6),
    gap: hs(10),
    borderRadius: ms(10),
    marginBottom: vs(10),
    width: "100%",
    minHeight: vs(97),
  },
  avatarContainer: {
    justifyContent: "center",
  },
  avatarDisabled: {
    opacity: 0.6,
  },
  avatar: {
    width: ms(50),
    height: ms(50),
    borderRadius: ms(25),
    backgroundColor: "transparent",
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
    alignItems: "flex-end", // Align right to keep the pending text neat
    justifyContent: "center",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(6),
  },
  blinkingText: {
    color: COLORS.danger,
    fontSize: fs(10),
    fontFamily: "Gilroy-Bold", // Match your app's font
    textTransform: "uppercase",
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
  callButtonDisabled: {
    backgroundColor: "transparent",
    borderColor: COLORS.text.muted,
  },
  callText: {
    fontSize: fs(14),
    lineHeight: fs(14),
  },
});
