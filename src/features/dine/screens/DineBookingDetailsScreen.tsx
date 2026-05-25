// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useMemo, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import {
  ChevronLeft,
  Phone,
  Calendar as CalendarIcon,
  Trash2,
  CreditCard,
  Clock,
} from "lucide-react-native";
import { Text } from "@/components/ui/Text";
import { Avatar } from "@/components/ui/Avatar";
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { COLORS } from "@/constants/theme";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { MainStackParamList } from "@/navigation/navigation.types";
import { useDineDetails } from "../hooks/useDineDetails";
import { supabase } from "@/lib/supabase";
import { Canvas, Skia, Skottie, Group } from "@shopify/react-native-skia";
import { useDerivedValue, useSharedValue, withTiming } from "react-native-reanimated";

const whatsappAnimation = require("../../../assets/animations/ic-whatsapp.json");

interface InfoFieldProps {
  label: string;
  value: string;
  icon?: any;
  halfWidth?: boolean;
  rightElement?: React.ReactNode;
}

const InfoField = ({
  label,
  value,
  icon: Icon,
  halfWidth = false,
  rightElement,
}: InfoFieldProps) => (
  <View style={[styles.infoFieldContainer, halfWidth && styles.halfWidth]}>
    <View style={styles.labelRow}>
      {Icon && <Icon size={ms(18)} color={COLORS.primary} style={styles.labelIcon} />}
      <Text variant="body2" weight="medium" style={styles.labelText}>
        {label}
      </Text>
    </View>
    <View style={styles.valueBox}>
      <Text variant="body1" weight="semiBold" color={COLORS.text.primary} style={styles.flex1}>
        {value}
      </Text>
      {rightElement}
    </View>
  </View>
);

export const DineBookingDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<MainStackParamList, "DineBookingDetails">>();
  const { bookingId, isFromPayment = false } = route.params;

  const { loading, booking } = useDineDetails(bookingId);
  const lottie = useMemo(() => {
    try {
      return Skia.Skottie.Make(JSON.stringify(whatsappAnimation));
    } catch (e) {
      console.error("Failed to load WhatsApp animation:", e);
      return null;
    }
  }, []);

  const progress = useSharedValue(0);

  useEffect(() => {
    if (lottie) {
      const duration = lottie.duration();
      // Initial animation
      progress.value = 0;
      progress.value = withTiming(duration, { duration: duration * 1000 });

      // Repeat animation after 5 seconds
      const timer = setTimeout(() => {
        progress.value = 0;
        progress.value = withTiming(duration, { duration: duration * 1000 });
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [lottie, progress]);

  const frame = useDerivedValue(() => {
    if (!lottie) {
      return 0;
    }
    const fps = lottie.fps();
    return progress.value * fps;
  }, [lottie]);

  const scale = useMemo(() => {
    if (!lottie) return 1;
    const size = lottie.size();
    return ms(30) / (size.width || 48);
  }, [lottie]);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleCall = () => {
    if (booking?.phone) {
      const cleanPhone = booking.phone.replace(/[^\d+]/g, "");
      const url = `tel:${cleanPhone}`;
      Linking.openURL(url).catch(() => Alert.alert("Error", "Could not open dialer."));
    }
  };

  const handleWhatsApp = () => {
    if (booking?.phone) {
      const cleanPhone = booking.phone.replace(/[^\d]/g, "");
      const message = `Hello ${booking.name}, this is regarding your table booking for ${booking.guestCount} persons at ${booking.time} on ${booking.date}.`;
      const url = `whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;

      Linking.canOpenURL(url).then(supported => {
        if (supported) {
          Linking.openURL(url);
        } else {
          const webUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
          Linking.openURL(webUrl).catch(() => Alert.alert("Error", "Could not open WhatsApp."));
        }
      });
    }
  };

  const handleCancelBooking = () => {
    Alert.alert("Cancel Booking", "Are you sure you want to cancel this booking?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes, Cancel",
        style: "destructive",
        onPress: async () => {
          try {
            const { error } = await supabase
              .from("dining_bookings")
              .update({ booking_status: "cancelled" })
              .eq("id", bookingId);

            if (error) throw error;

            Alert.alert("Success", "Booking has been cancelled.");
            navigation.goBack();
          } catch (error) {
            console.error("Error cancelling booking:", error);
            Alert.alert("Error", "Could not cancel booking.");
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={styles.centerContainer}>
        <Text>Booking details not found.</Text>
      </View>
    );
  }

  return (
    <ScreenContainer scrollable paddingHorizontal={hs(12)} backgroundColor={COLORS.background}>
      {/* Header Section */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ChevronLeft size={ms(24)} color={COLORS.text.primary} />
        </TouchableOpacity>
        <View style={styles.customerHeader}>
          <Avatar source={booking.avatarUrl ? { uri: booking.avatarUrl } : undefined} size={50} />
          <Text variant="h3" weight="bold" style={styles.customerName}>
            {booking.name}
          </Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Title */}
        <Text variant="body1" weight="bold" style={styles.sectionTitle}>
          {isFromPayment ? "PAYMENT DETAILS" : "TABLE BOOKING"}
        </Text>

        {/* Info Fields */}
        <View style={styles.fieldsGrid}>
          {isFromPayment && <InfoField label="User Name" value={booking.name} icon={CreditCard} />}
          <InfoField
            label="Mobile No"
            value={booking.phone}
            icon={Phone}
            rightElement={
              <View style={styles.mobileActions}>
                <TouchableOpacity onPress={handleWhatsApp} activeOpacity={0.7}>
                  <View style={styles.whatsappIconWrapper}>
                    <Canvas style={styles.whatsappCanvas}>
                      {lottie && (
                        <Group transform={[{ translateX: 0 }, { translateY: 0 }, { scale }]}>
                          <Skottie animation={lottie} frame={frame} />
                        </Group>
                      )}
                    </Canvas>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.callButton}
                  onPress={handleCall}
                  activeOpacity={0.7}>
                  <Text variant="body2" weight="bold" color={COLORS.text.inverse}>
                    Call
                  </Text>
                </TouchableOpacity>
              </View>
            }
          />

          {!isFromPayment ? (
            <>
              <View style={styles.row}>
                <InfoField label="Date" value={booking.date} halfWidth />
                <InfoField label="Booking time" value={booking.time} halfWidth />
              </View>

              <InfoField label="No of person" value={booking.guestCount} />

              <InfoField label="Occasion" value={booking.occasion} icon={CalendarIcon} />
            </>
          ) : (
            <>
              <InfoField label="Payment Time" value={booking.transactionTime} icon={Clock} />
              <InfoField label="Total Bill Paid" value={booking.billAmount} icon={CreditCard} />

              {/* Transaction Details Box */}
              <View style={styles.paymentBox}>
                <View style={styles.detailsRow}>
                  <Text variant="body2" weight="semiBold" color={COLORS.text.primary}>
                    Method
                  </Text>
                  <Text variant="body2" weight="medium" color={COLORS.text.primary}>
                    {booking.paymentMethod}
                  </Text>
                </View>
                <View style={styles.detailsRow}>
                  <Text variant="body2" weight="semiBold" color={COLORS.text.primary}>
                    Transaction ID
                  </Text>
                  <Text variant="body2" weight="medium" color={COLORS.text.primary}>
                    {booking.transactionId}
                  </Text>
                </View>
                <View style={styles.detailsRow}>
                  <Text variant="body2" weight="semiBold" color={COLORS.text.primary}>
                    Transaction Date
                  </Text>
                  <Text variant="body2" weight="medium" color={COLORS.text.primary}>
                    {booking.transactionDate}
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>

        {!isFromPayment && (
          /* Cancel Action */
          <TouchableOpacity
            style={styles.cancelButton}
            activeOpacity={0.7}
            onPress={handleCancelBooking}>
            <Text variant="body1" weight="bold" color={COLORS.text.primary}>
              Cancel Your Booking
            </Text>
            <Trash2 size={ms(24)} color={COLORS.text.primary} />
          </TouchableOpacity>
        )}
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  flex1: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: vs(20),
    marginBottom: vs(15),
  },
  backButton: {
    marginRight: hs(10),
  },
  customerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(12),
  },
  customerName: {
    fontSize: fs(22),
    color: COLORS.text.primary,
  },
  scrollContent: {
    paddingBottom: vs(40),
  },
  sectionTitle: {
    textTransform: "uppercase",
    marginBottom: vs(15),
    fontSize: fs(16),
    color: COLORS.text.primary,
  },
  fieldsGrid: {
    gap: vs(15),
    marginBottom: vs(25),
  },
  infoFieldContainer: {
    width: "100%",
  },
  halfWidth: {
    width: "48%",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(6),
    marginBottom: vs(4),
  },
  labelIcon: {
    // Icons from Figma
  },
  labelText: {
    color: COLORS.text.primary,
  },
  valueBox: {
    backgroundColor: COLORS.surface.primary,
    borderRadius: ms(10),
    paddingHorizontal: hs(10),
    paddingVertical: vs(12),
    minHeight: vs(45),
    flexDirection: "row",
    alignItems: "center",
  },
  mobileActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(10),
  },
  whatsappIconWrapper: {
    width: ms(30),
    height: ms(30),
    justifyContent: "center",
    alignItems: "center",
  },
  whatsappCanvas: {
    width: ms(30),
    height: ms(30),
  },
  callButton: {
    backgroundColor: COLORS.text.primary,
    paddingHorizontal: hs(16),
    paddingVertical: vs(5),
    borderRadius: ms(6),
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.15)",
  },
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: COLORS.border.navBar,
    borderRadius: ms(10),
    paddingHorizontal: hs(12),
    paddingVertical: vs(12),
    marginTop: vs(10),
  },
  paymentBox: {
    backgroundColor: COLORS.surface.primary,
    borderRadius: ms(10),
    padding: ms(10),
    gap: vs(10),
    marginTop: vs(10),
    borderWidth: 1,
    borderColor: COLORS.border.navBar,
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
