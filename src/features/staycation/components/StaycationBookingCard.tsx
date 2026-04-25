// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React from "react";
import { View, StyleSheet, TouchableOpacity, Linking, Alert } from "react-native";
import { Text, Avatar } from "@/components/ui";
import { Phone, Calendar } from "lucide-react-native";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
import { StaycationBooking } from "../types/staycation.types";
import { useNavigation } from "@react-navigation/native";

interface StaycationBookingCardProps extends StaycationBooking {
  onPress?: () => void;
}

export const StaycationBookingCard = ({
  id,
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
  const navigation = useNavigation<any>();

  const handleCall = () => {
    if (phone) {
      const cleanPhone = phone.replace(/[^\d+]/g, "");
      const url = `tel:${cleanPhone}`;
      Linking.openURL(url).catch(() => Alert.alert("Error", "Could not open dialer."));
    }
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      navigation.navigate("StaycationBookingDetails", { bookingId: id });
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "Online":
      case "Full":
      case "Complete":
      case "Advance":
        return "#63A1FD";
      case "Offline":
      case "Remaining":
        return "#E55959";
      default:
        return COLORS.text.muted;
    }
  };

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={handlePress} style={styles.cardContainer}>
      <View style={styles.avatarWrapper}>
        <Avatar source={avatarUrl ? { uri: avatarUrl } : undefined} size={50} />
      </View>

      <View style={styles.mainContent}>
        {/* Top Section: Name, Phone, Amount, Status */}
        <View style={styles.topHeader}>
          <View style={styles.namePhoneContainer}>
            <Text weight="bold" style={styles.nameText}>
              {name}
            </Text>
            <View style={styles.phoneRow}>
              <Phone size={ms(20)} color={COLORS.text.primary} fill={COLORS.text.primary} />
              <Text weight="medium" style={styles.phoneText}>
                {phone}
              </Text>
            </View>
          </View>

          <View style={styles.amountStatusWrapper}>
            <Text weight="semiBold" style={styles.amountText}>
              ₹{amount}
            </Text>
            <Text weight="semiBold" style={[styles.statusLabel, { color: getStatusColor() }]}>
              {status}
            </Text>
          </View>
        </View>

        {/* Bottom Section: Date, Guests, Call */}
        <View style={styles.detailsRow}>
          <View style={styles.dateContainer}>
            <Calendar size={ms(20)} color={COLORS.text.primary} />
            <Text weight="semiBold" style={styles.dateText}>
              {checkIn} - {checkOut}
            </Text>
          </View>

          <View style={styles.guestWrapper}>
            <Text weight="semiBold" style={styles.guestText}>
              {guestCount} Guest
            </Text>
          </View>

          <TouchableOpacity style={styles.callButton} activeOpacity={0.7} onPress={handleCall}>
            <Text weight="bold" style={styles.callButtonText}>
              Call
            </Text>
          </TouchableOpacity>
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
    alignItems: "center",
    gap: hs(10),
  },
  avatarWrapper: {
    // No specific margin needed due to parent gap
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
    paddingBottom: vs(4),
    marginRight: hs(10),
    gap: vs(6),
  },
  nameText: {
    fontSize: fs(16),
    fontFamily: "Gilroy-Bold",
    color: COLORS.text.primary,
    lineHeight: fs(16 * 0.93),
  },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(6),
  },
  phoneText: {
    fontSize: fs(14),
    fontFamily: "Gilroy-Medium",
    color: COLORS.text.primary,
  },
  amountStatusWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  amountText: {
    fontSize: fs(14),
    fontFamily: "Gilroy-SemiBold",
    color: "#00B562",
    lineHeight: fs(14),
  },
  statusLabel: {
    fontSize: fs(10),
    fontFamily: "Gilroy-SemiBold",
    lineHeight: fs(10),
  },
  detailsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(8),
  },
  dateContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: hs(8),
  },
  dateText: {
    fontSize: fs(14),
    fontFamily: "Gilroy-SemiBold",
    color: COLORS.text.primary,
  },
  guestWrapper: {
    justifyContent: "flex-end",
  },
  guestText: {
    fontSize: fs(14),
    fontFamily: "Gilroy-SemiBold",
    color: COLORS.text.primary,
  },
  callButton: {
    backgroundColor: "black",
    paddingHorizontal: hs(14),
    paddingVertical: vs(4),
    borderRadius: ms(6),
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.25)",
  },
  callButtonText: {
    fontSize: fs(14),
    fontFamily: "Gilroy-Bold",
    color: "white",
    textAlign: "center",
  },
});
