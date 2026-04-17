import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
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

export const VendorProfileScreen = () => {
  const [activeTab, setActiveTab] = useState(STRINGS.profile.tabs[0]);
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();

  return (
    <ScreenContainer scrollable backgroundColor={COLORS.background} paddingHorizontal={hs(12)}>
      <View style={styles.appBar}>
        <View style={styles.appBarLeft}>
          <TouchableOpacity style={styles.backBtn}>
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

      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.editBadge}
          onPress={() => navigation.navigate("EditProfile")}>
          <Text variant="body1" weight="semiBold">
            {STRINGS.profile.edit}
          </Text>
        </TouchableOpacity>
        <View style={styles.profileInfo}>
          <Avatar size={100} />
          <View style={styles.nameWrapper}>
            <Text variant="body2" weight="semiBold" style={styles.greeting}>
              {STRINGS.profile.greeting}
            </Text>
            <Text variant="body1" weight="semiBold">
              David Minter
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text variant="body1" weight="bold" style={styles.sectionTitle}>
          {STRINGS.profile.ourServices}
        </Text>
      </View>
      <PillTabs tabs={STRINGS.profile.tabs} activeTab={activeTab} onTabChange={setActiveTab} />
      <View style={styles.servicesList}>
        <ServiceCard
          title="Elite Strikers Club"
          location="Skyline Open Grounds, Kolhapur"
          image={{ uri: "https://placeholder.com/100" }}
          onPress={() =>
            navigation.navigate("SportsServiceTabs", {
              screen: "SportsHome",
              params: { serviceId: "1" },
            })
          }
        />
        <ServiceCard
          title="Spice Symphony"
          location="Rajaram puri 4th lane"
          image={{ uri: "https://placeholder.com/100" }}
        />
      </View>

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
  sectionHeader: { width: "100%", height: vs(15) },
  sectionTitle: { textTransform: "uppercase", fontWeight: "bold" },
  servicesList: { gap: vs(10) },
  actionRowBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surface.primary,
    height: vs(36),
    width: "100%",
    borderRadius: ms(10),
    gap: hs(6),
    marginBottom: vs(10),
    marginTop: vs(10),
  },
  plusSign: { marginLeft: hs(2) },
});
