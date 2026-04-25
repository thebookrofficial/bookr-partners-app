// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { EventHomeScreenOpen } from "./EventHomeScreenOpen";
import { EventHomeScreenAssigned } from "./EventHomeScreenAssigned";
import { supabase } from "@/lib/supabase";
import { COLORS } from "@/constants/theme";
import { useNavigation, useRoute } from "@react-navigation/native";

export const EventHomeScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  // Safely resolve serviceId from params or parent navigator
  let serviceId = route.params?.serviceId;
  if (!serviceId) {
    const parentState = navigation.getParent()?.getState();
    const tabRoute = parentState?.routes.find((r: any) => r.name === "EventServiceTabs");
    const tabParams = tabRoute?.params as any;
    serviceId = tabParams?.serviceId || tabParams?.params?.serviceId || "";
  }

  const [loading, setLoading] = useState(true);
  const [eventData, setEventData] = useState<{ id: string; seating_type: string } | null>(null);

  useEffect(() => {
    const fetchBaseEvent = async () => {
      if (!serviceId) return;
      try {
        const { data, error } = await supabase
          .from("events")
          .select("id, seating_type")
          .eq("venue_id", serviceId)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (error && error.code !== "PGRST116") throw error;
        setEventData(data);
      } catch (err) {
        console.error("Error fetching base event:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBaseEvent();
  }, [serviceId]);

  if (loading) {
    return (
      <View style={styles.loadingWrapper}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!eventData) {
    // If no event found, default to Assigned (or could show empty state)
    return <EventHomeScreenAssigned eventId="" />;
  }

  if (eventData.seating_type === "open") {
    return <EventHomeScreenOpen eventId={eventData.id} />;
  }

  return <EventHomeScreenAssigned eventId={eventData.id} />;
};

const styles = StyleSheet.create({
  loadingWrapper: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
  },
});
