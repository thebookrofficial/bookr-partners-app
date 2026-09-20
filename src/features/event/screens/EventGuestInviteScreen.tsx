// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TextInput as RNTextInput,
} from "react-native";
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { EventHeader } from "../components/EventHeader";
import { EventBookingList } from "../components/EventBookingList";
import { Plus, Search, X } from "lucide-react-native";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
import { useRoute, useNavigation, useFocusEffect } from "@react-navigation/native";
import { useEventInvites } from "../hooks/useEventInvites";

const USER_PROFILE = require("../../../assets/icons/ic-user-profile.png");

/**
 * EventGuestInviteScreen - Manage guest invitations for an event.
 * Sends WhatsApp invitations with obfuscated QR code links.
 */
export const EventGuestInviteScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const [serviceId, setServiceId] = useState<string>("");

  useFocusEffect(
    useCallback(() => {
      let id = route.params?.serviceId;
      if (!id) {
        const parentState = navigation.getParent()?.getState();
        const tabRoute = parentState?.routes.find((r: any) => r.name === "EventServiceTabs");
        const tabParams = tabRoute?.params as any;
        id = tabParams?.serviceId || tabParams?.params?.serviceId || "";
      }
      setServiceId(id || "");
    }, [route.params?.serviceId, navigation]),
  );

  const { invites, loading, eventTitle, eventImage, deleteInvite, refresh } =
    useEventInvites(serviceId);

  useFocusEffect(
    useCallback(() => {
      if (serviceId) {
        refresh();
      }
    }, [serviceId, refresh]),
  );

  const [searchQuery, setSearchQuery] = useState("");

  const handleDeleteInvite = (id: string) => {
    Alert.alert("Confirm Remove", "Are you sure you want to remove this invite?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          await deleteInvite(id);
        },
      },
    ]);
  };

  return (
    <ScreenContainer backgroundColor={COLORS.background} paddingHorizontal={hs(12)}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }>
        <View style={styles.headerWrapper}>
          <EventHeader
            title={eventTitle || ""}
            subtitle="Guest Invite"
            imageSource={eventImage ? { uri: eventImage } : USER_PROFILE}
          />
        </View>

        {/* SEARCH BAR */}
        <View style={styles.controlsContainer}>
          <View style={styles.searchBarContainer}>
            <Search size={ms(18)} color={COLORS.text.muted} />
            <RNTextInput
              style={styles.searchInput}
              placeholder="Search Name or Mobile..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={COLORS.text.muted}
              autoCapitalize="none"
            />
            {searchQuery !== "" && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <X size={ms(16)} color={COLORS.text.muted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* INVITE LIST SECTION */}
        <View style={styles.listSection}>
          {loading && invites.length === 0 ? (
            <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: vs(20) }} />
          ) : (
            <EventBookingList
              bookings={invites
                .filter(invite => {
                  if (!searchQuery.trim()) return true;
                  const q = searchQuery.toLowerCase();
                  return (
                    invite.guest_name.toLowerCase().includes(q) ||
                    (invite.guest_phone && invite.guest_phone.toLowerCase().includes(q)) ||
                    (invite.guest_email && invite.guest_email.toLowerCase().includes(q))
                  );
                })
                .map(invite => {
                  const dt = new Date(invite.created_at);
                  const dateStr = dt.toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  });
                  const timeStr = dt.toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  });
                  return {
                    id: invite.id,
                    name: invite.guest_name,
                    passType: `${invite.pass_type} x ${invite.quantity}`,
                    time: timeStr,
                    date: dateStr,
                    phone: invite.guest_phone || invite.guest_email,
                  };
                })}
              onPress={booking => handleDeleteInvite(booking.id)}
            />
          )}
        </View>

        <View style={{ height: vs(120) }} />
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() => navigation.navigate("EventAddGuestInvite", { serviceId })}>
        <Plus size={ms(24)} color={COLORS.text.inverse} />
      </TouchableOpacity>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: vs(30),
  },
  headerWrapper: {
    paddingTop: vs(10),
  },
  controlsContainer: {
    marginTop: vs(15),
    paddingHorizontal: hs(6),
  },
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F4F7FC",
    paddingHorizontal: hs(12),
    height: vs(44),
    borderRadius: ms(8),
  },
  searchInput: {
    flex: 1,
    marginLeft: hs(8),
    fontSize: fs(14),
    color: COLORS.text.primary,
    fontFamily: "Gilroy-Medium",
  },
  listSection: {
    marginTop: vs(10),
  },
  fab: {
    position: "absolute",
    bottom: vs(120),
    right: hs(6),
    width: ms(56),
    height: ms(56),
    borderRadius: ms(28),
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});
