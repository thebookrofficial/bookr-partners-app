// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { Text } from "@/components/ui";
import { ServiceHeader } from "../components/ServiceHeader";
import { ChevronRight, Files, Ban, CalendarDays, RefreshCw } from "lucide-react-native";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";

// --- NEW NAVIGATION IMPORTS ---
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MainStackParamList } from "@/navigation/navigation.types";

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
  // Initialize navigation
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();

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
          // eslint-disable-next-line no-console
          onPress={() => console.log("Bulk Booking Tapped")}
        />
        <EssentialActionRow
          title="Block / Unblock"
          icon={Ban}
          onPress={() => navigation.navigate("BlockUnblock")} // <-- UPDATED THIS LINE
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
