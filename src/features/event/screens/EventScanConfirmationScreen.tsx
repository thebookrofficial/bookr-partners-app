// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { Text } from "@/components/ui";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
import { Button } from "@/components/ui/Button";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Calendar, Clock, User, Phone, Ticket } from "lucide-react-native";
import { supabase } from "@/lib/supabase";

export const EventScanConfirmationScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { attendee, isInvite } = route.params || {};

  const [isProcessing, setIsProcessing] = useState(false);

  if (!attendee) {
    return (
      <View style={styles.errorContainer}>
        <Text>No attendee data found.</Text>
        <Button title="Go Back" onPress={() => navigation.goBack()} />
      </View>
    );
  }

  const handleConfirmEntry = async () => {
    setIsProcessing(true);
    try {
      if (isInvite) {
        await supabase
          .from("event_guest_invites")
          .update({ status: "completed" })
          .eq("id", attendee.id);
      } else {
        await supabase
          .from("event_bookings")
          .update({ booking_status: "completed" })
          .eq("id", attendee.id);
      }
      
      Alert.alert("Success", "Entry confirmed successfully.");
      navigation.goBack();
    } catch (err) {
      console.error("Check-in error:", err);
      Alert.alert("Error", "Failed to confirm entry.");
    } finally {
      setIsProcessing(false);
    }
  };

  const InfoRow = ({ label, value, icon: Icon, fullWidth = true }: any) => (
    <View style={[styles.infoColumn, !fullWidth && { flex: 1 }]}>
      <View style={styles.labelRow}>
        <Icon size={ms(20)} color={COLORS.primary} />
        <Text variant="body2" weight="medium" style={styles.labelText}>
          {label}
        </Text>
      </View>
      <View style={styles.valueBox}>
        <Text 
            weight="semiBold" 
            style={[
                styles.valueText, 
                label === "Pass Type" && { color: COLORS.primary }
            ]}
        >
          {value}
        </Text>
      </View>
    </View>
  );

  return (
    <ScreenContainer backgroundColor={COLORS.background} paddingHorizontal={hs(16)}>
      <View style={styles.header}>
        <Text variant="h3" weight="bold" style={styles.headerTitle}>
          ENTRY CONFIRMATION
        </Text>
      </View>

      <View style={styles.content}>
        <InfoRow 
            label="Pass Type" 
            value={attendee.ticketType || attendee.categoryName} 
            icon={Ticket} 
        />

        <View style={styles.row}>
          <InfoRow 
            label="Date" 
            value={new Date(attendee.created_at || Date.now()).toLocaleDateString("en-GB")} 
            icon={Calendar} 
            fullWidth={false} 
          />
          <InfoRow 
            label="Time / Slot Time" 
            value={attendee.time || "8 PM"} 
            icon={Clock} 
            fullWidth={false} 
          />
        </View>

        <InfoRow 
            label="Name" 
            value={attendee.name || attendee.guest_name} 
            icon={User} 
        />
        <InfoRow 
            label="Mobile No" 
            value={attendee.phone || attendee.guest_phone} 
            icon={Phone} 
        />
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          disabled={isProcessing}>
          <Text style={styles.cancelText}>CANCEL</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={handleConfirmEntry}
          disabled={isProcessing}>
          {isProcessing ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.confirmText}>CONFIRM ENTRY</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  header: {
    marginTop: vs(20),
    marginBottom: vs(20),
    paddingHorizontal: hs(6),
  },
  headerTitle: {
    fontSize: fs(16),
    color: COLORS.text.primary,
    textTransform: "uppercase",
  },
  content: {
    gap: vs(16),
  },
  row: {
    flexDirection: "row",
    gap: hs(20),
  },
  infoColumn: {
    gap: vs(6),
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(6),
  },
  labelText: {
    fontSize: fs(14),
    color: COLORS.text.primary,
    textTransform: "capitalize",
  },
  valueBox: {
    backgroundColor: COLORS.surface.primary,
    borderRadius: ms(10),
    paddingHorizontal: hs(10),
    paddingVertical: vs(12),
    minHeight: vs(45),
    justifyContent: "center",
  },
  valueText: {
    fontSize: fs(14),
    color: COLORS.text.primary,
  },
  footer: {
    flexDirection: "row",
    gap: hs(10),
    marginTop: "auto",
    marginBottom: vs(30),
  },
  cancelButton: {
    flex: 1,
    height: vs(45),
    borderWidth: 1,
    borderColor: COLORS.border.navBar,
    borderRadius: ms(10),
    justifyContent: "center",
    alignItems: "center",
  },
  cancelText: {
    fontSize: fs(20),
    color: COLORS.text.primary,
    fontFamily: "Bison-Bold",
  },
  confirmButton: {
    flex: 1,
    height: vs(45),
    backgroundColor: "#000",
    borderRadius: ms(10),
    justifyContent: "center",
    alignItems: "center",
  },
  confirmText: {
    fontSize: fs(20),
    color: COLORS.text.inverse,
    fontFamily: "Bison-Bold",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: vs(10),
  },
});
