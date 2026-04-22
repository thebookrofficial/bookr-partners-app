// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { ChevronLeft, Phone, CalendarDays, CreditCard, MessageCircle } from "lucide-react-native";
import { Text } from "@/components/ui/Text";
import { Avatar } from "@/components/ui/Avatar";
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { COLORS } from "@/constants/theme";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { MainStackParamList } from "@/navigation/navigation.types";
import { useDineDetails } from "../hooks/useDineDetails";

interface InfoFieldProps {
  label: string;
  value: string;
  icon?: any;
  halfWidth?: boolean;
  rightAction?: React.ReactNode;
}

const InfoField = ({
  label,
  value,
  icon: Icon,
  halfWidth = false,
  rightAction,
}: InfoFieldProps) => (
  <View style={[styles.infoFieldContainer, halfWidth && styles.halfWidth]}>
    <View style={styles.labelContainer}>
      {Icon && <Icon size={ms(18)} color={COLORS.primary} style={styles.labelIcon} />}
      <Text variant="body2" weight="medium" style={styles.labelText}>
        {label}
      </Text>
    </View>
    <View style={styles.valueBox}>
      <Text variant="body1" weight="semiBold" style={styles.flex1}>
        {value}
      </Text>
      {rightAction}
    </View>
  </View>
);

interface InvoiceRowProps {
  label: string;
  value: string;
  isNegative?: boolean;
  isTotal?: boolean;
  isDashed?: boolean;
}

const InvoiceRow = ({
  label,
  value,
  isNegative = false,
  isTotal = false,
  isDashed = false,
}: InvoiceRowProps) => (
  <View style={styles.invoiceRow}>
    <View style={isDashed ? styles.dashedLabelContainer : null}>
      <Text
        variant={isTotal ? "body1" : "body2"}
        weight={isTotal ? "bold" : "semiBold"}
        style={isDashed ? styles.dashedLabel : null}>
        {label}
      </Text>
    </View>
    <Text
      variant={isTotal ? "body1" : "body2"}
      weight={isTotal ? "bold" : "medium"}
      style={[
        isNegative && styles.negativeText,
        isTotal && styles.totalText,
        !isNegative && !isTotal && styles.normalAmountText,
      ]}>
      {value}
    </Text>
  </View>
);

const DineDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<MainStackParamList, "DineBookingDetails">>();
  const { bookingId } = route.params;

  const { loading, booking } = useDineDetails(bookingId);

  const handleBack = () => {
    navigation.goBack();
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
          // Fallback to web link if app is not installed
          const webUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
          Linking.openURL(webUrl).catch(() => Alert.alert("Error", "Could not open WhatsApp."));
        }
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Booking not found.</Text>
      </View>
    );
  }

  return (
    <ScreenContainer scrollable paddingHorizontal={hs(12)}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ChevronLeft size={ms(24)} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Avatar source={booking.avatarUrl ? { uri: booking.avatarUrl } : undefined} size={50} />
        <Text variant="h3" weight="bold" style={styles.customerName}>
          {booking.name}
        </Text>
      </View>

      {/* Booking Title */}
      <Text variant="body1" weight="bold" style={styles.sectionTitle}>
        TABLE BOOKING
      </Text>

      {/* Info Fields */}
      <View style={styles.fieldsContainer}>
        <InfoField
          label="Mobile No"
          value={booking.phone}
          icon={Phone}
          rightAction={
            <TouchableOpacity onPress={handleWhatsApp}>
              <MessageCircle size={ms(20)} color="#25D366" fill="#25D366" />
            </TouchableOpacity>
          }
        />
        <InfoField label="Type" value={booking.type} icon={CalendarDays} />
        <View style={styles.row}>
          <InfoField label="Booking time" value={booking.time} halfWidth />
          <InfoField label="No of person" value={booking.guestCount} halfWidth />
        </View>
      </View>

      {/* Invoice Card */}
      <View style={styles.invoiceCard}>
        <Text variant="body1" weight="bold" style={styles.cardTitle}>
          INVOICE AND PAYOUT
        </Text>
        <InvoiceRow label="Original Bill Amount" value={booking.billAmount} />
        <InvoiceRow label="Discount" value={booking.discount} isNegative />
        <InvoiceRow label="GST" value={booking.gst} isDashed />
        <InvoiceRow label="Platform" value={booking.platformFee} isNegative isDashed />
        <InvoiceRow label="Gateway Charges" value={booking.gatewayCharges} isNegative isDashed />

        <View style={styles.separator} />

        <InvoiceRow label="EST. Payout Amount" value={booking.estPayout} isTotal />
      </View>

      {/* Payment Details Card */}
      <View style={styles.paymentCard}>
        <View style={styles.cardTitleRow}>
          <CreditCard size={ms(20)} color={COLORS.text.primary} style={styles.cardIcon} />
          <Text variant="body1" weight="bold" style={styles.cardTitle}>
            PAYMENT DETAILS
          </Text>
        </View>
        <InvoiceRow label="Method" value={booking.paymentMethod} />
        <InvoiceRow label="Transaction ID" value={booking.transactionId} />
        <InvoiceRow label="Transaction Date" value={booking.transactionDate} />
        <InvoiceRow label="Transaction Time" value={booking.transactionTime} />
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: vs(20),
    marginBottom: vs(20),
  },
  backButton: {
    marginRight: hs(10),
  },
  customerName: {
    marginLeft: hs(12),
    fontSize: fs(22),
  },
  sectionTitle: {
    textTransform: "uppercase",
    marginBottom: vs(12),
    fontSize: fs(16),
  },
  fieldsContainer: {
    gap: vs(12),
    marginBottom: vs(20),
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
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: vs(4),
  },
  labelIcon: {
    marginRight: hs(6),
  },
  labelText: {
    color: COLORS.text.primary,
  },
  valueBox: {
    backgroundColor: COLORS.surface.primary,
    borderRadius: ms(10),
    paddingHorizontal: hs(hs(10)),
    paddingVertical: vs(12),
    flexDirection: "row",
    alignItems: "center",
  },
  invoiceCard: {
    backgroundColor: COLORS.surface.primary,
    borderRadius: ms(10),
    borderWidth: 1,
    borderColor: COLORS.border.navBar,
    padding: ms(10),
    gap: vs(10),
    marginBottom: vs(20),
  },
  cardTitle: {
    textTransform: "uppercase",
    fontSize: fs(16),
    marginBottom: vs(2),
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
  dashedLabel: {
    marginBottom: -1,
  },
  negativeText: {
    color: COLORS.danger,
  },
  totalText: {
    color: "#00B562",
  },
  normalAmountText: {
    color: COLORS.text.primary,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.border.navBar,
    marginVertical: vs(4),
  },
  paymentCard: {
    padding: ms(10),
    gap: vs(10),
    marginBottom: vs(30),
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: vs(2),
  },
  cardIcon: {
    marginRight: hs(6),
  },
});

export default DineDetailsScreen;
