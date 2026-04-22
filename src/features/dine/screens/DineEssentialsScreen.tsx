// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { Text } from "@/components/ui";
import { ServiceHeader } from "@/features/sports/components/ServiceHeader";
import { Ban, Ticket, RefreshCw, ChevronRight } from "lucide-react-native";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import { DineTabParamList } from "@/navigation/navigation.types";
import { useDineHome } from "../hooks/useDineHome";

const USER_PROFILE = require("../../../assets/icons/ic-user-profile.png");

/**
 * EssentialActionRow - Standardized row component for Dine Essentials.
 * Matches Figma frame 6:80993.
 */
const EssentialActionRow = ({ title, icon: Icon, onPress }: any) => (
  <TouchableOpacity style={styles.actionRow} onPress={onPress} activeOpacity={0.7}>
    <Icon size={ms(20)} color={COLORS.primary} />
    <View style={styles.titleContainer}>
      <Text variant="body2" weight="bold" style={styles.rowTitle}>
        {title}
      </Text>
    </View>
    <ChevronRight size={ms(16)} color={COLORS.text.primary} />
  </TouchableOpacity>
);

/**
 * DineEssentialsScreen - Quick access to Dine management features.
 * Matches Figma frame 6:80960.
 */
export const DineEssentialsScreen = () => {
  const route = useRoute<RouteProp<DineTabParamList, "DineEssentials">>();
  const navigation = useNavigation<any>();

  // Safely resolve serviceId from params or parent navigator
  let serviceId = route.params?.serviceId;
  if (!serviceId) {
    const parentState = navigation.getParent()?.getState();
    const tabRoute = parentState?.routes.find((r: any) => r.name === "DineServiceTabs");
    const tabParams = tabRoute?.params as any;
    serviceId = tabParams?.serviceId || tabParams?.params?.serviceId || "";
  }

  const { venue } = useDineHome(serviceId);

  return (
    <ScreenContainer backgroundColor={COLORS.background} paddingHorizontal={hs(12)}>
      <View style={styles.headerWrapper}>
        <ServiceHeader
          title={venue?.name || "Hotel tikka lab"}
          subtitle="Essentials"
          imageSource={venue?.cover_image_url ? { uri: venue.cover_image_url } : USER_PROFILE}
        />
      </View>

      <View style={styles.listSection}>
        <EssentialActionRow
          title="Close date"
          icon={Ban}
          onPress={() => {
            navigation.navigate("DineCloseDate", { serviceId });
          }}
        />
        <EssentialActionRow
          title="Offers"
          icon={Ticket}
          onPress={() => {
            navigation.navigate("DineOffers", { serviceId });
          }}
        />
        <EssentialActionRow
          title="Update Venue Info"
          icon={RefreshCw}
          onPress={() => {
            // navigation.navigate("UpdateDineVenue", { serviceId });
          }}
        />
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  headerWrapper: {
    paddingTop: vs(10),
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
  titleContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  rowTitle: {
    fontSize: fs(14),
    color: COLORS.text.primary,
    textAlign: "left",
    width: "100%",
    paddingLeft: hs(6),
  },
});
