// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, ScrollView, Modal } from "react-native";
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { Text, PillTabs, TextInput } from "@/components/ui";
import { EventHeader } from "../components/EventHeader";
import { Calendar as CalendarWidget } from "react-native-calendars";
import { Calendar as CalendarIcon, Plus, ChevronDown, Circle, Dot } from "lucide-react-native";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
import { useRoute, RouteProp } from "@react-navigation/native";
import { MainStackParamList } from "@/navigation/navigation.types";

const USER_PROFILE = require("../../../assets/icons/ic-user-profile.png");

export const EventOffersScreen = () => {
  const route = useRoute<RouteProp<MainStackParamList, "EventOffers">>();
  const _serviceId = route.params?.serviceId || "";

  // Tabs State
  const [activeTab, setActiveTab] = useState<string>("Coupons");

  // Form State
  const [inviteTo, setInviteTo] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [offerValueType, setOfferValueType] = useState<"flat" | "percentage">("flat");
  const [flatAmount, setFlatAmount] = useState("100");
  const [percentage, setPercentage] = useState("5%");
  const [minOrderValue, setMinOrderValue] = useState("₹1000");
  const [uptoAmount, setUptoAmount] = useState("150");
  const [usageLimit, setUsageLimit] = useState("Only via coupon");
  const [totalUsage, setTotalUsage] = useState("1");

  // Dropdown Selection State
  const [activeDropdown, setActiveDropdown] = useState<{
    type: "percentage" | "minOrder" | "usageLimit" | "totalUsage";
    options: string[];
  } | null>(null);

  // Date Logic
  const [dateRange] = useState<{ start?: string; end?: string }>({
    start: "2026-05-06",
    end: "2026-05-12",
  });

  const selectOption = (option: string) => {
    if (!activeDropdown) return;
    switch (activeDropdown.type) {
      case "percentage":
        setPercentage(option);
        break;
      case "minOrder":
        setMinOrderValue(option);
        break;
      case "usageLimit":
        setUsageLimit(option);
        break;
      case "totalUsage":
        setTotalUsage(option);
        break;
    }
    setActiveDropdown(null);
  };

  const getMarkedDates = () => {
    const marked: any = {};
    if (dateRange.start) {
      marked[dateRange.start] = {
        startingDay: true,
        color: COLORS.primary,
        textColor: COLORS.text.inverse,
      };
    }
    if (dateRange.end) {
      marked[dateRange.end] = {
        endingDay: true,
        color: COLORS.primary,
        textColor: COLORS.text.inverse,
      };
      let start = new Date(dateRange.start!);
      let end = new Date(dateRange.end!);
      for (let d = new Date(start.getTime() + 86400000); d < end; d.setDate(d.getDate() + 1)) {
        marked[d.toISOString().split("T")[0]] = {
          color: COLORS.border.navBar,
          textColor: COLORS.text.primary,
        };
      }
    }
    return marked;
  };

  return (
    <ScreenContainer backgroundColor={COLORS.background} paddingHorizontal={hs(12)}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerWrapper}>
          <EventHeader
            title="Neon Shadow World Tour 2026"
            subtitle="Offers"
            imageSource={USER_PROFILE}
          />
        </View>

        <View style={styles.tabSection}>
          <Text variant="body1" weight="bold" style={styles.typesLabel}>
            Types
          </Text>
          <PillTabs
            tabs={["Coupons", "Discount"]}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            variant="dark"
            style={styles.pillTabs}
          />
        </View>

        {/* ON GOING SECTION */}
        <View style={styles.section}>
          <Text weight="bold" style={styles.sectionTitle}>
            ON GOING {activeTab.toUpperCase()}
          </Text>
          <View style={styles.offerRow}>
            <View style={styles.statusDotActive} />
            <Text weight="semiBold" style={styles.offerText}>
              bookr12 For 5% off above ₹1000 Bill
            </Text>
          </View>
        </View>

        {/* INVITE TO */}
        <View style={styles.formGroup}>
          <Text variant="body2" weight="medium" style={styles.label}>
            Invite To
          </Text>
          <View style={styles.inputContainer}>
            <TextInput
              placeholder="Email / Phone No"
              variant="filled"
              value={inviteTo}
              onChangeText={setInviteTo}
              style={styles.flex1}
            />
            <TouchableOpacity style={styles.plusIcon}>
              <Plus size={ms(24)} color={COLORS.text.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* CREATE OFFER FORM */}
        <View style={styles.section}>
          <Text weight="bold" style={styles.sectionTitle}>
            CREATE COUPON
          </Text>

          <View style={styles.formGroup}>
            <Text variant="body2" weight="medium" style={styles.label}>
              Type Coupon Code
            </Text>
            <TextInput
              placeholder="Ex: BOOKR5"
              variant="filled"
              value={couponCode}
              onChangeText={setCouponCode}
              autoCapitalize="characters"
            />
          </View>

          <View style={styles.row}>
            <View style={styles.flex1}>
              <Text variant="body2" weight="medium" style={styles.label}>
                From
              </Text>
              <View style={styles.dateDisplay}>
                <Text weight="semiBold">06 May 2026</Text>
              </View>
            </View>
            <View style={styles.flex1}>
              <Text variant="body2" weight="medium" style={styles.label}>
                To
              </Text>
              <View style={styles.dateDisplay}>
                <Text weight="semiBold">06 May 2026</Text>
              </View>
            </View>
          </View>

          <CalendarWidget
            markedDates={getMarkedDates()}
            current={"2026-05-01"}
            markingType={"period"}
            theme={{
              calendarBackground: "transparent",
              selectedDayBackgroundColor: COLORS.primary,
              selectedDayTextColor: COLORS.text.inverse,
              todayTextColor: COLORS.primary,
              dayTextColor: COLORS.text.primary,
              textDisabledColor: "#B3B3B3",
              monthTextColor: COLORS.text.primary,
              arrowColor: COLORS.primary,
              textMonthFontFamily: "Inter-SemiBold",
              textDayHeaderFontFamily: "Inter-Medium",
              textDayFontSize: fs(11),
              textMonthFontSize: fs(12),
              textDayHeaderFontSize: fs(11),
            }}
            style={styles.calendar}
          />

          {/* Flat / Min Order Value Row */}
          <View style={styles.row}>
            <View style={styles.flex1}>
              <TouchableOpacity style={styles.radioLabel} onPress={() => setOfferValueType("flat")}>
                <Text variant="body2" weight="medium" style={styles.label}>
                  Flat
                </Text>
                {offerValueType === "flat" ? (
                  <Dot size={ms(24)} color={COLORS.primary} strokeWidth={6} />
                ) : (
                  <Circle size={ms(18)} color={COLORS.text.muted} />
                )}
              </TouchableOpacity>
              <TextInput
                variant="filled"
                value={flatAmount}
                onChangeText={setFlatAmount}
                keyboardType="numeric"
                placeholder="100"
                editable={offerValueType === "flat"}
              />
            </View>
            <View style={styles.flex1}>
              <Text variant="body2" weight="medium" style={styles.label}>
                Min Order Value
              </Text>
              <TouchableOpacity
                style={styles.dropdownInput}
                onPress={() =>
                  setActiveDropdown({
                    type: "minOrder",
                    options: ["₹500", "₹1000", "₹1500", "₹2000"],
                  })
                }>
                <Text weight="semiBold">{minOrderValue}</Text>
                <ChevronDown size={ms(18)} color={COLORS.text.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Percentage / Upto / Min Order Value Row */}
          <View style={styles.row}>
            <View style={styles.flex1}>
              <TouchableOpacity
                style={styles.radioLabel}
                onPress={() => setOfferValueType("percentage")}>
                <Text variant="body2" weight="medium" style={styles.label}>
                  Percentage
                </Text>
                {offerValueType === "percentage" ? (
                  <Dot size={ms(24)} color={COLORS.primary} strokeWidth={6} />
                ) : (
                  <Circle size={ms(18)} color={COLORS.text.muted} />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dropdownInput, offerValueType !== "percentage" && styles.disabledBg]}
                disabled={offerValueType !== "percentage"}
                onPress={() =>
                  setActiveDropdown({
                    type: "percentage",
                    options: ["5%", "10%", "15%", "20%", "25%"],
                  })
                }>
                <Text
                  weight="semiBold"
                  color={offerValueType === "percentage" ? COLORS.text.primary : COLORS.text.muted}>
                  {percentage}
                </Text>
                <ChevronDown
                  size={ms(18)}
                  color={offerValueType === "percentage" ? COLORS.text.primary : COLORS.text.muted}
                />
              </TouchableOpacity>
            </View>
            <View style={styles.flex1}>
              <Text variant="body2" weight="medium" style={styles.label}>
                Upto
              </Text>
              <TextInput
                variant="filled"
                value={uptoAmount}
                onChangeText={setUptoAmount}
                keyboardType="numeric"
                placeholder="150"
                editable={offerValueType === "percentage"}
              />
            </View>
            <View style={styles.flex1}>
              <Text variant="body2" weight="medium" style={styles.label}>
                Min Order Value
              </Text>
              <TouchableOpacity
                style={[styles.dropdownInput, offerValueType !== "percentage" && styles.disabledBg]}
                disabled={offerValueType !== "percentage"}
                onPress={() =>
                  setActiveDropdown({
                    type: "minOrder",
                    options: ["₹500", "₹1000", "₹1500", "₹2000"],
                  })
                }>
                <Text
                  weight="semiBold"
                  color={offerValueType === "percentage" ? COLORS.text.primary : COLORS.text.muted}>
                  {minOrderValue}
                </Text>
                <ChevronDown
                  size={ms(18)}
                  color={offerValueType === "percentage" ? COLORS.text.primary : COLORS.text.muted}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Usage Limit */}
          <View style={styles.formGroup}>
            <View style={styles.labelWithInfo}>
              <Text variant="body2" weight="medium">
                Usage Limit
              </Text>
              <Text variant="caption" color={COLORS.text.muted}>
                (how many people will be able to use this offer)
              </Text>
            </View>
            <TouchableOpacity
              style={styles.dropdownInput}
              onPress={() =>
                setActiveDropdown({
                  type: "usageLimit",
                  options: ["Everyone", "Only via coupon"],
                })
              }>
              <Text weight="semiBold">{usageLimit}</Text>
              <ChevronDown size={ms(18)} color={COLORS.text.primary} />
            </TouchableOpacity>
          </View>

          {/* Total Usage per User */}
          <View style={styles.formGroup}>
            <Text variant="body2" weight="medium" style={styles.label}>
              Total Usage per User
            </Text>
            <TouchableOpacity
              style={styles.dropdownInput}
              onPress={() =>
                setActiveDropdown({
                  type: "totalUsage",
                  options: ["1", "2", "3", "4", "5"],
                })
              }>
              <Text weight="semiBold">{totalUsage}</Text>
              <ChevronDown size={ms(18)} color={COLORS.text.primary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.primaryBtn}>
            <Text family="bison" weight="bold" style={styles.btnText}>
              CONFIRM NEW COUPON
            </Text>
          </TouchableOpacity>
        </View>

        {/* PAST OFFERS SECTION */}
        <View style={styles.section}>
          <Text weight="bold" style={styles.sectionTitle}>
            PAST DISCOUNT OFFERS
          </Text>
          <View style={styles.pastOfferRow}>
            <CalendarIcon size={ms(20)} color={COLORS.text.muted} />
            <Text weight="semiBold" style={styles.pastOfferText}>
              12 Mar 2026
            </Text>
            <Text weight="semiBold" color={COLORS.text.muted}>
              5% OFF
            </Text>
          </View>
          <View style={styles.pastOfferRow}>
            <CalendarIcon size={ms(20)} color={COLORS.text.muted} />
            <Text weight="semiBold" style={styles.pastOfferText}>
              30 Dec 2026 - 1 Jan 2026
            </Text>
            <Text weight="semiBold" color={COLORS.text.muted}>
              7% OFF
            </Text>
          </View>
        </View>

        <View style={{ height: vs(120) }} />
      </ScrollView>

      {/* OPTIONS MODAL */}
      <Modal
        visible={!!activeDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveDropdown(null)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setActiveDropdown(null)}>
          <View style={styles.optionsContainer}>
            {activeDropdown?.options.map(option => (
              <TouchableOpacity
                key={option}
                style={styles.optionItem}
                onPress={() => selectOption(option)}>
                <Text variant="body1" weight="semiBold">
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: vs(30),
  },
  headerWrapper: {
    paddingTop: vs(10),
  },
  tabSection: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: vs(10),
    justifyContent: "space-between",
  },
  typesLabel: {
    fontSize: fs(18),
  },
  pillTabs: {
    flex: 0.6,
    marginVertical: 0,
  },
  section: {
    marginTop: vs(20),
    gap: vs(10),
  },
  sectionTitle: {
    fontSize: fs(16),
    textTransform: "uppercase",
    color: COLORS.text.primary,
  },
  offerRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface.primary,
    borderRadius: ms(10),
    paddingHorizontal: hs(10),
    paddingVertical: vs(12),
    gap: hs(10),
  },
  statusDot: {
    width: ms(10),
    height: ms(10),
    borderRadius: ms(5),
  },
  statusDotActive: {
    width: ms(10),
    height: ms(10),
    borderRadius: ms(5),
    backgroundColor: "#00B562",
  },
  offerText: {
    color: COLORS.text.primary,
    fontSize: fs(14),
  },
  formGroup: {
    marginTop: vs(15),
    gap: vs(4),
  },
  label: {
    textTransform: "capitalize",
    color: COLORS.text.primary,
  },
  labelWithInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(6),
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(10),
  },
  plusIcon: {
    padding: ms(4),
  },
  flex1: {
    flex: 1,
  },
  row: {
    flexDirection: "row",
    gap: hs(15),
    marginTop: vs(15),
  },
  dateDisplay: {
    backgroundColor: COLORS.surface.primary,
    borderRadius: ms(10),
    paddingHorizontal: hs(10),
    paddingVertical: vs(12),
    height: vs(44),
    justifyContent: "center",
  },
  calendar: {
    marginTop: vs(15),
    backgroundColor: COLORS.surface.primary,
    borderRadius: ms(12),
    padding: ms(10),
  },
  radioLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(6),
    marginBottom: vs(4),
  },
  dropdownInput: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.surface.primary,
    borderRadius: ms(10),
    paddingHorizontal: hs(10),
    paddingVertical: vs(12),
    height: vs(44),
  },
  disabledBg: {
    backgroundColor: "#E1E9F4",
    opacity: 0.6,
  },
  primaryBtn: {
    backgroundColor: "#000000",
    borderRadius: ms(10),
    paddingVertical: vs(12),
    alignItems: "center",
    justifyContent: "center",
    marginTop: vs(20),
  },
  btnText: {
    fontSize: fs(20),
    color: COLORS.text.inverse,
  },
  pastOfferRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface.primary,
    borderRadius: ms(10),
    paddingHorizontal: hs(10),
    paddingVertical: vs(12),
    gap: hs(10),
  },
  pastOfferText: {
    flex: 1,
    color: COLORS.text.muted,
    fontSize: fs(14),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  optionsContainer: {
    width: "80%",
    backgroundColor: COLORS.background,
    borderRadius: ms(12),
    padding: ms(10),
  },
  optionItem: {
    paddingVertical: vs(12),
    paddingHorizontal: hs(15),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface.primary,
  },
});
