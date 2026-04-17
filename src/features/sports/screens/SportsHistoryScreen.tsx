// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput as RNTextInput,
  ScrollView,
} from "react-native";
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { Text } from "@/components/ui";
import { ServiceHeader } from "../components/ServiceHeader";
import { BookingCard } from "../components/BookingCard";
import { Search, ChevronDown } from "lucide-react-native";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";

const DateSectionHeader = ({ date, settlement }: { date: string; settlement: string }) => (
  <View style={styles.dateHeaderRow}>
    <TouchableOpacity style={styles.dateLeft} activeOpacity={0.7}>
      <Text variant="body2" weight="semiBold" style={styles.dateText}>
        {date}
      </Text>
      <ChevronDown size={ms(16)} color={COLORS.text.primary} />
    </TouchableOpacity>

    <View style={styles.settlementRight}>
      <Text variant="body2" weight="semiBold" color="#00B562">
        {settlement}
      </Text>
      <Text
        variant="caption"
        weight="semiBold"
        color={COLORS.text.muted}
        style={styles.settlementText}>
        Settlement
      </Text>
    </View>
  </View>
);

export const SportsHistoryScreen = () => {
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("Turf football");

  return (
    <ScreenContainer backgroundColor={COLORS.background}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[1]} // Tells ScrollView to make the 2nd child (Index 1) sticky
      >
        {/* INDEX 0: Header with custom dropdown implementation */}
        <View style={styles.headerZIndex}>
          <ServiceHeader
            title="Elite Strikers Club"
            subtitle="History"
            category={selectedCategory}
            onCategoryPress={() => setIsCategoryOpen(!isCategoryOpen)}
          />

          {/* Category Dropdown Modal Popover */}
          {isCategoryOpen && (
            <View style={styles.dropdownMenu}>
              {["Turf football", "Box Cricket", "Pickleball"].map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={styles.dropdownItem}
                  activeOpacity={0.7}
                  onPress={() => {
                    setSelectedCategory(cat);
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
          )}
        </View>

        {/* INDEX 1: Sticky Search Bar Wrapper */}
        <View style={styles.stickySearchWrapper}>
          <View style={styles.searchContainer}>
            <Search size={ms(20)} color={COLORS.text.primary} />
            <RNTextInput
              style={styles.searchInput}
              placeholder="Search for mobile number , Date , Name"
              placeholderTextColor={COLORS.text.primary}
            />
          </View>
        </View>

        {/* INDEX 2: History List Grouped */}
        <View style={styles.listSection}>
          {/* Date Group 1 */}
          <DateSectionHeader date="03 Apr 2026" settlement="₹5000" />

          <BookingCard
            name="Chirag Patil"
            phone="+91 89346 93456"
            date="" // Hidden
            time="7 Pm - 8 Pm  |  8 Pm - 9 Pm"
            price="₹1600"
            status="Full"
            hideCallButton={true}
            hideDateText={true}
            useClockIcon={true}
          />
          <BookingCard
            name="Yash Jadhav"
            phone="+91 89346 93456"
            date="" // Hidden
            time="7 Pm - 8 Pm"
            price="₹100"
            status="Advance"
            hideCallButton={true}
            hideDateText={true}
            useClockIcon={true}
          />
          <BookingCard
            name="Rohit Sharma"
            phone="+91 89346 93456"
            date="" // Hidden
            time="3 Pm - 4 Pm  |  4 Pm - 5 Pm  |  5 Pm - 6 Pm"
            price="₹2400"
            status="Full"
            hideCallButton={true}
            hideDateText={true}
            useClockIcon={true}
          />
          <BookingCard
            name="Virat kohli"
            phone="+91 89346 93456"
            date="" // Hidden
            time="7 Pm - 8 Pm"
            price="₹800"
            status="Full"
            hideCallButton={true}
            hideDateText={true}
            useClockIcon={true}
          />
          <BookingCard
            name="Sanket Mohite"
            phone="+91 89346 93456"
            date="" // Hidden
            time="7 Pm - 8 Pm"
            price="₹100"
            status="Advance"
            hideCallButton={true}
            hideDateText={true}
            useClockIcon={true}
          />

          {/* Date Group 2 */}
          <DateSectionHeader date="02 Apr 2026" settlement="₹4500" />

          <BookingCard
            name="Virat kohli"
            phone="+91 89346 93456"
            date="" // Hidden
            time="7 Pm - 8 Pm"
            price="₹800"
            status="Full"
            hideCallButton={true}
            hideDateText={true}
            useClockIcon={true}
          />
        </View>

        <View style={{ height: vs(120) }} />
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  headerZIndex: {
    zIndex: 10,
    paddingHorizontal: hs(12),
  },
  dropdownMenu: {
    position: "absolute",
    top: vs(45),
    right: hs(12), // Adjusted to account for container padding
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

  // --- STICKY WRAPPER ---
  stickySearchWrapper: {
    backgroundColor: COLORS.background,
    paddingHorizontal: hs(12),
    paddingTop: vs(6), // Gives slight breathing room when stuck
    paddingBottom: vs(12), // Replaces the searchContainer marginBottom
    zIndex: 9,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: vs(40),
    backgroundColor: COLORS.surface.primary,
    borderWidth: 1,
    borderColor: "#FFFFFF",
    borderRadius: ms(10),
    paddingHorizontal: hs(10),
    gap: hs(10),
    shadowColor: "rgba(229, 229, 229, 0.7)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Gilroy-Medium",
    fontSize: fs(14),
    color: COLORS.text.primary,
    paddingVertical: 0,
  },

  listSection: {
    width: "100%",
    paddingHorizontal: hs(12),
  },
  dateHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: vs(12),
    marginTop: vs(6),
  },
  dateLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(6),
  },
  dateText: {
    textTransform: "capitalize",
  },
  settlementRight: {
    alignItems: "center",
    justifyContent: "center",
  },
  settlementText: {
    fontSize: fs(10),
    lineHeight: fs(12),
  },
});
