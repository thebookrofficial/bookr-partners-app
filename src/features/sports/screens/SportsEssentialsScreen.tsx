// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { Text } from "@/components/ui";
import { ServiceHeader } from "../components/ServiceHeader";
import { ChevronRight, Files, Ban, Banknote, HelpCircle } from "lucide-react-native";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";

// --- NAVIGATION & DATA IMPORTS ---
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MainStackParamList, SportsTabParamList } from "@/navigation/navigation.types";
import { supabase } from "@/lib/supabase";

import { useServiceStore } from "@/store/serviceStore";

const EssentialActionRow = ({ title, icon: Icon, onPress }: any) => (
  <TouchableOpacity style={styles.actionRow} onPress={onPress} activeOpacity={0.7}>
    <Icon size={ms(20)} color={COLORS.primary} />
    <Text variant="body2" weight="bold" style={styles.rowTitle}>
      {title}
    </Text>
    <ChevronRight size={ms(20)} color={COLORS.text.primary} />
  </TouchableOpacity>
);

export const SportsEssentialsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const route = useRoute<RouteProp<SportsTabParamList, "SportsEssentials">>();

  const { selectedCategories, setServiceCategory, activeServiceId } = useServiceStore();

  // 1. Get Venue ID (Priority: Route -> Store)
  const venueId = route.params?.serviceId || activeServiceId;

  // 2. Get Category (Priority: Route -> Store)
  const routeCategory = route.params?.category;
  const storedCategory = selectedCategories[venueId];
  const selectedCategory = routeCategory || storedCategory || "Football";

  // Sync route param with store if we arrived via a deep link or specific tab click
  useEffect(() => {
    if (routeCategory && routeCategory !== storedCategory) {
      setServiceCategory(venueId, routeCategory);
    }
  }, [routeCategory, venueId, storedCategory, setServiceCategory]);

  // --- DYNAMIC VENUE STATES ---
  const [currentVenueId, setCurrentVenueId] = useState<string>("");
  const [activeGroundId, setActiveGroundId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const { activeVenueName } = useServiceStore();

  useEffect(() => {
    const resolveVenueAndGround = async () => {
      setLoading(true);
      try {
        // STRICTLY use the exact venueId from the store/route. No switching!
        setCurrentVenueId(venueId);

        // Fetch just the first ground to have as a fallback reference
        const { data: groundData } = await supabase
          .from("sports_grounds")
          .select("id")
          .eq("venue_id", venueId)
          .order("display_order", { ascending: true })
          .limit(1)
          .maybeSingle();

        setActiveGroundId(groundData ? groundData.id : "");
      } catch (err) {
        console.error("Resolution error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (venueId) resolveVenueAndGround();
  }, [venueId]);

  return (
    <ScreenContainer backgroundColor={COLORS.background} paddingHorizontal={hs(12)}>
      <View style={styles.headerWrapper}>
        {/* 1. Header with Dropdown */}
        <ServiceHeader title={activeVenueName} subtitle="Essentials" />
      </View>

      {/* 2. Conditional Rendering for Content */}
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
      ) : !currentVenueId ? (
        <Text style={styles.emptyStateText}>
          No {selectedCategory} facility setup for this club.
        </Text>
      ) : (
        <View style={styles.listSection}>
          <EssentialActionRow
            title="Bulk Booking"
            icon={Files}
            onPress={() =>
              navigation.navigate("BulkBooking", {
                venueId: currentVenueId,
              })
            }
          />
          <EssentialActionRow
            title="Block / Unblock"
            icon={Ban}
            onPress={() => {
              if (currentVenueId && activeGroundId) {
                navigation.navigate("BlockUnblock", {
                  venueId: currentVenueId,
                  groundId: activeGroundId,
                });
              } else if (!currentVenueId) {
                Alert.alert(
                  "Error",
                  "Venue ID is missing. Please go back and re-enter this screen.",
                );
              } else {
                Alert.alert("No Ground Found", "We couldn't find a sports ground for this venue.");
              }
            }}
          />
          <EssentialActionRow
            title="Payouts"
            icon={Banknote}
            onPress={() =>
              navigation.navigate("Payouts", {
                venueId: currentVenueId,
              })
            }
          />
          <EssentialActionRow
            title="FAQ's"
            icon={HelpCircle}
            onPress={() => navigation.navigate("FAQ", { vertical: "sports" })}
          />
          {/* 
          <EssentialActionRow title="Offers" icon={CalendarDays} onPress={() => {}} />
          <EssentialActionRow title="Update Venue Info" icon={RefreshCw} onPress={() => {}} /> 
          */}
        </View>
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  headerWrapper: { paddingTop: vs(10) },
  listSection: { marginTop: vs(10), gap: vs(10) },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface.primary,
    borderRadius: ms(10),
    paddingHorizontal: hs(12),
    minHeight: vs(46),
  },
  rowTitle: { flex: 1, marginLeft: hs(10), fontSize: fs(14) },

  loader: { marginTop: vs(60) },
  emptyStateText: { textAlign: "center", marginTop: vs(60), color: COLORS.text.muted },
});
