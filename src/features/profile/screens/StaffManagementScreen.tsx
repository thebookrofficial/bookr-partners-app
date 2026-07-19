// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl,
} from "react-native";
import { StaffManagementSkeleton } from "@/components/ui";
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { Text } from "@/components/ui";
import { ArrowLeft, UserPlus } from "lucide-react-native";
import { vs, hs, ms } from "@/utils/responsive.utils";
import { useNavigation, useRoute, useIsFocused } from "@react-navigation/native";
import { COLORS } from "@/constants/theme";
import { StaffCard } from "../components/StaffCard";
import { StaffService, StaffMember } from "../services/staff.service";

export const StaffManagementScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const { venueId, serviceCategory } = route.params || {};
  const isFocused = useIsFocused();
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStaff = useCallback(
    async (isRefresh = false) => {
      if (!venueId) return;
      try {
        if (!isRefresh) setLoading(true);
        const data = await StaffService.getStaffList(venueId);
        setStaffList(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [venueId],
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStaff(true);
  }, [fetchStaff]);

  useEffect(() => {
    if (isFocused) {
      fetchStaff();
    }
  }, [fetchStaff, isFocused]);

  const handleDelete = (staffId: string, isInvite: boolean) => {
    Alert.alert("Delete Staff", "Are you sure you want to remove this staff member?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await StaffService.deleteStaff(staffId, isInvite);
            fetchStaff();
          } catch (error) {
            Alert.alert("Error", "Could not delete staff");
          }
        },
      },
    ]);
  };

  const handleBlock = (staffId: string) => {
    Alert.alert("Block Staff", "Are you sure you want to block this staff member?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Block",
        style: "destructive",
        onPress: async () => {
          try {
            await StaffService.blockStaff(staffId);
            fetchStaff();
          } catch (error) {
            Alert.alert("Error", "Could not block staff");
          }
        },
      },
    ]);
  };

  // Helper to format permissions array into object for StaffCard
  const formatPermissionsForCard = (perms: string[]) => {
    const sports = perms.filter(p => p.startsWith("sports:")).map(p => p.replace("sports:", ""));
    const staycation = perms
      .filter(p => p.startsWith("staycation:"))
      .map(p => p.replace("staycation:", ""));
    return { sports, staycation };
  };

  return (
    <ScreenContainer backgroundColor={COLORS.background} paddingHorizontal={hs(12)}>
      {/* App Bar */}
      <View style={styles.appBar}>
        <View style={styles.appBarLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <ArrowLeft size={ms(20)} color={COLORS.text.primary} />
          </TouchableOpacity>
          <Text variant="h3" weight="bold">
            Staff List
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate("AddStaff", { serviceCategory, venueId })}>
          <UserPlus size={ms(16)} color={COLORS.text.inverse} />
          <Text variant="body2" weight="bold" color={COLORS.text.inverse}>
            Add Staff
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <StaffManagementSkeleton />
      ) : staffList.length === 0 ? (
        <Text style={styles.emptyText}>No staff members found.</Text>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }>
          {staffList.map(staff => (
            <StaffCard
              key={staff.id}
              name={staff.name}
              permissions={formatPermissionsForCard(staff.permissions)}
              onPress={() =>
                navigation.navigate("EditStaff", {
                  staffId: staff.id,
                  serviceCategory,
                  venueId,
                  isInvite: staff.isInvite,
                })
              }
              isInvite={staff.isInvite}
              onDelete={() => handleDelete(staff.id, staff.isInvite)}
              onBlock={() => handleBlock(staff.id)}
            />
          ))}
        </ScrollView>
      )}
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
    marginBottom: vs(20),
  },
  appBarLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(10),
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.text.primary,
    paddingHorizontal: hs(12),
    paddingVertical: vs(8),
    borderRadius: ms(8),
    gap: hs(6),
  },
  listContainer: {
    paddingBottom: vs(40),
  },
  emptyText: {
    textAlign: "center",
    marginTop: vs(60),
    color: COLORS.text.muted,
  },
});
