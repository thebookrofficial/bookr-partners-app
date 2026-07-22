// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useMemo } from "react";
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Image } from "react-native";
import { Text } from "@/components/ui";
import PersonSvg from "@/assets/icons/ic-round-person.svg";
import CalendarSvg from "@/assets/icons/ic-solar-calendar-outline.svg";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
import { StaycationBooking } from "../types/staycation.types";
import { useNavigation } from "@react-navigation/native";
import { useStaycationBooking } from "../hooks/useStaycationBooking";

interface StaycationBookingCardProps extends Partial<StaycationBooking> {
  bookingId?: string;
  onPress?: () => void;
  onCancelPress?: (id: string) => void;
  isFarmhouse?: boolean;
  isUpcoming?: boolean;
}

const formatDisplayDate = (dateStr: string) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const day = date.getDate();
  const month = date.toLocaleString("en-US", { month: "short" });
  return `${day} ${month}`;
};

const formatDisplayDateWithYear = (dateStr: string) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const day = date.getDate();
  const month = date.toLocaleString("en-US", { month: "short" });
  const year = date.getFullYear().toString().slice(-2);
  return `${day} ${month} ${year}`;
};

export const StaycationBookingCard = ({
  bookingId,
  id,
  name,
  phone,
  avatarUrl,
  amount,
  paidAmount,
  totalAmount,
  status,
  checkIn,
  checkOut,
  guestCount,
  roomName,
  onPress,
  isFarmhouse = true,
  isUpcoming = false,
}: StaycationBookingCardProps) => {
  const navigation = useNavigation<any>();

  const { isLoading, booking: fetchedBooking } = useStaycationBooking(bookingId);

  const displayData = useMemo(() => {
    if (fetchedBooking) {
      return {
        ...fetchedBooking,
        roomName: fetchedBooking.roomName || roomName,
      };
    }
    return {
      id,
      name,
      phone,
      avatarUrl,
      amount,
      paidAmount,
      totalAmount,
      status,
      checkIn,
      checkOut,
      guestCount,
      roomName,
    };
  }, [
    fetchedBooking,
    id,
    name,
    phone,
    avatarUrl,
    amount,
    paidAmount,
    totalAmount,
    status,
    checkIn,
    checkOut,
    guestCount,
    roomName,
  ]);

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      const todayStr = new Date().toISOString().split("T")[0];
      const isPast = (displayData.checkOut || "") < todayStr;

      navigation.navigate("StaycationBookingDetails", {
        booking: {
          ...displayData,
          checkIn: formatDisplayDate(displayData.checkIn || ""),
          checkOut: formatDisplayDate(displayData.checkOut || ""),
          amount: displayData.amount,
        },
        isFromHistory: isPast || displayData.status === "Cancelled",
      });
    }
  };

  const getStatusColor = () => {
    const s = displayData.status?.toLowerCase();
    switch (s) {
      case "online":
        return "#63A1FD";
      case "offline":
        return "#E55959";
      case "cancelled":
        return "#E55959";
      default:
        return COLORS.text.muted;
    }
  };

  const getStatusBgColor = () => {
    const s = displayData.status?.toLowerCase();
    switch (s) {
      case "online":
        return "#E8F0FE";
      case "offline":
        return "#FDE8E8";
      case "cancelled":
        return "#FDE8E8";
      default:
        return "#F3F4F6";
    }
  };

  const isPaymentPending = useMemo(() => {
    if (displayData.status === "Cancelled") return false;

    const paid =
      typeof displayData.paidAmount === "number"
        ? displayData.paidAmount
        : parseFloat(displayData.paidAmount || "0");
    const total =
      typeof displayData.totalAmount === "number"
        ? displayData.totalAmount
        : parseFloat(displayData.totalAmount || "0");

    const hasBalance = total > 0 && paid < total;
    if (!hasBalance) return false;

    if (!displayData.checkOut) return false;

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}-${now
      .getDate()
      .toString()
      .padStart(2, "0")}`;

    const checkOutDateOnly = displayData.checkOut.split("T")[0];

    return todayStr >= checkOutDateOnly;
  }, [displayData.paidAmount, displayData.totalAmount, displayData.status, displayData.checkOut]);

  if (isLoading && bookingId && !displayData.id) {
    return (
      <View style={[styles.cardContainer, styles.loaderCard]}>
        <ActivityIndicator size="small" color="#63A1FD" />
      </View>
    );
  }

  if (!displayData.id && bookingId && !isLoading) return null;

  const isGreyBg = displayData.status?.toLowerCase() === "cancelled";

  const getAmountColor = () => {
    return "#00B562";
  };

  let dateRoomText = "";
  if (isFarmhouse) {
    dateRoomText = `${formatDisplayDate(displayData.checkIn || "")} - ${formatDisplayDate(
      displayData.checkOut || "",
    )}`;
  } else {
    const roomPrefix = displayData.roomName || "Room Assigned";
    if (isUpcoming) {
      dateRoomText = `${formatDisplayDateWithYear(displayData.checkIn || "")} | ${roomPrefix}`;
    } else {
      dateRoomText = roomPrefix;
    }
  }

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
      style={[styles.cardContainer, isGreyBg && styles.cardContainerGrey]}>
      {/* Top Section */}
      <View style={styles.topSection}>
        <View style={styles.avatarWrapper}>
          {displayData.avatarUrl ? (
            <Image source={{ uri: displayData.avatarUrl }} style={styles.avatarImage} />
          ) : (
            <PersonSvg width={ms(22)} height={ms(22)} color="#63A1FD" />
          )}
        </View>

        <View style={styles.infoWrapper}>
          <Text weight="bold" style={styles.nameText}>
            {displayData.name}
          </Text>
          <Text weight="medium" style={styles.phoneText}>
            {displayData.phone}
          </Text>
        </View>

        {isPaymentPending && (
          <View style={styles.paymentBadge}>
            <Text weight="semiBold" style={styles.paymentBadgeText}>
              Payment Pending
            </Text>
          </View>
        )}

        <View style={styles.amountStatusWrapper}>
          <Text weight="bold" style={[styles.amountText, { color: getAmountColor() }]}>
            ₹{displayData.paidAmount || 0}
          </Text>
          <View style={[styles.statusLabelContainer, { backgroundColor: getStatusBgColor() }]}>
            <Text weight="semiBold" style={[styles.statusLabel, { color: getStatusColor() }]}>
              {displayData.status}
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
            <CalendarSvg width={ms(18)} height={ms(18)} color="#63A1FD" />
          </View>
          <Text weight="semiBold" style={styles.dateText}>
            {dateRoomText}
          </Text>
        </View>

        <View style={styles.guestWrapper}>
          <Text weight="semiBold" style={styles.guestText}>
            {displayData.guestCount} Guest
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
  cardContainerGrey: {
    opacity: 0.6,
  },
  loaderCard: {
    justifyContent: "center",
    minHeight: vs(80),
    alignItems: "center",
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
    fontSize: fs(20),
    color: COLORS.text.primary,
    marginBottom: vs(2),
  },
  phoneText: {
    fontSize: fs(18),
    color: COLORS.text.secondary,
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
    color: COLORS.text.primary,
  },
  guestWrapper: {
    justifyContent: "center",
  },
  guestText: {
    fontSize: fs(16),
    color: COLORS.text.primary,
  },
});
