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
import { Phone, Calendar } from "lucide-react-native";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
import { StaycationBooking } from "../types/staycation.types";
import { useNavigation } from "@react-navigation/native";
import { useStaycationBooking } from "../hooks/useStaycationBooking";

interface StaycationBookingCardProps extends Partial<StaycationBooking> {
  bookingId?: string;
  onPress?: () => void;
}

// Helper to format date for card display (e.g., "2026-04-26" -> "26 Apr")
const formatDisplayDate = (dateStr: string) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const day = date.getDate();
  const month = date.toLocaleString("en-US", { month: "short" });
  return `${day} ${month}`;
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
  onPress,
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
        checkIn: formatDisplayDate(fetchedBooking.checkIn),
        checkOut: formatDisplayDate(fetchedBooking.checkOut),
      };
    }
    return {
      id,
      name,
      phone,
      avatarUrl,
      amount,
      status,
      checkIn, // Assumes parent already formatted or we keep as is
      checkOut,
      guestCount,
    };
  }, [fetchedBooking, id, name, phone, avatarUrl, amount, status, checkIn, checkOut, guestCount]);

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
      // StaycationBookingDetailsScreen expects 'booking' object
      navigation.navigate("StaycationBookingDetails", {
        booking: {
          ...displayData,
          // Map back the numeric values for consistency with screen expectations
          amount: displayData.amount,
        },
        isFromHistory: displayData.status === "Complete",
      });
    }
  };

  const getStatusColor = () => {
    switch (displayData.status) {
      case "Online":
      case "Full":
      case "Complete":
      case "Advance":
        return "#63A1FD";
      case "Offline":
      case "Remaining":
        return "#E55959";
      case "Cancelled":
        return COLORS.text.muted;
      default:
        return COLORS.text.muted;
    }
  };

  // Do not block render with a loader here if we have props (id check)
  // Only show loader if we have NO data at all and are fetching
  if (isLoading && bookingId && !displayData.id) {
    return (
      <View style={[styles.cardContainer, styles.loaderCard]}>
        <ActivityIndicator size="small" color="#63A1FD" />
      </View>
    );
  }

  if (!displayData.id && bookingId && !isLoading) return null;

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={handlePress} style={styles.cardContainer}>
      <View style={styles.avatarWrapper}>
        <Avatar
          source={displayData.avatarUrl ? { uri: displayData.avatarUrl } : undefined}
          size={50}
        />
      </View>

      <View style={styles.mainContent}>
        {/* Top Section: Name, Phone, Amount, Status */}
        <View style={styles.topHeader}>
          <View style={styles.namePhoneContainer}>
            <Text weight="bold" style={styles.nameText}>
              {displayData.name}
            </Text>
            <View style={styles.phoneRow}>
              <Phone size={ms(20)} color={COLORS.text.primary} fill={COLORS.text.primary} />
              <Text weight="medium" style={styles.phoneText}>
                {displayData.phone}
              </Text>
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

        {/* Bottom Section: Date, Guests, Call */}
        <View style={styles.detailsRow}>
          <View style={styles.dateContainer}>
            <Calendar size={ms(20)} color={COLORS.text.primary} />
            <Text weight="semiBold" style={styles.dateText}>
              {displayData.checkIn} - {displayData.checkOut}
            </Text>
          </View>

          <View style={styles.guestWrapper}>
            <Text weight="semiBold" style={styles.guestText}>
              {displayData.guestCount} Guest
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
  loaderCard: {
    justifyContent: "center",
    minHeight: vs(80),
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
