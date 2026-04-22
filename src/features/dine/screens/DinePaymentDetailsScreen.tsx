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
import { ChevronLeft, Phone, CreditCard, CalendarDays } from "lucide-react-native";
import { Text } from "@/components/ui/Text";
import { Avatar } from "@/components/ui/Avatar";
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { COLORS } from "@/constants/theme";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { MainStackParamList } from "@/navigation/navigation.types";
import { useDineDetails } from "../hooks/useDineDetails";
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

export const DinePaymentDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<MainStackParamList, "DinePaymentDetails">>();
  const { bookingId } = route.params;

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
        <Text>Details not found.</Text>
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
          TABLE BOOKING
        </Text>

        {/* Info Fields */}
        <View style={styles.fieldsGrid}>
          <InfoField label="User Name" value={booking.name} icon={CreditCard} />
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

          <InfoField label="Type" value={booking.type} icon={CalendarDays} />

          <View style={styles.row}>
            <InfoField label="Booking time" value={booking.time} halfWidth />
            <InfoField label="No of person" value={booking.guestCount} halfWidth />
          </View>
        </View>

        {/* Invoice and Payout Card */}
        <View style={styles.invoiceCard}>
          <Text variant="body1" weight="bold" style={styles.cardTitle}>
            INVOICE AND PAYOUT
          </Text>
          <View style={styles.invoiceRow}>
            <Text variant="body2" weight="semiBold" color={COLORS.text.primary}>
              Original Bill Amount
            </Text>
            <Text variant="body2" weight="medium" color={COLORS.text.primary}>
              {booking.billAmount}
            </Text>
          </View>
          <View style={styles.invoiceRow}>
            <Text variant="body2" weight="semiBold" color={COLORS.text.primary}>
              Discount
            </Text>
            <Text variant="body2" weight="medium" color={COLORS.danger}>
              {booking.discount}
            </Text>
          </View>
          <View style={styles.invoiceRow}>
            <View style={styles.dashedLabelContainer}>
              <Text variant="body2" weight="semiBold" color={COLORS.text.primary}>
                GST
              </Text>
            </View>
            <Text variant="body2" weight="medium" color={COLORS.text.primary}>
              {booking.gst}
            </Text>
          </View>
          <View style={styles.invoiceRow}>
            <View style={styles.dashedLabelContainer}>
              <Text variant="body2" weight="semiBold" color={COLORS.text.primary}>
                Platform
              </Text>
            </View>
            <Text variant="body2" weight="medium" color={COLORS.danger}>
              {booking.platformFee}
            </Text>
          </View>
          <View style={styles.invoiceRow}>
            <View style={styles.dashedLabelContainer}>
              <Text variant="body2" weight="semiBold" color={COLORS.text.primary}>
                Gateway Charges
              </Text>
            </View>
            <Text variant="body2" weight="medium" color={COLORS.danger}>
              {booking.gatewayCharges}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.invoiceRow}>
            <Text variant="body2" weight="bold" color={COLORS.text.primary}>
              EST. Payout Amount
            </Text>
            <Text variant="body2" weight="bold" color="#00B562">
              {booking.estPayout}
            </Text>
          </View>
        </View>

        {/* Payment Details Section */}
        <View style={styles.paymentSection}>
          <View style={styles.paymentHeader}>
            <CreditCard size={ms(20)} color={COLORS.text.primary} />
            <Text variant="body1" weight="bold" style={styles.paymentTitle}>
              PAYMENT DETAILS
            </Text>
          </View>
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
          <View style={styles.detailsRow}>
            <Text variant="body2" weight="semiBold" color={COLORS.text.primary}>
              Transaction Time
            </Text>
            <Text variant="body2" weight="medium" color={COLORS.text.primary}>
              {booking.transactionTime}
            </Text>
          </View>
        </View>
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
  invoiceCard: {
    backgroundColor: COLORS.surface.primary,
    borderRadius: ms(10),
    borderWidth: 1,
    borderColor: COLORS.border.navBar,
    padding: ms(hs(10)),
    gap: vs(10),
    marginBottom: vs(20),
  },
  cardTitle: {
    textTransform: "uppercase",
    fontSize: fs(16),
    marginBottom: vs(2),
    color: COLORS.text.primary,
  },
  invoiceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dashedLabelContainer: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.text.primary,
    borderStyle: "dashed",
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border.navBar,
    marginVertical: vs(5),
  },
  paymentSection: {
    padding: ms(6),
    gap: vs(12),
    marginBottom: vs(30),
  },
  paymentHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(6),
    marginBottom: vs(4),
  },
  paymentTitle: {
    textTransform: "uppercase",
    fontSize: fs(16),
    color: COLORS.text.primary,
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
