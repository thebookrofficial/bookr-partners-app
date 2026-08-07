// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React from "react";
import { View, StyleSheet } from "react-native";
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { hs, vs, ms } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
import { EventHeader } from "../components/EventHeader";
import { EventActionRow } from "../components/EventActionRow";
import {
  Star,
  //  RotateCcw
} from "lucide-react-native";
import { useNavigation, useRoute } from "@react-navigation/native";

const USER_PROFILE = require("../../../assets/icons/ic-user-profile.png");

export const EventEssentialsScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  // Safely resolve serviceId from params or parent navigator
  let serviceId = route.params?.serviceId;
  if (!serviceId) {
    const parentState = navigation.getParent()?.getState();
    const tabRoute = parentState?.routes.find((r: any) => r.name === "EventServiceTabs");
    const tabParams = tabRoute?.params as any;
    // Checks for direct params or nested params from navigate stack
    serviceId = tabParams?.serviceId || tabParams?.params?.serviceId || "";
  }

  return (
    <View style={styles.root}>
      <ScreenContainer scrollable backgroundColor={COLORS.background} paddingHorizontal={hs(12)}>
        {/* 1. Header */}
        <EventHeader
          title="Neon Shadow World Tour 2026"
          subtitle="Essentials"
          imageSource={USER_PROFILE}
        />

        {/* 2. Essentials List */}
        <View style={styles.listContainer}>
          <EventActionRow
            icon={<Star size={ms(20)} color={COLORS.primary} />}
            label="Guest Invite"
            onPress={() => navigation.navigate("EventGuestInvite", { serviceId })}
          />
          {/* <EventActionRow
            icon={<RotateCcw size={ms(20)} color={COLORS.primary} />}
            label="Update Venue Info"
            onPress={() => {}}
          /> */}
        </View>
        <View style={{ height: vs(100) }} />
      </ScreenContainer>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContainer: {
    gap: vs(10),
    padding: ms(6),
  },
});
