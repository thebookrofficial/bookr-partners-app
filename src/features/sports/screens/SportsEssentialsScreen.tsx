// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, Alert } from "react-native";
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

const EssentialActionRow = ({
  title,
  icon: Icon,
  onPress,
}: {
  title: string;
  icon: any;
  onPress: () => void;
}) => (
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

  // --- SMART ID EXTRACTION ---
  // 1. Try to get it from the local tab params
  let venueId = route.params?.serviceId;

  // 2. If undefined, climb up and grab it from the parent 'SportsServiceTabs' navigator
  if (!venueId) {
    const parentState = navigation.getParent()?.getState();
    const tabRoute = parentState?.routes.find((r: any) => r.name === "SportsServiceTabs");
    const tabParams = tabRoute?.params as any;
    // Extract from direct params or nested params object
    venueId = tabParams?.serviceId || tabParams?.params?.serviceId || "";
  }

  // State to hold the groundId
  const [activeGroundId, setActiveGroundId] = useState<string>("");

  // Fetch the first ground associated with this venue
  useEffect(() => {
    const fetchFirstGround = async () => {
      if (!venueId) return;

      try {
        const { data, error } = await supabase
          .from("sports_grounds")
          .select("id")
          .eq("venue_id", venueId)
          .order("display_order", { ascending: true })
          .limit(1)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setActiveGroundId(data.id);
        }
      } catch (err) {
        console.error("Error fetching ground:", err);
      }
    };

    fetchFirstGround();
  }, [venueId]);

  return (
    <ScreenContainer backgroundColor={COLORS.background} paddingHorizontal={hs(12)}>
      <View style={styles.headerWrapper}>
        <ServiceHeader
          title="Elite Strikers Club"
          subtitle="Essentials"
          rightComponent={
            <TouchableOpacity style={styles.editButton} activeOpacity={0.7}>
              <Text variant="body1" weight="semiBold">
                Edit
              </Text>
            </TouchableOpacity>
          }
        />
      </View>

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
            // SAFETY CHECK: Ensure we have both IDs before navigating
            if (venueId && activeGroundId) {
              navigation.navigate("BlockUnblock", {
                venueId: venueId,
                groundId: activeGroundId,
              });
            } else if (!venueId) {
              Alert.alert("Error", "Venue ID is missing. Please go back and re-enter this screen.");
            } else {
              Alert.alert(
                "No Ground Found",
                "We couldn't find a sports ground for this venue. Please make sure you have added a ground in Supabase first.",
              );
            }
          }}
        />
        <EssentialActionRow
          title="Special Days"
          icon={CalendarDays}
          // eslint-disable-next-line no-console
          onPress={() => console.log("Special Days Tapped")}
        />
        <EssentialActionRow
          title="Update Venue Info"
          icon={RefreshCw}
          // eslint-disable-next-line no-console
          onPress={() => console.log("Update Venue Tapped")}
        />
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  headerWrapper: {
    paddingTop: vs(10),
  },
  editButton: {
    backgroundColor: COLORS.surface.primary,
    paddingHorizontal: hs(16),
    paddingVertical: vs(4),
    borderRadius: ms(19),
  },
  listSection: {
    marginTop: vs(10),
    gap: vs(10),
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface.primary,
    borderRadius: ms(10),
    paddingHorizontal: hs(12),
    minHeight: vs(46),
  },
  rowTitle: {
    flex: 1,
    marginLeft: hs(10),
    fontSize: fs(14),
  },
});
