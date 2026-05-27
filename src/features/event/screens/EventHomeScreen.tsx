// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet, Text } from "react-native";
import { EventHomeScreenOpen } from "./EventHomeScreenOpen";
import { EventHomeScreenAssigned } from "./EventHomeScreenAssigned";
import { supabase } from "@/lib/supabase";
import { COLORS } from "@/constants/theme";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useServiceStore } from "@/store/serviceStore";

export const EventHomeScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { setActiveVenueName } = useServiceStore();

  const [loading, setLoading] = useState(true);
  const [eventData, setEventData] = useState<{
    id: string;
    seating_type: string;
    title: string;
  } | null>(null);

  useEffect(() => {
    if (eventData?.title) {
      setActiveVenueName(eventData.title);
    }
  }, [eventData?.title, setActiveVenueName]);

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
        // Fetch ALL events for this venue to see what's going on!
        const { data, error } = await supabase
          .from("events")
          .select("id, seating_type, title, total_capacity, created_at")
          .eq("venue_id", serviceId);

        if (error) {
          console.error("EventHome: Supabase error:", error.message);
          throw error;
        }

        if (isMounted && data && data.length > 0) {
          // 1. Try to specifically find Neon Shadow first
          let selectedEvent = data.find(e => e.title.includes("Neon Shadow"));

          // 2. If not found, sort by oldest created_at (usually the main one you set up first)
          if (!selectedEvent) {
            selectedEvent = data.sort(
              (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
            )[0];
          }

          setEventData(selectedEvent);
        } else {
          setLoading(false);
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
    return (
      <View style={styles.loadingWrapper}>
        <Text style={{ color: COLORS.text.primary }}>No Events found for this service.</Text>
      </View>
    );
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
