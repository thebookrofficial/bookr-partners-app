// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useEffect, useRef } from "react";
import { View, StyleSheet, TouchableOpacity, Image, Animated } from "react-native";
import { Text } from "@/components/ui";
import { Clock } from "lucide-react-native";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
import PersonSvg from "@/assets/icons/ic-round-person.svg";
import CalendarSvg from "@/assets/icons/ic-solar-calendar-outline.svg";

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

  // Blinking Animation Logic for pending
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
      fadeAnim.setValue(1);
    }
  }, [isPaymentPending, fadeAnim]);

  const getStatusColor = () => {
    if (isDisabled) return COLORS.text.muted;
    if (status === "Offline") return "#E55959";
    if (status === "Online") return "#63A1FD";
    return COLORS.text.muted;
  };

  const getStatusBgColor = () => {
    if (isDisabled) return "#F3F4F6";
    if (status === "Offline") return "#FDE8E8";
    if (status === "Online") return "#E8F0FE";
    return "#F3F4F6";
  };

  const getPriceColor = () => {
    if (isDisabled && !isPaymentPending) return COLORS.text.muted;
    return "#00B562";
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        styles.cardContainer,
        { backgroundColor: cardBg },
        highlightStyle,
        isDisabled && styles.cardDisabled,
      ]}>
      {/* Top Section */}
      <View style={styles.topSection}>
        <View style={[styles.avatarWrapper, isDisabled && styles.avatarDisabled]}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
          ) : (
            <View
              style={{
                backgroundColor: "#E6F0FF",
                width: "100%",
                height: "100%",
                borderRadius: ms(20),
                justifyContent: "center",
                alignItems: "center",
              }}>
              <PersonSvg width={ms(20)} height={ms(20)} color="#63A1FD" />
            </View>
          )}
        </View>

        <View style={styles.infoWrapper}>
          <Text weight="bold" style={[styles.nameText, { color: textColor }]}>
            {name}
          </Text>
          {phone ? (
            <Text weight="medium" style={styles.phoneText}>
              {phone}
            </Text>
          ) : subtitle ? (
            <Text weight="medium" style={styles.phoneText}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        {isPaymentPending && (
          <Animated.View style={[styles.paymentBadge, { opacity: fadeAnim }]}>
            <Text weight="semiBold" style={styles.paymentBadgeText}>
              Payment Pending
            </Text>
          </Animated.View>
        )}

        <View style={styles.amountStatusWrapper}>
          <Text weight="bold" style={[styles.amountText, { color: getPriceColor() }]}>
            {price}
          </Text>
          <View style={[styles.statusLabelContainer, { backgroundColor: getStatusBgColor() }]}>
            <Text weight="semiBold" style={[styles.statusLabel, { color: getStatusColor() }]}>
              {status}
            </Text>
          </View>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Bottom Section */}
      <View style={styles.bottomSection}>
        <View style={styles.dateContainer}>
          <View style={styles.calendarIconWrapper}>
            {useClockIcon ? (
              <Clock size={ms(18)} color="#63A1FD" />
            ) : (
              <CalendarSvg width={ms(18)} height={ms(18)} color="#63A1FD" />
            )}
          </View>
          {!hideDateText && (
            <Text weight="semiBold" style={[styles.dateText, { color: textColor }]}>
              {date}
            </Text>
          )}
        </View>

        <View style={styles.timeWrapper}>
          <Text weight="semiBold" style={[styles.timeText, { color: textColor }]}>
            {time}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: "#F4F7FC",
    borderRadius: ms(12),
    paddingHorizontal: hs(12),
    paddingVertical: vs(12),
    marginBottom: vs(12),
    width: "100%",
  },
  cardDisabled: {
    opacity: 0.6,
  },
  topSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarWrapper: {
    width: ms(44),
    height: ms(44),
    borderRadius: ms(8),
    backgroundColor: "#E8F0FE",
    alignItems: "center",
    justifyContent: "center",
    marginRight: hs(10),
  },
  avatarDisabled: {
    opacity: 0.6,
  },
  avatarImage: {
    width: ms(44),
    height: ms(44),
    borderRadius: ms(8),
  },
  infoWrapper: {
    flex: 1,
    justifyContent: "center",
  },
  nameText: {
    fontSize: fs(18),
    marginBottom: vs(2),
  },
  phoneText: {
    fontSize: fs(16),
    color: "#000000",
  },
  paymentBadge: {
    backgroundColor: "#FEE2E2",
    borderRadius: ms(12),
    paddingHorizontal: hs(8),
    paddingVertical: vs(4),
    marginHorizontal: hs(6),
  },
  paymentBadgeText: {
    color: "#EF4444",
    fontSize: fs(12),
  },
  amountStatusWrapper: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  amountText: {
    fontSize: fs(18),
  },
  statusLabelContainer: {
    borderRadius: ms(12),
    paddingHorizontal: hs(8),
    paddingVertical: vs(2),
    marginTop: vs(4),
  },
  statusLabel: {
    fontSize: fs(12),
    textTransform: "capitalize",
  },
  divider: {
    height: 1,
    backgroundColor: "#CBDFFE",
    marginVertical: vs(10),
  },
  bottomSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  calendarIconWrapper: {
    width: ms(32),
    height: ms(32),
    borderRadius: ms(6),
    // backgroundColor: "#E8F0FE",
    alignItems: "center",
    justifyContent: "center",
    marginRight: hs(8),
  },
  dateText: {
    fontSize: fs(16),
  },
  timeWrapper: {
    justifyContent: "center",
  },
  timeText: {
    fontSize: fs(16),
  },
});
