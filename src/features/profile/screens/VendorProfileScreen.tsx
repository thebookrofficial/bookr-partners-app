// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState, useMemo } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { Text, Avatar, PillTabs, ListSkeleton } from "@/components/ui";
import { ServiceCard } from "../components/ServiceCard";
import { Settings } from "lucide-react-native";
import { vs, hs, ms } from "@/utils/responsive.utils";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MainStackParamList } from "@/navigation/navigation.types";
import { COLORS } from "@/constants/theme";
import { STRINGS } from "@/constants/strings";
import { useAuthStore, useServiceStore } from "@/store";
import { useVendorData } from "../hooks/useVendorData";
import { StaffInvitePopup } from "../components/StaffInvitePopup";

export const VendorProfileScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { user, clientProfile } = useAuthStore();
  const { loading, venues, refresh } = useVendorData();
  const { setLastSelectedService, setTabBarVisible } = useServiceStore();

  useFocusEffect(
    React.useCallback(() => {
      if (clientProfile?.client_role !== "owner") {
        setTabBarVisible(false);
        return () => setTabBarVisible(true);
      }
    }, [setTabBarVisible, clientProfile?.client_role]),
  );

  // Helper to determine the first permitted screen for a given vertical
  const getTargetScreen = (vertical: string): any => {
    const isOwner = clientProfile?.client_role === "owner";
    const perms = clientProfile?.permissions || [];
    const has = (p: string) => isOwner || perms.includes(p);

    if (vertical === "events") {
      if (has("events:bookings")) return "EventHome";
      if (has("events:scan_page")) return "EventScan";
      if (has("events:guest_invite")) return "EventGuestInvite";
      if (has("events:spot_entry")) return "EventSpotEntry";
      return "EventProfile";
    }
    if (vertical === "staycation") {
      if (has("staycation:View Staycation Home")) return "StaycationHome";
      if (has("staycation:View Staycation History")) return "StaycationHistory";
      if (isOwner) return "StaycationDashboard";
      if (isOwner) return "StaycationEssentials";
      return "StaycationProfile";
    }
    if (vertical === "sports") {
      if (has("sports:View Sports Home")) return "SportsHome";
      if (has("sports:View Sports History")) return "SportsHistory";
      if (isOwner) return "SportsDashboard";
      if (isOwner || has("sports:Manage Bulk Bookings") || has("sports:Block / Unblock Slots"))
        return "SportsEssentials";
      return "SportsProfile";
    }
    if (vertical === "dining") {
      return "DineHome";
    }
    return "VendorProfile";
  };

  const [activeTab, setActiveTab] = useState(STRINGS.profile.tabs[0]);

  const availableTabs = useMemo(() => {
    const allTabs = STRINGS.profile.tabs;
    if (venues.length === 0) return [allTabs[0]];

    const activeVerticals = new Set(venues.map(v => v.vertical.toLowerCase()));

    return allTabs.filter((tab, index) => {
      if (index === 0) return true;

      const tabKey = tab.toLowerCase();
      return (
        activeVerticals.has(tabKey) ||
        activeVerticals.has(tabKey.replace(/s$/, "")) ||
        (tabKey === "dining" && activeVerticals.has("dining"))
      );
    });
  }, [venues]);

  // --- PERFORMANCE TRACKING ---
  React.useEffect(() => {
    if (!loading) {
      if ((globalThis as any).otpSubmitTime) {
        const loadTime = ((Date.now() - (globalThis as any).otpSubmitTime) / 1000).toFixed(2);
        console.warn(
          `[PERFORMANCE] Loaded VendorProfileScreen from OTP Submit in ${loadTime} seconds`,
        );
        delete (globalThis as any).otpSubmitTime;
      }
    }
  }, [loading]);
  // ----------------------------

  React.useEffect(() => {
    if (!availableTabs.includes(activeTab)) {
      setActiveTab(availableTabs[0]);
    }
  }, [availableTabs, activeTab]);

  const filteredVenues = useMemo(() => {
    if (activeTab === "All Venues" || activeTab === "All Services") return venues;

    return venues.filter(venue => {
      const tabKey = activeTab.toLowerCase();
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
      refreshing={loading && venues.length > 0}
      onRefresh={refresh}>
      <StaffInvitePopup onRefresh={refresh} />
      <View style={styles.appBar}>
        <View style={styles.appBarLeft}>
          <Text variant="h3" weight="bold">
            {STRINGS.profile.title}
          </Text>
        </View>
        <View style={styles.appBarRight}>
          {/* <TouchableOpacity style={styles.iconBtn}>
            <Bell size={ms(24)} color={COLORS.text.primary} />
          </TouchableOpacity> */}
          <TouchableOpacity
            testID="settings-button"
            style={styles.iconBtn}
            onPress={() => navigation.navigate("Settings")}>
            <Settings size={ms(24)} color={COLORS.text.primary} />
          </TouchableOpacity>
        </View>
      </View>

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
              {clientProfile?.client_role === "staff" ? "Hello, Staff" : STRINGS.profile.greeting}
            </Text>
            <Text variant="body1" weight="semiBold">
              {clientProfile?.business_name || user?.user_metadata?.full_name || "Bookr Partner"}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text variant="body1" weight="bold" style={styles.sectionTitle}>
          {STRINGS.profile.ourServices}
        </Text>
      </View>

      <PillTabs tabs={availableTabs} activeTab={activeTab} onTabChange={setActiveTab} />

      <View style={styles.servicesList}>
        {loading && venues.length === 0 ? (
          <View style={styles.loaderContainer}>
            <ListSkeleton count={4} />
          </View>
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
                const baseService = { vertical: venue.vertical, serviceId: venue.id };
                if (venue.vertical === "sports") {
                  // CRITICAL FIX: Handle Supabase returning an object instead of an array
                  const sportsData: any = venue.sports_venues;
                  const sportsType = Array.isArray(sportsData)
                    ? sportsData[0]?.sports_type
                    : sportsData?.sports_type;

                  const categoryMap: Record<string, string> = {
                    football: "Football",
                    box_cricket: "Box Cricket",
                    pickleball: "Pickleball",
                    cricket: "Cricket",
                  };

                  const category = sportsType ? categoryMap[sportsType] || sportsType : undefined;

                  const targetScreen = getTargetScreen(venue.vertical);
                  setLastSelectedService({ ...baseService, category });
                  navigation.navigate("SportsServiceTabs", {
                    screen: targetScreen,
                    params: { serviceId: venue.id, category },
                  });
                } else if (venue.vertical === "dining") {
                  const targetScreen = getTargetScreen(venue.vertical);
                  setLastSelectedService(baseService);
                  navigation.navigate("DineServiceTabs", {
                    screen: targetScreen,
                    params: { serviceId: venue.id },
                  });
                } else if (venue.vertical === "staycation") {
                  const targetScreen = getTargetScreen(venue.vertical);
                  setLastSelectedService(baseService);
                  navigation.navigate("StaycationServiceTabs", {
                    screen: targetScreen,
                    params: { serviceId: venue.id },
                  });
                } else if (venue.vertical === "events") {
                  const targetScreen = getTargetScreen(venue.vertical);
                  setLastSelectedService(baseService);
                  navigation.navigate("EventServiceTabs", {
                    screen: targetScreen,
                    params: { serviceId: venue.id },
                  });
                } else if (venue.vertical === "profile") {
                  navigation.navigate("VendorProfile");
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

      <View style={{ height: vs(100) }} />
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
  loaderContainer: {
    marginTop: vs(20),
  },
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
