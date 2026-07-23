// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useMemo, useEffect } from "react";
import { StyleSheet, View, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { Text, StaycationSkeleton } from "@/components/ui";
import { hs, vs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
import { useStaycationHome } from "../hooks/useStaycationHome";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { StaycationTabParamList } from "@/navigation/navigation.types";
import { StaycationFarmhouseContent } from "../components/StaycationFarmhouseContent";
import { StaycationResortContent } from "../components/StaycationResortContent";
import { useServiceStore } from "@/store/serviceStore";

export const StaycationHomeScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<StaycationTabParamList, "StaycationHome">>();
  const { setActiveVenueName } = useServiceStore();

  let initialServiceId = route.params?.serviceId;
  if (!initialServiceId) {
    const parentState = navigation.getParent()?.getState();
    const tabRoute = parentState?.routes.find((r: any) => r.name === "StaycationServiceTabs");
    const tabParams = tabRoute?.params as any;
    initialServiceId = tabParams?.serviceId || tabParams?.params?.serviceId || "";
  }

  const { isLoading, venues, activeVenue, refetch } = useStaycationHome(initialServiceId);

  useEffect(() => {
    if (activeVenue?.name) {
      setActiveVenueName(activeVenue.name);
    }
  }, [activeVenue?.name, setActiveVenueName]);

  const isFarmhouseLayout = useMemo(
    () =>
      activeVenue?.property_type === "farmhouse" && activeVenue?.booking_type === "full_property",
    [activeVenue],
  );

  return (
    <View style={styles.root}>
      <ScreenContainer
        scrollable={false}
        backgroundColor={COLORS.background}
        paddingHorizontal={hs(12)}>
        {isLoading && venues.length === 0 ? (
          <View style={{ flex: 1 }}>
            <StaycationSkeleton />
          </View>
        ) : venues.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text weight="semiBold" style={styles.emptyText}>
              No staycation configurations found for this venue.
            </Text>
            <TouchableOpacity style={styles.refreshButton} onPress={() => refetch()}>
              <Text weight="bold" color={COLORS.primary}>
                Tap to retry
              </Text>
            </TouchableOpacity>
          </View>
        ) : isFarmhouseLayout ? (
          <StaycationFarmhouseContent initialVenueId={activeVenue?.id} />
        ) : (
          <StaycationResortContent initialVenueId={activeVenue?.id} />
        )}
      </ScreenContainer>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: vs(100),
  },
  emptyContainer: {
    padding: hs(32),
    alignItems: "center",
    marginTop: vs(20),
  },
  emptyText: {
    color: COLORS.text.muted,
    fontFamily: "Gilroy-Medium",
    textAlign: "center",
  },
  refreshButton: {
    marginTop: vs(12),
    paddingVertical: vs(8),
    paddingHorizontal: hs(16),
  },
});
