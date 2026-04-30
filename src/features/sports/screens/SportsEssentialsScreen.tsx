// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { Text } from "@/components/ui";
import { ServiceHeader } from "../components/ServiceHeader";
import { ChevronRight, Files, Ban, CalendarDays, RefreshCw } from "lucide-react-native";
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

  // Extract initial serviceId
  let venueId = route.params?.serviceId;
  if (!venueId) {
    const parentState = navigation.getParent()?.getState();
    const tabRoute = parentState?.routes.find((r: any) => r.name === "SportsServiceTabs");
    const tabParams = tabRoute?.params as any;
    venueId = tabParams?.serviceId || tabParams?.params?.serviceId || "";
  }

  // --- UI STATES ---
  const { selectedCategories, setServiceCategory } = useServiceStore();
  const selectedCategory = selectedCategories[venueId] || "Football";

  const [isCategoryOpen, setIsCategoryOpen] = useState(false);

  // --- DYNAMIC VENUE STATES ---
  const [currentVenueId, setCurrentVenueId] = useState<string>("");
  const [activeGroundId, setActiveGroundId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const resolveVenueAndGround = async () => {
      setLoading(true);
      try {
        // Map UI names to exact DB enums
        const CATEGORY_DB_MAP: Record<string, string> = {
          Football: "football",
          "Box Cricket": "box_cricket",
          Pickleball: "pickleball",
        };
        const dbSportType = CATEGORY_DB_MAP[selectedCategory] || selectedCategory;

        // Find Owner
        const { data: initialVenue } = await supabase
          .from("venues")
          .select("owner_id")
          .eq("id", venueId)
          .single();
        if (!initialVenue) return;

        // Find Venue for Owner + Category
        const { data: matchedVenue } = await supabase
          .from("venues")
          .select("id, sports_venues!inner(sports_type)")
          .eq("owner_id", initialVenue.owner_id)
          .eq("sports_venues.sports_type", dbSportType)
          .limit(1)
          .maybeSingle();

        if (matchedVenue) {
          setCurrentVenueId(matchedVenue.id);

          // Find First Ground for this matched Venue
          const { data: groundData } = await supabase
            .from("sports_grounds")
            .select("id")
            .eq("venue_id", matchedVenue.id)
            .order("display_order", { ascending: true })
            .limit(1)
            .maybeSingle();

          setActiveGroundId(groundData ? groundData.id : "");
        } else {
          // Reset if this owner doesn't have a facility for the selected sport
          setCurrentVenueId("");
          setActiveGroundId("");
        }
      } catch (err) {
        console.error("Resolution error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (venueId) resolveVenueAndGround();
  }, [venueId, selectedCategory]);

  return (
    <ScreenContainer backgroundColor={COLORS.background} paddingHorizontal={hs(12)}>
      <View style={styles.headerWrapper}>
        {/* 1. Header with Dropdown */}
        <ServiceHeader
          title="Elite Strikers Club"
          subtitle="Essentials"
          category={selectedCategory}
          onCategoryPress={() => setIsCategoryOpen(!isCategoryOpen)}
        />
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
            onPress={() => navigation.navigate("BulkBooking")}
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
            title="Offers"
            icon={CalendarDays}
            onPress={() => {
              // console.log("Special Days Tapped");
            }}
          />
          <EssentialActionRow
            title="Update Venue Info"
            icon={RefreshCw}
            onPress={() => {
              // console.log("Update Venue Tapped");
            }}
          />
        </View>
      )}

      {/* --- FIXED OVERLAY DROPDOWN --- */}
      {isCategoryOpen && (
        <View style={styles.dropdownOverlay}>
          {/* Invisible Backdrop */}
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={() => setIsCategoryOpen(false)}
          />

          {/* Menu */}
          <View style={styles.dropdownMenu}>
            {["Football", "Box Cricket", "Pickleball"].map(cat => (
              <TouchableOpacity
                key={cat}
                style={styles.dropdownItem}
                activeOpacity={0.7}
                onPress={() => {
                  setServiceCategory(venueId, cat);
                  setIsCategoryOpen(false);
                }}>
                <Text variant="body2" weight="semiBold">
                  {cat}
                </Text>
                <View style={styles.radioOuter}>
                  {selectedCategory === cat && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
            ))}
          </View>
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

  /* --- FIXED OVERLAY DROPDOWN STYLES --- */
  dropdownOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 1000, elevation: 1000 },
  dropdownMenu: {
    position: "absolute",
    top: vs(55),
    right: hs(12),
    backgroundColor: COLORS.background,
    borderRadius: ms(10),
    borderWidth: 1,
    borderColor: COLORS.border.navBar,
    width: hs(180),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    padding: hs(6),
    gap: vs(6),
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: hs(10),
    paddingVertical: vs(8),
    borderWidth: 1,
    borderColor: COLORS.border.navBar,
    borderRadius: ms(8),
  },
  radioOuter: {
    width: ms(20),
    height: ms(20),
    borderRadius: ms(10),
    borderWidth: 2,
    borderColor: COLORS.text.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  radioInner: {
    width: ms(10),
    height: ms(10),
    borderRadius: ms(5),
    backgroundColor: COLORS.text.primary,
  },
});
