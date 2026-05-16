// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useMemo } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Text, Avatar } from "@/components/ui";
import { Calendar } from "lucide-react-native";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
import { StaycationBooking } from "../types/staycation.types";
import { useNavigation } from "@react-navigation/native";
import { useStaycationBooking } from "../hooks/useStaycationBooking";
import { Phone } from "lucide-react-native";

interface StaycationBookingCardProps extends Partial<StaycationBooking> {
  bookingId?: string;
  onPress?: () => void;
  onCancelPress?: (id: string) => void;
  isFarmhouse?: boolean;
  isUpcoming?: boolean;
}

// Helper to format date for card display (e.g., "2026-04-26" -> "26 Apr")
const formatDisplayDate = (dateStr: string) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const day = date.getDate();
  const month = date.toLocaleString("en-US", { month: "short" });
  return `${day} ${month}`;
};

// Helper for rooms format (e.g., "2026-04-24" -> "24 Apr 26")
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

  const handleCall = () => {
    if (displayData.phone) {
      const cleanPhone = displayData.phone.replace(/[^\d+]/g, "");
      const url = `tel:${cleanPhone}`;
      Linking.openURL(url).catch(() => Alert.alert("Error", "Could not open dialer."));
    }
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      navigation.navigate("StaycationBookingDetails", {
        booking: {
          ...displayData,
          checkIn: formatDisplayDate(displayData.checkIn || ""),
          checkOut: formatDisplayDate(displayData.checkOut || ""),
          amount: displayData.amount,
        },
        isFromHistory: displayData.status === "Complete",
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
      case "complete":
        return "#00B562";
      case "cancelled":
        return "#E55959";
      default:
        return COLORS.text.muted;
    }
  };

  // Payment Pending logic: if paid amount is less than total amount and it's not cancelled
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
    return total > 0 && paid < total;
  }, [displayData.paidAmount, displayData.totalAmount, displayData.status]);

  const renderDetails = () => {
    let dateRoomText = "";

    if (isFarmhouse) {
      dateRoomText = `${formatDisplayDate(displayData.checkIn || "")} - ${formatDisplayDate(
        displayData.checkOut || "",
      )}`;
    } else {
      // FIX: Use real roomName from database, fallback only if missing
      const roomPrefix = displayData.roomName || "Room Assigned";

      if (isUpcoming) {
        dateRoomText = `${formatDisplayDateWithYear(displayData.checkIn || "")} | ${roomPrefix}`;
      } else {
        dateRoomText = roomPrefix;
      }
    }

    return (
      <View style={styles.detailsRow}>
        <View style={styles.dateContainer}>
          {isFarmhouse || isUpcoming ? (
            <Calendar size={ms(20)} color={COLORS.text.primary} />
          ) : null}
          <Text weight="semiBold" style={[styles.dateText, !isFarmhouse && styles.roomsDateText]}>
            {dateRoomText}
          </Text>
        </View>

        <View style={styles.guestWrapper}>
          <Text weight="semiBold" style={[styles.guestText, !isFarmhouse && styles.roomsGuestText]}>
            {displayData.guestCount} Guest
          </Text>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.callButton} activeOpacity={0.7} onPress={handleCall}>
            <Text weight="bold" style={styles.callButtonText}>
              Call
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (isLoading && bookingId && !displayData.id) {
    return (
      <View style={[styles.cardContainer, styles.loaderCard]}>
        <ActivityIndicator size="small" color="#63A1FD" />
      </View>
    );
  }

  if (!displayData.id && bookingId && !isLoading) return null;

  // Only show grey if the booking is finished (Complete) or voided (Cancelled)
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const isGreyBg = useMemo(() => {
    const s = displayData.status?.toLowerCase();
    // Only grey out if explicitly cancelled or completed history
    return s === "cancelled" || s === "complete";
  }, [displayData.status]);

  const getAmountColor = () => {
    const s = displayData.status?.toLowerCase();
    if (s === "advance" || s === "complete") return "#00B562";
    if (s === "online" || s === "offline") return "#00B562";
    return "#00B562";
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
      style={[styles.cardContainer, isGreyBg && styles.cardContainerGrey]}>
      <View style={styles.avatarWrapper}>
        <Avatar
          source={displayData.avatarUrl ? { uri: displayData.avatarUrl } : undefined}
          size={ms(50)}
        />
      </View>

      <View style={styles.mainContent}>
        <View style={styles.topHeader}>
          <View style={styles.namePhoneContainer}>
            <Text weight="bold" style={[styles.nameText, isGreyBg && styles.nameTextGrey]}>
              {displayData.name}
            </Text>
            <View style={styles.phoneRow}>
              <Phone
                size={ms(20)}
                color={isGreyBg ? "#8C8C8C" : COLORS.text.primary}
                fill={isGreyBg ? "#8C8C8C" : COLORS.text.primary}
              />
              <Text weight="medium" style={[styles.phoneText, isGreyBg && styles.phoneTextGrey]}>
                {displayData.phone}
              </Text>
              {isPaymentPending && (
                <View style={styles.paymentBadge}>
                  <Text weight="semiBold" style={styles.paymentBadgeText}>
                    Payment Pending
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.amountStatusWrapper}>
            <Text weight="semiBold" style={[styles.amountText, { color: getAmountColor() }]}>
              ₹{displayData.amount}
            </Text>
            <Text weight="semiBold" style={[styles.statusLabel, { color: getStatusColor() }]}>
              {displayData.status}
            </Text>
          </View>
        </View>

        {renderDetails()}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    flexDirection: "row",
    backgroundColor: "#F4F7FC",
    borderRadius: ms(10),
    paddingHorizontal: hs(8),
    paddingVertical: vs(10),
    marginBottom: vs(10),
    width: "100%",
    alignItems: "center",
    gap: hs(10),
  },
  cardContainerGrey: {
    backgroundColor: "#E0E0E0",
  },
  loaderCard: {
    justifyContent: "center",
    minHeight: vs(80),
  },
  avatarWrapper: {},
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
    color: COLORS.text.primary,
    lineHeight: fs(16 * 0.93),
  },
  nameTextGrey: {
    color: "#8C8C8C",
  },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(6),
  },
  phoneText: {
    fontSize: fs(14),
    color: COLORS.text.primary,
  },
  phoneTextGrey: {
    color: "#8C8C8C",
  },
  paymentBadge: {
    borderWidth: 1,
    borderColor: "#E55959",
    borderRadius: ms(3),
    paddingHorizontal: hs(4),
    paddingVertical: vs(2),
    marginLeft: hs(2),
  },
  paymentBadgeText: {
    color: "#E55959",
    fontSize: fs(12),
    lineHeight: fs(12),
  },
  amountStatusWrapper: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  amountText: {
    fontSize: fs(14),
    lineHeight: fs(14),
  },
  statusLabel: {
    fontSize: fs(10),
    lineHeight: fs(14),
    textTransform: "capitalize",
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
    color: COLORS.text.primary,
  },
  roomsDateText: {
    color: COLORS.text.primary,
  },
  guestWrapper: {
    justifyContent: "center",
    alignItems: "center",
  },
  guestText: {
    fontSize: fs(14),
    color: COLORS.text.primary,
  },
  roomsGuestText: {
    color: COLORS.text.primary,
  },
  actionButtons: {
    flexDirection: "row",
    gap: hs(8),
    alignItems: "center",
  },
  cancelButton: {
    paddingHorizontal: hs(10),
    paddingVertical: vs(4),
    borderRadius: ms(6),
    borderWidth: 1,
    borderColor: COLORS.danger,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: fs(14),
    color: COLORS.danger,
    textAlign: "center",
  },
  callButton: {
    backgroundColor: "black",
    paddingHorizontal: hs(14),
    paddingVertical: vs(6),
    borderRadius: ms(6),
  },
  callButtonText: {
    fontSize: fs(14),
    color: "white",
    textAlign: "center",
  },
});
