// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState, useCallback } from "react";
import { View, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { Text } from "@/components/ui";
import { ServiceHeader } from "../components/ServiceHeader";
import { BookingCard } from "../components/BookingCard";
import { Plus } from "lucide-react-native";
import { hs, vs, ms } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
import { MainStackParamList } from "@/navigation/navigation.types";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { supabase } from "@/lib/supabase";

// Match the exact status type defined in BookingData/BookingCard
type BookingStatus = "Online" | "Offline" | "Settlement";

interface BulkBookingItem {
  id: string;
  name: string;
  phone: string;
  dateRange: string;
  timeRange: string;
  status: BookingStatus; // Use the specific union type instead of string
}

export const BulkBookingScreen = () => {
  const [activeTab, setActiveTab] = useState<"multiple" | "single">("multiple");
  const [bookings, setBookings] = useState<BulkBookingItem[]>([]);
  const [loading, setLoading] = useState(true);

  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();

  const fetchBulkBookings = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("sports_bookings")
        .select(
          `
          id,
          user_id,
          guest_name,
          guest_phone,
          paid_amount,
          total_amount,
          notes,
          created_at,
          profiles (full_name, phone),
          sports_slots (slot_date, start_time, end_time)
        `,
        )
        .eq("platform_fee", 0)
        .eq("notes", "Bulk Booking Record")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // --- 1. SMART GROUPING ALGORITHM ---
      // Groups rows inserted at the same time by the same vendor for the same user
      const groupedBatches: any[] = [];
      let currentBatch: any = null;

      (data || []).forEach((item: any) => {
        const itemTime = new Date(item.created_at).getTime();

        if (!currentBatch) {
          currentBatch = {
            base: item,
            slots: [item.sports_slots],
            totalPaid: item.paid_amount,
            totalCost: item.total_amount,
          };
          groupedBatches.push(currentBatch);
        } else {
          const batchTime = new Date(currentBatch.base.created_at).getTime();
          const isSameUser =
            item.guest_phone === currentBatch.base.guest_phone &&
            item.user_id === currentBatch.base.user_id;

          // If created within 60 seconds of each other, it's the same bulk transaction!
          const isSameTransaction = Math.abs(batchTime - itemTime) < 60000;

          if (isSameUser && isSameTransaction) {
            currentBatch.slots.push(item.sports_slots);
            currentBatch.totalPaid += item.paid_amount;
            currentBatch.totalCost += item.total_amount;
          } else {
            currentBatch = {
              base: item,
              slots: [item.sports_slots],
              totalPaid: item.paid_amount,
              totalCost: item.total_amount,
            };
            groupedBatches.push(currentBatch);
          }
        }
      });

      // --- 2. FORMAT INTO SINGLE CARDS ---
      const formattedData: BulkBookingItem[] = groupedBatches.map(batch => {
        const { base, slots, totalPaid, totalCost } = batch;

        // Calculate Date Range (e.g., "06 May - 12 May")
        const dates = slots.map((s: any) => new Date(s.slot_date).getTime());
        const minDate = new Date(Math.min(...dates));
        const maxDate = new Date(Math.max(...dates));

        const formatDate = (d: Date) =>
          d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
        const dateRangeStr =
          minDate.getTime() === maxDate.getTime()
            ? formatDate(minDate)
            : `${formatDate(minDate)} - ${formatDate(maxDate)}`;

        // Calculate Time Range (e.g., "7 AM - 10 AM")
        const formatTime = (t: string) => {
          const [h] = t.split(":");
          const hour = parseInt(h, 10);
          const ampm = hour >= 12 ? "PM" : "AM";
          const displayHour = hour % 12 || 12;
          return `${displayHour} ${ampm}`;
        };

        const times = slots.map((s: any) => s.start_time).sort();
        const firstStartTime = times[0];
        const lastSlot = slots.find((s: any) => s.start_time === times[times.length - 1]);

        const timeRangeStr = `${formatTime(firstStartTime)} - ${formatTime(lastSlot.end_time)}`;
        const statusValue: BookingStatus =
          totalPaid >= totalCost && totalCost > 0 ? "Online" : "Offline";

        return {
          id: base.id,
          name: base.profiles?.full_name || base.guest_name || "Guest",
          phone: base.profiles?.phone || base.guest_phone || "N/A",
          dateRange: dateRangeStr,
          timeRange: timeRangeStr,
          status: statusValue,
        };
      });

      setBookings(formattedData);
    } catch (err) {
      console.error("Error fetching bulk bookings:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchBulkBookings();
    }, [fetchBulkBookings]),
  );

  const renderContent = () => {
    if (loading) {
      return <ActivityIndicator color={COLORS.primary} style={{ marginTop: vs(20) }} />;
    }

    if (bookings.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text variant="body2" color={COLORS.text.muted}>
            No bulk bookings found.
          </Text>
        </View>
      );
    }

    // Filter by tab if necessary, or show all
    return (
      <View style={styles.listContainer}>
        {bookings.map(item => (
          <BookingCard
            key={item.id}
            name={item.name}
            phone={item.phone}
            date={item.dateRange}
            time={item.timeRange}
            price=""
            status={item.status} // Now correctly typed
            hideCallButton={false}
            onPress={() =>
              navigation.navigate("BulkBookingDetails", {
                bookingId: item.id,
                type: activeTab === "multiple" ? "multi" : "single",
              })
            }
          />
        ))}
      </View>
    );
  };

  return (
    <ScreenContainer backgroundColor={COLORS.background} paddingHorizontal={hs(12)}>
      <ServiceHeader title="Elite Strikers Club" subtitle="Bulk Booking" />

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "multiple" ? styles.tabActive : styles.tabInactive]}
          onPress={() => setActiveTab("multiple")}>
          <Text
            variant="body2"
            weight="semiBold"
            color={activeTab === "multiple" ? COLORS.text.inverse : COLORS.text.muted}>
            Multiple days
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "single" ? styles.tabActive : styles.tabInactive]}
          onPress={() => setActiveTab("single")}>
          <Text
            variant="body2"
            weight="semiBold"
            color={activeTab === "single" ? COLORS.text.inverse : COLORS.text.muted}>
            Single days
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {renderContent()}
        <View style={{ height: vs(100) }} />
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() =>
          navigation.navigate("BulkBookingDetails", {
            bookingId: "new",
            type: activeTab === "multiple" ? "multi" : "single",
          })
        }>
        <Plus size={ms(30)} color={COLORS.text.inverse} />
      </TouchableOpacity>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.surface.primary,
    borderRadius: ms(10),
    padding: ms(4),
    marginVertical: vs(10),
    gap: hs(10),
  },
  tab: {
    flex: 1,
    height: vs(32),
    justifyContent: "center",
    alignItems: "center",
    borderRadius: ms(8),
  },
  tabActive: { backgroundColor: "#282828" },
  tabInactive: { backgroundColor: "transparent" },
  listContainer: { marginTop: vs(10) },
  emptyContainer: { alignItems: "center", marginTop: vs(40) },
  fab: {
    position: "absolute",
    bottom: vs(30),
    right: hs(12),
    width: ms(58),
    height: ms(58),
    borderRadius: ms(32),
    backgroundColor: "#63A1FD",
    justifyContent: "center",
    alignItems: "center",
  },
});
