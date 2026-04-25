// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { Text } from "@/components/ui";
import { StaycationHeader } from "../components/StaycationHeader";
import { Ban, Ticket, RefreshCw, ChevronRight } from "lucide-react-native";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { StaycationTabParamList } from "@/navigation/navigation.types";
import { useStaycationHome } from "../hooks/useStaycationHome";

const USER_PROFILE = require("../../../assets/icons/ic-user-profile.png");

interface EssentialsItemProps {
  label: string;
  Icon: any;
  onPress: () => void;
}

const EssentialsItem = ({ label, Icon, onPress }: EssentialsItemProps) => (
  <TouchableOpacity style={styles.itemContainer} activeOpacity={0.7} onPress={onPress}>
    <View style={styles.itemLeft}>
      <Icon size={ms(20)} color={COLORS.primary} />
      <Text variant="body2" weight="bold" style={styles.itemLabel}>
        {label}
      </Text>
    </View>
    <ChevronRight size={ms(16)} color={COLORS.text.primary} />
  </TouchableOpacity>
);

export const StaycationEssentialsScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<StaycationTabParamList, "StaycationEssentials">>();

  // Extract serviceId with fallback from parent navigator
  let serviceId = route.params?.serviceId;
  if (!serviceId) {
    const parentState = navigation.getParent()?.getState();
    const tabRoute = parentState?.routes.find((r: any) => r.name === "StaycationServiceTabs");
    const tabParams = tabRoute?.params as any;
    serviceId = tabParams?.serviceId || tabParams?.params?.serviceId || "";
  }

  const { venue } = useStaycationHome(serviceId);

  const handlePress = (label: string) => {
    if (label === "Close date") {
      navigation.navigate("StaycationCloseDate", { serviceId });
    } else if (label === "Offers") {
      navigation.navigate("StaycationOffers", { serviceId });
    } else {
      // Handle other presses
    }
  };

  return (
    <ScreenContainer backgroundColor={COLORS.background} paddingHorizontal={hs(12)}>
      <StaycationHeader
        title={venue?.name || "Vally view farmhouse"}
        subtitle="Essentials"
        imageSource={venue?.cover_image_url ? { uri: venue.cover_image_url } : USER_PROFILE}
      />

      <View style={styles.listContainer}>
        <EssentialsItem label="Close date" Icon={Ban} onPress={() => handlePress("Close date")} />
        <EssentialsItem label="Offers" Icon={Ticket} onPress={() => handlePress("Offers")} />
        <EssentialsItem
          label="Update Venue Info"
          Icon={RefreshCw}
          onPress={() => handlePress("Update Venue Info")}
        />
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  listContainer: {
    gap: vs(10),
    marginTop: vs(10),
    paddingHorizontal: hs(6),
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.surface.primary,
    borderRadius: ms(10),
    padding: ms(12),
    height: vs(48),
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(8),
  },
  itemLabel: {
    color: COLORS.text.primary,
    fontSize: fs(14),
  },
});
