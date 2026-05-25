// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState, useEffect, useCallback } from "react";
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
  const [isLoading, setIsLoading] = useState(true);
  const [details, setDetails] = useState<any>(null);

  const fetchBookingDetails = useCallback(async () => {
    if (!attendee?.id) return;
    try {
      setIsLoading(true);
      if (isInvite) {
        const { data, error } = await supabase
          .from("event_guest_invites")
          .select("*")
          .eq("id", attendee.id)
          .single();

        if (error) throw error;
        setDetails({
          ...data,
          displayName: data.guest_name || "Guest",
          displayPhone: data.guest_phone || "N/A",
          displayPassType: data.pass_type || "GUEST INVITE",
          displayTime: "8 PM", // Default or fetch from event
        });
      } else {
        const { data, error } = await supabase
          .from("event_bookings")
          .select(
            `
            *,
            profiles (full_name, phone, avatar_url),
            event_passes (name),
            event_zones (zone_name)
          `,
          )
          .eq("id", attendee.id)
          .single();

        if (error) throw error;

        const profile = Array.isArray(data.profiles) ? data.profiles[0] : data.profiles;
        const pass = Array.isArray(data.event_passes) ? data.event_passes[0] : data.event_passes;
        const zone = Array.isArray(data.event_zones) ? data.event_zones[0] : data.event_zones;
        const catName = pass?.name || zone?.zone_name || "General";

        setDetails({
          ...data,
          displayName: data.guest_name || profile?.full_name || "Guest User",
          displayPhone: data.guest_phone || profile?.phone || "N/A",
          displayPassType: `${catName} x ${data.ticket_count}`,
          displayTime: "8 PM", // Default or fetch from event
        });
      }
    } catch (err) {
      console.error("DEBUG: Fetch details error:", err);
      Alert.alert("Error", "Failed to fetch booking details.");
    } finally {
      setIsLoading(false);
    }
  }, [attendee?.id, isInvite]);

  useEffect(() => {
    fetchBookingDetails();
  }, [fetchBookingDetails]);

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
      let error;
      let data;
      const now = new Date().toISOString();

      if (isInvite) {
        // Use "completed" as the definitive status
        const { data: updateData, error: updateErr } = await supabase
          .from("event_guest_invites")
          .update({
            status: "completed",
          })
          .eq("id", attendee.id)
          .select();
        error = updateErr;
        data = updateData;
      } else {
        // Use "completed" as the definitive booking_status
        const { data: updateData, error: updateErr } = await supabase
          .from("event_bookings")
          .update({
            booking_status: "completed",
            updated_at: now,
          } as any)
          .eq("id", attendee.id)
          .select();
        error = updateErr;
        data = updateData;
      }

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        Alert.alert(
          "Update Failed",
          "The database accepted the request but no changes were made. This usually means you don't have permission to update this record (RLS).",
        );
        return;
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
          style={[styles.valueText, label === "Pass Type" && { color: COLORS.primary }]}>
          {value}
        </Text>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <ScreenContainer backgroundColor={COLORS.background}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={{ marginTop: vs(10) }}>Fetching Details...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer backgroundColor={COLORS.background} paddingHorizontal={hs(16)}>
      <View style={styles.header}>
        <Text variant="h3" weight="bold" style={styles.headerTitle}>
          ENTRY CONFIRMATION
        </Text>
      </View>

      <View style={styles.content}>
        <InfoRow label="Pass Type" value={details?.displayPassType} icon={Ticket} />

        <View style={styles.row}>
          <InfoRow
            label="Date"
            value={new Date(details?.created_at || Date.now()).toLocaleDateString("en-GB")}
            icon={Calendar}
            fullWidth={false}
          />
          <InfoRow
            label="Time / Slot Time"
            value={details?.displayTime}
            icon={Clock}
            fullWidth={false}
          />
        </View>

        <InfoRow label="Name" value={details?.displayName} icon={User} />
        <InfoRow label="Mobile No" value={details?.displayPhone} icon={Phone} />
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
