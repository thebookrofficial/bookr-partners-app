// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState, useCallback } from "react";
import { View, StyleSheet, TouchableOpacity, ScrollView, Modal } from "react-native";
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { Text, PillTabs, TextInput } from "@/components/ui";
import { ServiceHeader } from "@/features/sports/components/ServiceHeader";
import { Calendar, DateData } from "react-native-calendars";
import DatePicker from "react-native-date-picker";
import {
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  ChevronDown,
  Circle,
  Dot,
  ChevronLeft,
  ChevronRight,
} from "lucide-react-native";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
import { useRoute, RouteProp } from "@react-navigation/native";
import { DineTabParamList } from "@/navigation/navigation.types";
import { useDineHome } from "../hooks/useDineHome";

const USER_PROFILE = require("../../../assets/icons/ic-user-profile.png");

interface OfferRecord {
  id: string;
  type: "coupon" | "discount";
  code?: string;
  description: string;
  expiry?: string;
  startDate: string;
  endDate?: string;
  isPast?: boolean;
}

/**
 * DineOffersScreen - Manage coupons and discounts for a dine venue.
 * Matches Figma frames 6:81818, 6:82347, 6:81966, 6:82495.
 */
export const DineOffersScreen = () => {
  const route = useRoute<RouteProp<DineTabParamList, "DineOffers">>();
  const { serviceId } = route.params;
  const { venue } = useDineHome(serviceId);

  // Tabs State
  const [activeTab, setActiveTab] = useState<string>("Coupons");

  // Offers List State
  const [onGoingOffers, setOnGoingOffers] = useState<OfferRecord[]>([
    {
      id: "1",
      type: "coupon",
      code: "bookr12",
      description: "For 5% off above ₹1000 Bill",
      startDate: "19/04/2026",
    },
    {
      id: "2",
      type: "discount",
      description: "15% off on above ₹800 Bill",
      expiry: "7 Days Left",
      startDate: "19/04/2026",
    },
  ]);

  // Form State
  const [couponCode, setCouponCode] = useState("");
  const [offerValueType, setOfferValueType] = useState<"flat" | "percentage">("flat");
  const [flatAmount, setFlatAmount] = useState("100");
  const [percentage, setPercentage] = useState("5%");
  const [minOrderValue, setMinOrderValue] = useState("₹1000");
  const [uptoAmount, setUptoAmount] = useState("150");
  const [usageLimit, setUsageLimit] = useState("Everyone");
  const [totalUsage, setTotalUsage] = useState("1");

  // Dropdown Selection State
  const [activeDropdown, setActiveDropdown] = useState<{
    type: "percentage" | "minOrder" | "usageLimit" | "totalUsage";
    options: string[];
  } | null>(null);

  // Date Logic
  const [selectionMode, setSelectionMode] = useState<"single" | "range">("single");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateRange, setDateRange] = useState<{ start?: string; end?: string }>({});

  const formatDisplayDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleConfirmOffer = () => {
    const isCoupon = activeTab === "Coupons";
    const newOffer: OfferRecord = {
      id: Math.random().toString(36).substr(2, 9),
      type: isCoupon ? "coupon" : "discount",
      code: isCoupon ? couponCode : undefined,
      description: `${
        offerValueType === "flat" ? `₹${flatAmount} off` : `${percentage} off`
      } on above ${minOrderValue} Bill`,
      startDate:
        selectionMode === "single"
          ? selectedDate.toLocaleDateString("en-GB")
          : dateRange.start || "",
      endDate: selectionMode === "range" ? dateRange.end : undefined,
    };
    setOnGoingOffers(prev => [newOffer, ...prev]);
    // Reset basic form fields
    setCouponCode("");
    setSelectionMode("single");
    setDateRange({});
  };

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

  const deleteOffer = (id: string) => {
    setOnGoingOffers(prev => prev.filter(o => o.id !== id));
  };

  const onDayPress = useCallback(
    (day: DateData) => {
      if (selectionMode === "range") {
        if (!dateRange.start || (dateRange.start && dateRange.end)) {
          setDateRange({ start: day.dateString });
        } else {
          // Ensure end date is after start date
          if (new Date(day.dateString) >= new Date(dateRange.start)) {
            setDateRange(prev => ({ ...prev, end: day.dateString }));
          } else {
            setDateRange({ start: day.dateString });
          }
        }
      } else {
        setSelectedDate(new Date(day.timestamp));
      }
    },
    [selectionMode, dateRange],
  );

  const getMarkedDates = () => {
    const marked: any = {};
    if (selectionMode === "range") {
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
    } else {
      const dateString = selectedDate.toISOString().split("T")[0];
      marked[dateString] = {
        selected: true,
        color: COLORS.primary,
        textColor: COLORS.text.inverse,
      };
    }
    return marked;
  };

  const calculateDays = () => {
    if (!dateRange.start || !dateRange.end) return 0;
    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const filteredOngoing = onGoingOffers.filter(o =>
    activeTab === "Coupons" ? o.type === "coupon" : o.type === "discount",
  );

  return (
    <ScreenContainer backgroundColor={COLORS.background} paddingHorizontal={hs(12)}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerWrapper}>
          <ServiceHeader
            title={venue?.name || "Hotel tikka lab"}
            subtitle="Offers"
            imageSource={venue?.cover_image_url ? { uri: venue.cover_image_url } : USER_PROFILE}
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
          <Text variant="body2" weight="bold" style={styles.sectionTitle}>
            ON GOING {activeTab.toUpperCase()}
          </Text>
          {filteredOngoing.map(offer => (
            <View key={offer.id} style={styles.offerRow}>
              <View style={styles.greenDot} />
              <Text variant="body2" weight="semiBold" style={styles.offerText}>
                {offer.code ? `${offer.code} ` : ""}
                {offer.description}
              </Text>
              {offer.expiry && (
                <Text variant="caption" weight="semiBold" color={COLORS.text.muted}>
                  {offer.expiry}
                </Text>
              )}
              <TouchableOpacity onPress={() => deleteOffer(offer.id)}>
                <Trash2 size={ms(18)} color={COLORS.danger} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* CREATE OFFER FORM */}
        <View style={styles.section}>
          <Text variant="body2" weight="bold" style={styles.sectionTitle}>
            {activeTab === "Coupons" ? "CREATE COUPON" : "SET DISCOUNT OFFER"}
          </Text>

          {activeTab === "Coupons" && (
            <View style={styles.formGroup}>
              <Text variant="body2" weight="medium" style={styles.label}>
                Type Coupon Code
              </Text>
              <TextInput
                placeholder="Ex: BOOKR5"
                variant="filled"
                value={couponCode}
                onChangeText={setCouponCode}
                style={styles.filledInput}
              />
            </View>
          )}

          <View style={styles.formGroup}>
            <Text variant="body2" weight="medium" style={styles.label}>
              Select Upcoming Special Day/Days
            </Text>
            {selectionMode === "single" ? (
              <TouchableOpacity
                style={styles.inputContainer}
                onPress={() => setSelectionMode("range")}>
                <CalendarIcon size={ms(20)} color={COLORS.primary} />
                <Text variant="body2" weight="semiBold" style={styles.inputText}>
                  {selectedDate.toLocaleDateString("en-GB")}
                </Text>
                <Plus size={ms(24)} color={COLORS.text.primary} />
              </TouchableOpacity>
            ) : (
              <>
                <View style={styles.rangeInputs}>
                  <View style={styles.rangeColumn}>
                    <Text variant="body2" weight="medium" style={styles.subLabel}>
                      From
                    </Text>
                    <View style={styles.rangeInput}>
                      <Text variant="body2" weight="semiBold">
                        {dateRange.start ? formatDisplayDate(dateRange.start) : "Select Date"}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.rangeColumn}>
                    <Text variant="body2" weight="medium" style={styles.subLabel}>
                      To
                    </Text>
                    <View style={styles.rangeInput}>
                      <Text variant="body2" weight="semiBold">
                        {dateRange.end ? formatDisplayDate(dateRange.end) : "Select Date"}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.rangeStatus}>
                  <CalendarIcon size={ms(20)} color={COLORS.primary} />
                  <Text variant="body2" weight="medium" style={styles.rangeStatusText}>
                    {dateRange.start && dateRange.end
                      ? `${calculateDays()} Days will be selected`
                      : "Select range on calendar"}
                  </Text>
                </View>
              </>
            )}
          </View>

          {selectionMode === "range" && (
            <Calendar
              onDayPress={onDayPress}
              markedDates={getMarkedDates()}
              current={dateRange.start || new Date().toISOString().split("T")[0]}
              enableSwipeMonths={true}
              hideArrows={false}
              renderArrow={direction => (
                <View
                  style={{
                    padding: ms(4),
                    borderRadius: ms(20),
                    backgroundColor: COLORS.surface.primary,
                  }}>
                  {direction === "left" ? (
                    <ChevronLeft size={ms(20)} color={COLORS.primary} />
                  ) : (
                    <ChevronRight size={ms(20)} color={COLORS.primary} />
                  )}
                </View>
              )}
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
              markingType={"period"}
              style={styles.calendar}
            />
          )}

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
                style={styles.amountInput}
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
                <Text variant="body2" weight="semiBold">
                  {minOrderValue}
                </Text>
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
                  variant="body2"
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
                style={styles.amountInput}
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
                  variant="body2"
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
              <Text variant="body2" weight="semiBold">
                {usageLimit}
              </Text>
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
              <Text variant="body2" weight="semiBold">
                {totalUsage}
              </Text>
              <ChevronDown size={ms(18)} color={COLORS.text.primary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.primaryBtn} onPress={handleConfirmOffer}>
            <Text family="bison" weight="bold" style={styles.btnText}>
              {activeTab === "Coupons" ? "CONFIRM NEW COUPON" : "CONFIRM DISCOUNT OFFER"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* PAST OFFERS SECTION */}
        <View style={styles.section}>
          <Text variant="body2" weight="bold" style={styles.sectionTitle}>
            PAST {activeTab.toUpperCase()} OFFERS
          </Text>
          <View style={styles.pastOfferRow}>
            <CalendarIcon size={ms(20)} color={COLORS.text.muted} />
            <Text variant="body2" weight="semiBold" style={styles.pastOfferText}>
              12 Mar 2026
            </Text>
            <Text variant="body2" weight="semiBold" color={COLORS.text.muted}>
              5% OFF
            </Text>
          </View>
          <View style={styles.pastOfferRow}>
            <CalendarIcon size={ms(20)} color={COLORS.text.muted} />
            <Text variant="body2" weight="semiBold" style={styles.pastOfferText}>
              30 Dec 2026 - 1 Jan 2026
            </Text>
            <Text variant="body2" weight="semiBold" color={COLORS.text.muted}>
              7% OFF
            </Text>
          </View>
        </View>

        <DatePicker
          modal
          open={showDatePicker}
          date={selectedDate}
          mode="date"
          onConfirm={date => {
            setShowDatePicker(false);
            setSelectedDate(date);
          }}
          onCancel={() => {
            setShowDatePicker(false);
          }}
        />

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
      </ScrollView>
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
    gap: hs(160),
  },
  typesLabel: {
    fontSize: fs(18),
  },
  pillTabs: {
    flex: 1,
    marginVertical: 0,
  },
  section: {
    marginTop: vs(20),
    gap: vs(10),
  },
  sectionTitle: {
    fontSize: fs(16),
    textTransform: "uppercase",
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
  greenDot: {
    width: ms(10),
    height: ms(10),
    borderRadius: ms(5),
    backgroundColor: "#00B562",
  },
  offerText: {
    flex: 1,
  },
  formGroup: {
    gap: vs(4),
  },
  label: {
    textTransform: "capitalize",
  },
  labelWithInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(6),
  },
  subLabel: {
    textTransform: "capitalize",
    fontSize: fs(12),
    marginBottom: vs(2),
  },
  filledInput: {
    marginBottom: 0,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface.primary,
    borderRadius: ms(10),
    paddingHorizontal: hs(10),
    paddingVertical: vs(12),
    gap: hs(10),
  },
  inputText: {
    flex: 1,
    color: COLORS.text.muted,
  },
  rangeInputs: {
    flexDirection: "row",
    gap: hs(10),
  },
  rangeColumn: {
    flex: 1,
  },
  rangeInput: {
    backgroundColor: COLORS.surface.primary,
    borderRadius: ms(10),
    paddingHorizontal: hs(10),
    paddingVertical: vs(12),
    justifyContent: "center",
  },
  rangeStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(4),
    marginTop: vs(6),
  },
  rangeStatusText: {
    textTransform: "capitalize",
    color: COLORS.text.primary,
  },
  calendar: {
    marginTop: vs(10),
  },
  row: {
    flexDirection: "row",
    gap: hs(15),
  },
  flex1: {
    flex: 1,
    gap: vs(4),
  },
  radioLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(6),
  },
  amountInput: {
    marginBottom: 0,
    height: vs(44),
  },
  disabledBg: {
    backgroundColor: "#E1E9F4",
    opacity: 0.6,
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
  filledInputContainer: {
    backgroundColor: COLORS.surface.primary,
    borderRadius: ms(10),
    paddingHorizontal: hs(10),
    paddingVertical: vs(12),
    height: vs(44),
    justifyContent: "center",
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
  primaryBtn: {
    backgroundColor: "#282828",
    borderRadius: ms(10),
    paddingVertical: vs(12),
    alignItems: "center",
    justifyContent: "center",
    marginTop: vs(10),
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
  },
});
