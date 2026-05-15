// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState, useCallback, useEffect } from "react";
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

type BookingStatus = "Online" | "Offline" | "Settlement";

interface BulkBookingItem {
  ids: string[];
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

  // NEW: State for Grounds
  const [grounds, setGrounds] = useState<{ id: string; name: string }[]>([]);
  const [selectedGroundId, setSelectedGroundId] = useState<string>(groundId || "");

  const { selectedCategories, setServiceCategory } = useServiceStore();
  const selectedCategory = selectedCategories[venueId] || "Football";
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);

  // NEW: Fetch Grounds on mount
  useEffect(() => {
    const fetchGrounds = async () => {
      const { data } = await supabase
        .from("sports_grounds")
        .select("id, name")
        .eq("venue_id", venueId)
        .order("display_order", { ascending: true });

      if (data && data.length > 0) {
        setGrounds(data);
        if (!selectedGroundId) setSelectedGroundId(data[0].id);
      }
    };
    fetchGrounds();
  }, [selectedGroundId, venueId]);

  const fetchBulkBookings = useCallback(async () => {
    if (!selectedGroundId) return; // Wait until ground is selected

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
          sports_slots!inner (slot_date, start_time, end_time, ground_id)
        `,
        )
        .eq("venue_id", venueId)
        .eq("sports_slots.ground_id", selectedGroundId) // <-- CRITICAL FIX: Filters by selected ground
        .eq("platform_fee", 0)
        .eq("notes", "Bulk Booking Record")
        .neq("booking_status", "cancelled")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // --- 1. SMART GROUPING ALGORITHM ---
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

        const dates = slots.map((s: any) => new Date(s.slot_date).getTime());
        const minDate = new Date(Math.min(...dates));
        const maxDate = new Date(Math.max(...dates));

        const formatDate = (d: Date) =>
          d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
        const dateRangeStr =
          minDate.getTime() === maxDate.getTime()
            ? formatDate(minDate)
            : `${formatDate(minDate)} - ${formatDate(maxDate)}`;

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
  }, [venueId, selectedGroundId]);

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
            No bulk bookings found for this ground.
          </Text>
        </View>
      );
    }

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
            status={item.status}
            hideCallButton={false}
            onPress={() =>
              navigation.navigate("BulkBookingDetails", {
                bookingId: item.ids[0],
                type: activeTab === "multiple" ? "multi" : "single",
                venueId,
                groundId: selectedGroundId, // Passed currently selected ground
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

      {/* --- NEW GROUND SELECTOR --- */}
      {grounds.length > 0 && (
        <View style={styles.groundScrollWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.groundScroll}>
            {grounds.map(g => (
              <TouchableOpacity
                key={g.id}
                style={[styles.groundPill, selectedGroundId === g.id && styles.groundPillActive]}
                onPress={() => setSelectedGroundId(g.id)}>
                <Text
                  variant="body2"
                  weight="semiBold"
                  color={selectedGroundId === g.id ? COLORS.text.inverse : COLORS.text.primary}>
                  {g.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

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
            groundId: selectedGroundId, // Passes current ground to the form!
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
  groundScrollWrapper: {
    marginVertical: vs(10),
  },
  groundScroll: {
    alignItems: "center",
    paddingRight: hs(20), // buffer for scroll edge
  },
  groundPill: {
    paddingHorizontal: hs(16),
    paddingVertical: vs(8),
    borderRadius: ms(20),
    backgroundColor: COLORS.surface.primary,
    marginRight: hs(10),
    borderWidth: 1,
    borderColor: COLORS.border.navBar,
  },
  groundPillActive: {
    backgroundColor: "#000000",
    borderColor: "#000000",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.surface.primary,
    borderRadius: ms(10),
    padding: ms(4),
    marginBottom: vs(10),
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
