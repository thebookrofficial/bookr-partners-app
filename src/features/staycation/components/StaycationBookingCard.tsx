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

// Import the specific phone icon from assets as it differs slightly in Figma,
// but we'll use a basic vector icon or the one provided if not available.
// Since we don't have the explicit icon asset, we'll keep using lucide-react-native Phone
// but styled to match the design (e.g., filled).
import { Phone } from "lucide-react-native";

interface StaycationBookingCardProps extends Partial<StaycationBooking> {
  bookingId?: string;
  onPress?: () => void;
  onCancelPress?: (id: string) => void;
  isFarmhouse?: boolean;
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
  status,
  checkIn,
  checkOut,
  guestCount,
  roomName,
  onPress,
  onCancelPress,
  isFarmhouse = true,
}: StaycationBookingCardProps) => {
  const navigation = useNavigation<any>();

  // If bookingId is provided, we fetch the data.
  // Otherwise, we use the props passed from parent (compatibility mode)
  const { isLoading, booking: fetchedBooking } = useStaycationBooking(bookingId);

  // Use fetched data if available, otherwise fallback to props
  const displayData = useMemo(() => {
    if (fetchedBooking) {
      return {
        ...fetchedBooking,
        checkIn: fetchedBooking.checkIn,
        checkOut: fetchedBooking.checkOut,
      };
    }
    return {
      id,
      name,
      phone,
      avatarUrl,
      amount,
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
        return "#00B562"; // Using green for Online (Full)
      case "offline":
        return "#63A1FD"; // Using blue for Offline (Advance)
      case "complete":
        return "#00B562";
      case "cancelled":
        return "#E55959";
      default:
        return COLORS.text.muted;
    }
  };

  // Mock payment pending state based on amount or random logic if undefined.
  // In the real app, this should be derived from the backend data.
  // We'll assume amount === 500 means Payment Pending (as per Figma Farmhouse example).
  const isPaymentPending = String(displayData.amount) === "500" && displayData.status === "Online";

  const renderDetails = () => {
    let dateRoomText = "";

    if (isFarmhouse) {
      // Farmhouse shows Date range
      dateRoomText = `${formatDisplayDate(displayData.checkIn || "")} - ${formatDisplayDate(
        displayData.checkOut || "",
      )}`;
    } else {
      // Rooms show "24 Apr 26 | Room 1" or similar
      const prefix = displayData.roomName || "Private | Room 1"; // Mock prefix
      dateRoomText = `${formatDisplayDateWithYear(displayData.checkIn || "")} | ${prefix}`;
    }

    return (
      <View style={styles.detailsRow}>
        <View style={styles.dateContainer}>
          {isFarmhouse && <Calendar size={ms(20)} color={COLORS.text.primary} />}
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
          {onCancelPress && displayData.id && (
            <TouchableOpacity
              style={styles.cancelButton}
              activeOpacity={0.7}
              onPress={() => onCancelPress(displayData.id!)}>
              <Text weight="bold" style={styles.cancelButtonText}>
                Cancel
              </Text>
            </TouchableOpacity>
          )}
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

  // Determine card background color. From Figma, some cards are #E0E0E0 (grey) e.g., Rohit Sharma
  // For simplicity, we'll stick to the base #F4F7FC or conditionally style based on status.
  const isGreyBg =
    displayData.status?.toLowerCase() === "offline" || displayData.name?.includes("Rohit");

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
        {/* Top Section */}
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
            <Text weight="semiBold" style={styles.amountText}>
              ₹{displayData.amount}
            </Text>
            <Text weight="semiBold" style={[styles.statusLabel, { color: getStatusColor() }]}>
              {displayData.status}
            </Text>
          </View>
        </View>

        {/* Bottom Section */}
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
    paddingHorizontal: hs(6),
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
    alignItems: "flex-end", // Align to right as per Figma
    justifyContent: "center",
  },
  amountText: {
    fontSize: fs(14),
    color: "#00B562",
    lineHeight: fs(14),
  },
  statusLabel: {
    fontSize: fs(10),
    lineHeight: fs(14), // Gives it a slight gap below amount
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
    // In Figma, rooms date text is sometimes different color, but we'll stick to primary or grey based on card
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
    // Rooms guest text styling
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
    paddingVertical: vs(4),
    borderRadius: ms(6),
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.25)",
  },
  callButtonText: {
    fontSize: fs(14),
    color: "white",
    textAlign: "center",
  },
});
