import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, Image, ScrollView } from "react-native";
import { GuestHistorySkeleton } from "@/components/ui";
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { Text } from "@/components/ui";
import { ArrowLeft, Phone, ChevronDown, ChevronUp } from "lucide-react-native";
import { BookingCard } from "../components/BookingCard";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MainStackParamList } from "@/navigation/navigation.types";
import { useGuestHistory, HistoryBooking } from "../hooks/useGuestHistory";

const userAvatar = require("@/assets/icons/ic-user-profile.png");

export const GuestHistoryScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const route = useRoute<RouteProp<MainStackParamList, "GuestHistory">>();

  const { guestId: guestIdParam, bookingId, vertical, venueId } = route.params as any;
  const identifier = guestIdParam || bookingId;

  const { history, stats, guestName, guestPhone, loading } = useGuestHistory(
    identifier,
    vertical,
    venueId,
  );

  const [activeTab, setActiveTab] = useState<"past" | "upcoming" | "cancelled">("past");
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});

  const filteredHistory = history.filter(h => h.booking_status === activeTab);

  const getFormattedDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
    const day = d.getDate();
    const month = d.toLocaleDateString("en-US", { month: "short" });
    return `${dayName}, ${day} ${month}`;
  };

  const groupedHistory = filteredHistory.reduce((acc, item) => {
    const dateKey = getFormattedDate(item.raw_date);
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(item);
    return acc;
  }, {} as Record<string, HistoryBooking[]>);

  const navigateToHistoryItem = (item: HistoryBooking) => {
    if (item.vertical === "sports") {
      navigation.navigate("SportsInvoice", { bookingId: item.id });
    } else if (item.vertical === "staycation") {
      navigation.navigate("StaycationInvoice", { bookingId: item.id });
    } else if (item.vertical === "events") {
      navigation.navigate("EventEntryDetails", { entryId: item.id });
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <GuestHistorySkeleton />
      </View>
    );
  }

  return (
    <ScreenContainer backgroundColor="#FFFFFF" paddingHorizontal={hs(12)}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: vs(40) }}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <ArrowLeft size={ms(24)} color="#000" />
            </TouchableOpacity>
            <Text variant="h2" weight="bold" style={{ marginLeft: hs(10), color: "#000" }}>
              Profile
            </Text>
          </View>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <Image source={userAvatar} style={styles.avatarLarge} />
          <View style={styles.profileInfo}>
            <Text variant="h2" weight="bold" color="#000" style={{ fontSize: fs(22) }}>
              {guestName || "Unknown Guest"}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: vs(6) }}>
              <Phone size={ms(16)} color="#000" />
              <Text variant="body1" weight="semiBold" color="#000" style={{ marginLeft: hs(6) }}>
                {guestPhone || "No Phone"}
              </Text>
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === "upcoming" ? { backgroundColor: COLORS.primary } : styles.tabInactive,
            ]}
            onPress={() => setActiveTab("upcoming")}>
            <Text
              variant="body2"
              weight="semiBold"
              style={activeTab === "upcoming" ? styles.tabTextActive : styles.tabTextInactive}>
              Upcoming
            </Text>
            <Text
              variant="h3"
              weight="bold"
              style={activeTab === "upcoming" ? styles.tabTextActive : styles.tabTextInactive}>
              {stats.upcoming}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === "past" ? { backgroundColor: "#000000" } : styles.tabInactive,
            ]}
            onPress={() => setActiveTab("past")}>
            <Text
              variant="body2"
              weight="semiBold"
              style={activeTab === "past" ? styles.tabTextActive : styles.tabTextInactive}>
              Past
            </Text>
            <Text
              variant="h3"
              weight="bold"
              style={activeTab === "past" ? styles.tabTextActive : styles.tabTextInactive}>
              {stats.past}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === "cancelled" ? { backgroundColor: COLORS.danger } : styles.tabInactive,
            ]}
            onPress={() => setActiveTab("cancelled")}>
            <Text
              variant="body2"
              weight="semiBold"
              style={activeTab === "cancelled" ? styles.tabTextActive : styles.tabTextInactive}>
              Cancelled
            </Text>
            <Text
              variant="h3"
              weight="bold"
              style={activeTab === "cancelled" ? styles.tabTextActive : styles.tabTextInactive}>
              {stats.cancelled}
            </Text>
          </TouchableOpacity>
        </View>

        {/* List */}
        <View style={styles.listContainer}>
          {Object.keys(groupedHistory).length === 0 ? (
            <View style={styles.emptyState}>
              <Text variant="body1" color={COLORS.text.muted}>
                No bookings found.
              </Text>
            </View>
          ) : (
            Object.keys(groupedHistory).map((dateKey, index) => {
              const defaultExpanded = activeTab === "past" && index === 0;
              const isExpanded =
                expandedDates[dateKey] !== undefined ? expandedDates[dateKey] : defaultExpanded;
              const bookings = groupedHistory[dateKey];

              return (
                <View key={dateKey} style={styles.dateGroup}>
                  <TouchableOpacity
                    style={styles.dateHeader}
                    onPress={() => {
                      setExpandedDates(prev => {
                        const current =
                          prev[dateKey] !== undefined ? prev[dateKey] : defaultExpanded;
                        return { ...prev, [dateKey]: !current };
                      });
                    }}>
                    <Text variant="body1" weight="bold" color="#000">
                      {dateKey} ({bookings.length})
                    </Text>
                    {isExpanded ? (
                      <ChevronUp size={ms(20)} color="#000" />
                    ) : (
                      <ChevronDown size={ms(20)} color="#000" />
                    )}
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={styles.dateGroupContent}>
                      {bookings.map((item, index) => (
                        <BookingCard
                          key={item.id || index}
                          name={
                            item.status === "Offline" && item.guest_name
                              ? item.guest_name
                              : item.venue_name || guestName
                          }
                          subtitle={
                            item.vertical === "staycation" ? "Staycation Booking" : "Sports Booking"
                          }
                          date={getFormattedDate(item.raw_date)}
                          time={item.display_time}
                          price={`₹${item.total_amount}`}
                          isDisabled={activeTab === "past"}
                          status={
                            (item.booking_status === "cancelled" ? "Cancelled" : item.status) as any
                          }
                          onPress={() => navigateToHistoryItem(item)}
                        />
                      ))}
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: vs(20),
    marginBottom: vs(20),
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  profileCard: {
    backgroundColor: "#F4F7FC",
    borderColor: "#CBDFFE",
    borderWidth: 1,
    borderRadius: ms(9),
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: hs(12),
    paddingVertical: vs(20),
    marginBottom: vs(20),
  },
  avatarLarge: {
    width: ms(90),
    height: ms(90),
    borderRadius: ms(45),
  },
  profileInfo: {
    marginLeft: hs(14),
    flex: 1,
  },
  tabsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(10),
    marginBottom: vs(20),
  },
  tab: {
    flex: 1,
    borderRadius: ms(10),
    paddingVertical: vs(8),
    alignItems: "center",
    justifyContent: "center",
    gap: vs(4),
  },
  tabInactive: {
    backgroundColor: "#F4F7FC",
  },
  tabTextInactive: {
    color: "#8C8C8C",
  },
  tabTextActive: {
    color: "#FFFFFF",
  },
  listContainer: {
    gap: vs(12),
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: vs(40),
  },
  dateGroup: {
    marginBottom: vs(12),
  },
  dateHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F4F7FC",
    paddingHorizontal: hs(12),
    paddingVertical: vs(10),
    borderRadius: ms(8),
    marginBottom: vs(8),
  },
  dateGroupContent: {
    gap: vs(12),
  },
});
