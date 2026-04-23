// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState, useMemo } from "react";
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { Text, Avatar, PillTabs } from "@/components/ui";
import { ServiceCard } from "../components/ServiceCard";
import { StaffCard } from "../components/StaffCard";
import { ArrowLeft, Bell, Settings, Contact, Plus } from "lucide-react-native";
import { vs, hs, ms } from "@/utils/responsive.utils";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MainStackParamList } from "@/navigation/navigation.types";
import { COLORS } from "@/constants/theme";
import { STRINGS } from "@/constants/strings";
import { useAuthStore } from "@/store";
import { useVendorData } from "../hooks/useVendorData";

export const VendorProfileScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { user, clientProfile } = useAuthStore();
  const { loading, venues, refresh } = useVendorData();

  // Set initial tab based on Blueprint standardized naming [cite: 237]
  const [activeTab, setActiveTab] = useState(STRINGS.profile.tabs[0]);

  /**
   * Filter venues based on the selected PillTab.
   * Standardizes comparison between UI labels and DB vertical_type enums.
   */
  const filteredVenues = useMemo(() => {
    if (activeTab === "All Venues" || activeTab === "All Services") return venues;

    return venues.filter(venue => {
      const tabKey = activeTab.toLowerCase();
      // Logic to handle plural UI tabs vs singular DB enum values (e.g., 'Sports' -> 'sports')
      return (
        venue.vertical.toLowerCase() === tabKey ||
        venue.vertical.toLowerCase() === tabKey.replace(/s$/, "")
      );
    });
  }, [activeTab, venues]);

  return (
    <ScreenContainer
      scrollable
      backgroundColor={COLORS.background}
      paddingHorizontal={hs(12)}
      refreshing={loading}
      onRefresh={refresh}>
      {/* 1. App Bar - Branding & Global Actions */}
      <View style={styles.appBar}>
        <View style={styles.appBarLeft}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <ArrowLeft size={ms(20)} color={COLORS.text.primary} />
          </TouchableOpacity>
          <Text variant="h3" weight="bold">
            {STRINGS.profile.title}
          </Text>
        </View>
        <View style={styles.appBarRight}>
          <TouchableOpacity style={styles.iconBtn}>
            <Bell size={ms(24)} color={COLORS.text.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate("Settings")}>
            <Settings size={ms(24)} color={COLORS.text.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Vendor Identity Header - Aligned with client_profiles  */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.editBadge}
          onPress={() => navigation.navigate("EditProfile")}>
          <Text variant="body1" weight="semiBold">
            {STRINGS.profile.edit}
          </Text>
        </TouchableOpacity>
        <View style={styles.profileInfo}>
          <Avatar
            size={100}
            source={
              user?.user_metadata?.avatar_url ? { uri: user.user_metadata.avatar_url } : undefined
            }
          />
          <View style={styles.nameWrapper}>
            <Text variant="body2" weight="semiBold" style={styles.greeting}>
              {STRINGS.profile.greeting}
            </Text>
            <Text variant="body1" weight="semiBold">
              {clientProfile?.business_name || user?.user_metadata?.full_name || "Bookr Partner"}
            </Text>
          </View>
        </View>
      </View>

      {/* 3. Venue Management Section  */}
      <View style={styles.sectionHeader}>
        <Text variant="body1" weight="bold" style={styles.sectionTitle}>
          {STRINGS.profile.ourServices}
        </Text>
      </View>

      <PillTabs tabs={STRINGS.profile.tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      <View style={styles.servicesList}>
        {loading ? (
          <ActivityIndicator color={COLORS.primary} style={styles.loader} />
        ) : filteredVenues.length > 0 ? (
          filteredVenues.map(venue => (
            <ServiceCard
              key={venue.id}
              title={venue.name}
              location={venue.address_line}
              image={
                venue.cover_image_url
                  ? { uri: venue.cover_image_url }
                  : { uri: "https://via.placeholder.com/150" }
              }
              onPress={() => {
                if (venue.vertical === "sports") {
                  navigation.navigate("SportsServiceTabs", {
                    screen: "SportsHome",
                    params: { serviceId: venue.id },
                  });
                } else if (venue.vertical === "dining") {
                  navigation.navigate("DineServiceTabs", {
                    screen: "DineHome",
                    params: { serviceId: venue.id },
                  });
                } else if (venue.vertical === "staycation") {
                  navigation.navigate("StaycationServiceTabs", {
                    screen: "StaycationHome",
                    params: { serviceId: venue.id },
                  });
                }
              }}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text variant="body2" color={COLORS.text.muted}>
              No venues found for "{activeTab}".
            </Text>
          </View>
        )}
      </View>

      {/* 4. Staff Management Section [cite: 58] */}
      <View style={styles.sectionHeader}>
        <Text variant="body1" weight="bold" style={styles.sectionTitle}>
          {STRINGS.profile.yourStaff}
        </Text>
      </View>
      <TouchableOpacity style={styles.actionRowBtn} onPress={() => navigation.navigate("AddStaff")}>
        <Contact size={ms(24)} color={COLORS.primary} />
        <Text variant="body2" weight="bold">
          {STRINGS.profile.addStaff}
        </Text>
        <Plus size={ms(17)} color={COLORS.text.primary} style={styles.plusSign} />
      </TouchableOpacity>

      {/* Note: In Phase 7, we will map these from the database as well */}
      <StaffCard name="Talia Mar" role="Restaurant" type="Manager" />
      <StaffCard name="Rohit Sharma" role="Turf" type="Employee" />

      <View style={{ height: vs(40) }} />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  appBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: vs(37),
    marginTop: vs(6),
    marginBottom: vs(10),
  },
  appBarLeft: { flexDirection: "row", alignItems: "center", gap: hs(10) },
  backBtn: { justifyContent: "center", alignItems: "center" },
  appBarRight: { flexDirection: "row", gap: hs(10) },
  iconBtn: { justifyContent: "center", alignItems: "center" },
  headerContainer: {
    width: "100%",
    height: vs(153),
    justifyContent: "center",
    alignItems: "center",
  },
  editBadge: {
    position: "absolute",
    right: 0,
    top: 0,
    backgroundColor: COLORS.surface.primary,
    paddingHorizontal: hs(6),
    paddingVertical: vs(4),
    borderRadius: ms(19),
    zIndex: 10,
  },
  profileInfo: { alignItems: "center" },
  nameWrapper: { alignItems: "center" },
  greeting: { marginTop: vs(6) },
  sectionHeader: { width: "100%", height: vs(25), justifyContent: "center" },
  sectionTitle: { textTransform: "uppercase", fontWeight: "bold" },
  servicesList: { gap: vs(10), minHeight: vs(100) },
  loader: { marginTop: vs(20) },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: vs(20),
  },
  actionRowBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surface.primary,
    height: vs(44),
    width: "100%",
    borderRadius: ms(10),
    gap: hs(6),
    marginBottom: vs(10),
    marginTop: vs(10),
  },
  plusSign: { marginLeft: hs(2) },
});
