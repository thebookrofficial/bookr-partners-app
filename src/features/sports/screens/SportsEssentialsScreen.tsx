// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { Text } from "@/components/ui";
import { ServiceHeader } from "../components/ServiceHeader";
import { ChevronRight, Files, Ban } from "lucide-react-native";
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

  // Extract initial serviceId and category
  let venueId = route.params?.serviceId;
  let routeCategory = route.params?.category;

  if (!venueId) {
    const parentState = navigation.getParent()?.getState();
    const tabRoute = parentState?.routes.find((r: any) => r.name === "SportsServiceTabs");
    const tabParams = tabRoute?.params as any;
    venueId = tabParams?.serviceId || tabParams?.params?.serviceId || "";
    routeCategory = routeCategory || tabParams?.category || tabParams?.params?.category;
  }

  // --- UI STATES ---
  const { selectedCategories, setServiceCategory } = useServiceStore();

  const lastRouteCategory = React.useRef<string | undefined>(undefined);

  useEffect(() => {
    if (routeCategory && routeCategory !== lastRouteCategory.current) {
      lastRouteCategory.current = routeCategory;
      if (selectedCategories[venueId] !== routeCategory) {
        setServiceCategory(venueId, routeCategory);
      }
    }
  }, [routeCategory, venueId, setServiceCategory, selectedCategories]);

  const selectedCategory = selectedCategories[venueId] || routeCategory || "Football";

  // --- DYNAMIC VENUE STATES ---
  const [currentVenueId, setCurrentVenueId] = useState<string>("");
  const [activeGroundId, setActiveGroundId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const { activeVenueName } = useServiceStore();

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
          .select("id, owner_id, sports_venues(sports_type)")
          .eq("id", venueId)
          .single();
        if (!initialVenue) return;

        // Check if the initial venue itself matches the sport type
        const initialSportType = initialVenue.sports_venues?.[0]?.sports_type;
        let finalVenueId = "";

        if (initialSportType === dbSportType) {
          finalVenueId = initialVenue.id;
        } else {
          // Find Venue for Owner + Category
          const { data: matchedVenue } = await supabase
            .from("venues")
            .select("id, sports_venues!inner(sports_type)")
            .eq("owner_id", initialVenue.owner_id)
            .eq("sports_venues.sports_type", dbSportType)
            .limit(1)
            .maybeSingle();

          if (matchedVenue) finalVenueId = matchedVenue.id;
        }

        if (finalVenueId) {
          setCurrentVenueId(finalVenueId);

          // Find First Ground for this matched Venue
          const { data: groundData } = await supabase
            .from("sports_grounds")
            .select("id")
            .eq("venue_id", finalVenueId)
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
                groundId: activeGroundId,
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
