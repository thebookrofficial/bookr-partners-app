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

  const [loading, setLoading] = useState(true);
  const [eventData, setEventData] = useState<{ id: string; seating_type: string } | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchBaseEvent = async () => {
      // 1. Resolve serviceId
      let serviceId = route.params?.serviceId;
      if (!serviceId) {
        try {
          const parentState = navigation.getParent()?.getState();
          const currentRoute = parentState?.routes[parentState.index];
          serviceId = currentRoute?.params?.serviceId;

          if (!serviceId) {
            // Fallback: look for EventServiceTabs specifically
            const tabRoute = parentState?.routes.find((r: any) => r.name === "EventServiceTabs");
            const tabParams = tabRoute?.params as any;
            serviceId = tabParams?.serviceId || tabParams?.params?.serviceId;
          }
        } catch (e) {
          console.warn("EventHome: Failed to resolve serviceId from parent state", e);
        }
      }

      if (!isMounted) return;

      if (!serviceId) {
        console.warn("EventHome: No serviceId found, stopping loading.");
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("events")
          .select("id, seating_type")
          .eq("venue_id", serviceId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error("EventHome: Supabase error:", error.message);
          throw error;
        }

        if (isMounted) {
          setEventData(data);
        }
      } catch (err) {
        console.error("EventHome: Error fetching base event:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchBaseEvent();

    return () => {
      isMounted = false;
    };
  }, [route.params?.serviceId, navigation]);

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
