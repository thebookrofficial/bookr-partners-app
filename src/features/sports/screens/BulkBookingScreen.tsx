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
import { useNavigation, useFocusEffect, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useServiceStore } from "@/store/serviceStore";
import { supabase } from "@/lib/supabase";

// Match the exact status type defined in BookingData/BookingCard
type BookingStatus = "Online" | "Offline" | "Settlement";

interface BulkBookingItem {
  ids: string[]; // Store all IDs in the batch
  name: string;
  phone: string;
  dateRange: string;
  timeRange: string;
  status: BookingStatus;
}

export const BulkBookingScreen = () => {
  const [activeTab, setActiveTab] = useState<"multiple" | "single">("multiple");
  const [bookings, setBookings] = useState<BulkBookingItem[]>([]);
  const [loading, setLoading] = useState(true);

  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const route = useRoute<RouteProp<MainStackParamList, "BulkBooking">>();
  const { venueId, groundId } = route.params;

  const { selectedCategories, setServiceCategory } = useServiceStore();
  const selectedCategory = selectedCategories[venueId] || "Football";
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);

  // --- ADD THIS DEBUG EFFECT ---
  // useEffect(() => {
  //   console.log("=== DEBUG BULK SCREEN ===");
  //   console.log("Venue ID:", venueId);
  //   console.log("Ground ID:", groundId);
  //   console.log("Selected Category:", selectedCategory);
  //   console.log("=========================");
  // }, [venueId, groundId, selectedCategory]);

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
          booking_status,
          profiles (full_name, phone),
          sports_slots (slot_date, start_time, end_time)
        `,
        )
        .eq("venue_id", venueId)
        .eq("platform_fee", 0)
        .eq("notes", "Bulk Booking Record")
        .neq("booking_status", "cancelled")
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
            ids: [item.id],
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
            currentBatch.ids.push(item.id);
            currentBatch.slots.push(item.sports_slots);
            currentBatch.totalPaid += item.paid_amount;
            currentBatch.totalCost += item.total_amount;
          } else {
            currentBatch = {
              base: item,
              ids: [item.id],
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
        const { base, ids, slots, totalPaid, totalCost } = batch;

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
          ids: ids,
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
  }, [venueId]);

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
            key={item.ids[0]}
            name={item.name}
            phone={item.phone}
            date={item.dateRange}
            time={item.timeRange}
            price=""
            status={item.status} // Now correctly typed
            hideCallButton={false}
            onPress={() =>
              navigation.navigate("BulkBookingDetails", {
                bookingId: item.ids[0],
                type: activeTab === "multiple" ? "multi" : "single",
                venueId,
                groundId,
              })
            }
          />
        ))}
      </View>
    );
  };

  return (
    <ScreenContainer backgroundColor={COLORS.background} paddingHorizontal={hs(12)}>
      <ServiceHeader
        title="Elite Strikers Club"
        subtitle="Bulk Booking"
        category={selectedCategory}
        onCategoryPress={() => setIsCategoryOpen(!isCategoryOpen)}
      />

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
            venueId,
            groundId,
          })
        }>
        <Plus size={ms(30)} color={COLORS.text.inverse} />
      </TouchableOpacity>

      {/* --- FIXED OVERLAY DROPDOWN --- */}
      {isCategoryOpen && (
        <View style={styles.dropdownOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={() => setIsCategoryOpen(false)}
          />
          <View style={styles.dropdownMenu}>
            {["Football", "Box Cricket", "Pickleball"].map(cat => (
              <TouchableOpacity
                key={cat}
                style={styles.dropdownItem}
                activeOpacity={0.7}
                onPress={() => {
                  setServiceCategory(venueId, cat);
                  setIsCategoryOpen(false);
                }}>
                <Text variant="body2" weight="semiBold">
                  {cat}
                </Text>
                <View style={styles.radioOuter}>
                  {selectedCategory === cat && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
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

  /* --- FIXED OVERLAY DROPDOWN STYLES --- */
  dropdownOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 1000, elevation: 1000 },
  dropdownMenu: {
    position: "absolute",
    top: vs(55),
    right: hs(12),
    backgroundColor: COLORS.background,
    borderRadius: ms(10),
    borderWidth: 1,
    borderColor: COLORS.border.navBar,
    width: hs(180),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    padding: hs(6),
    gap: vs(6),
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: hs(10),
    paddingVertical: vs(8),
    borderWidth: 1,
    borderColor: COLORS.border.navBar,
    borderRadius: ms(8),
  },
  radioOuter: {
    width: ms(20),
    height: ms(20),
    borderRadius: ms(10),
    borderWidth: 2,
    borderColor: COLORS.text.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  radioInner: {
    width: ms(10),
    height: ms(10),
    borderRadius: ms(5),
    backgroundColor: COLORS.text.primary,
  },
});
