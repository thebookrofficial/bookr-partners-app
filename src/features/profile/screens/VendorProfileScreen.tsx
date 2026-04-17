// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

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

export const VendorProfileScreen = () => {
  const [activeTab, setActiveTab] = useState("All Services");

  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();

  return (
    <ScreenContainer scrollable backgroundColor="#FFFFFF" paddingHorizontal={hs(12)}>
      {/* 1. App Bar / Top Navigation */}
      <View style={styles.appBar}>
        <View style={styles.appBarLeft}>
          <TouchableOpacity style={styles.backBtn}>
            <ArrowLeft size={ms(20)} color="#000000" />
          </TouchableOpacity>
          <Text variant="h3" weight="bold">
            Profile
          </Text>
        </View>
        <View style={styles.appBarRight}>
          <TouchableOpacity style={styles.iconBtn}>
            <Bell size={ms(24)} color="#000000" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate("Settings")}>
            <Settings size={ms(24)} color="#000000" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Profile Header Section */}
      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.editBadge}>
          <Text variant="body1" weight="semiBold">
            Edit
          </Text>
        </TouchableOpacity>

        <View style={styles.profileInfo}>
          <Avatar size={100} />
          <View style={styles.nameWrapper}>
            <Text variant="body2" weight="semiBold" style={styles.greeting}>
              Hello, Owner
            </Text>
            <Text variant="body1" weight="semiBold">
              David Minter
            </Text>
          </View>
        </View>
      </View>

      {/* 3. Services Section */}
      <View style={styles.sectionHeader}>
        <Text variant="body1" weight="bold" style={styles.sectionTitle}>
          OUR SERVICES
        </Text>
      </View>

      <PillTabs
        tabs={["All Services", "Event", "Sport", "Restaurant", "Staycation"]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <View style={styles.servicesList}>
        <ServiceCard
          title="Elite Strikers Club"
          location="Skyline Open Grounds, Kolhapur"
          image={{ uri: "https://placeholder.com/100" }}
        />
        <ServiceCard
          title="Spice Symphony"
          location="Rajaram puri 4th lane"
          image={{ uri: "https://placeholder.com/100" }}
        />
        <ServiceCard
          title="Wildflower Vally"
          location="Panhala highway"
          image={{ uri: "https://placeholder.com/100" }}
        />
        <ServiceCard
          title="Neon shadow world tour 2026"
          location="Skyline open ground"
          image={{ uri: "https://placeholder.com/100" }}
        />
      </View>

      {/* 4. Staff Section */}
      <View style={styles.sectionHeader}>
        <Text variant="body1" weight="bold" style={styles.sectionTitle}>
          YOUR STAFF
        </Text>
      </View>

      <TouchableOpacity style={styles.actionRowBtn}>
        <Contact size={ms(24)} color="#63A1FD" />
        <Text variant="body2" weight="bold">
          Add Staff
        </Text>
        <Plus size={ms(17)} color="#000000" style={styles.plusSign} />
      </TouchableOpacity>

      <StaffCard name="Talia Mar" role="Restaurant" type="Manager" />
      <StaffCard name="Rohit Sharma" role="Turf" type="Employee" />

      {/* 5. Add More Section */}
      {/* 
        Comment-Out: This feature was not discussed
      */}
      {/* <View style={styles.sectionHeader}>
        <Text variant="body1" weight="bold" style={styles.sectionTitle}>
          ADD MORE SERVICE
        </Text>
      </View>
      <TouchableOpacity style={styles.actionRowBtn}>
        <Text variant="body2" weight="bold">
          Add Services
        </Text>
        <Plus size={ms(17)} color="#000000" style={styles.plusSign} />
      </TouchableOpacity> */}

      {/* Bottom Spacer */}
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
    marginTop: vs(6), // Appending our requested 10px accommodation + 6px from Figma
    marginBottom: vs(10),
  },
  appBarLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(10),
  },
  backBtn: {
    justifyContent: "center",
    alignItems: "center",
  },
  appBarRight: {
    flexDirection: "row",
    gap: hs(10),
  },
  iconBtn: {
    justifyContent: "center",
    alignItems: "center",
  },
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
    backgroundColor: "#F4F7FC",
    paddingHorizontal: hs(6),
    paddingVertical: vs(4),
    borderRadius: ms(19),
    zIndex: 10,
  },
  profileInfo: {
    alignItems: "center",
  },
  nameWrapper: {
    alignItems: "center",
  },
  greeting: {
    marginTop: vs(6),
  },
  sectionHeader: {
    width: "100%",
    height: vs(15),
  },
  sectionTitle: {
    textTransform: "uppercase",
    fontWeight: "bold",
  },
  servicesList: {
    gap: vs(10),
  },
  actionRowBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F4F7FC",
    height: vs(36),
    width: "100%",
    borderRadius: ms(10),
    gap: hs(6),
    marginBottom: vs(10),
    marginTop: vs(10),
  },
  plusSign: {
    marginLeft: hs(2),
  },
});
