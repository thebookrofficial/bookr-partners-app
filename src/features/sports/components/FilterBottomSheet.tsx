// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, Modal } from "react-native";
import { Text } from "@/components/ui";
import { X, Calendar } from "lucide-react-native";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
import DateTimePicker from "@react-native-community/datetimepicker";
// import { tr } from "zod/v4/locales";

export type DateFilterOption =
  | "all"
  | "yesterday"
  | "3_months"
  | "6_months"
  | "9_months"
  | "custom";

interface FilterBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  currentFilter: DateFilterOption;
  currentCustomRange?: { start: Date; end: Date };
  onApply: (filter: DateFilterOption, customRange?: { start: Date; end: Date }) => void;
}

export const FilterBottomSheet = ({
  visible,
  onClose,
  currentFilter,
  currentCustomRange,
  onApply,
}: FilterBottomSheetProps) => {
  const [tempFilter, setTempFilter] = useState<DateFilterOption>(currentFilter);
  const [tempCustomRange, setTempCustomRange] = useState<{ start: Date; end: Date }>(
    currentCustomRange || { start: new Date(), end: new Date() },
  );
  const [showDatePicker, setShowDatePicker] = useState<"start" | "end" | null>(null);

  // Reset local state when modal opens
  useEffect(() => {
    if (visible) {
      setTempFilter(currentFilter);
      if (currentCustomRange) setTempCustomRange(currentCustomRange);
    }
  }, [visible, currentFilter, currentCustomRange]);

  const handleApply = () => {
    onApply(tempFilter, tempFilter === "custom" ? tempCustomRange : undefined);
    onClose();
  };

  const filterOptions: { label: string; value: DateFilterOption }[] = [
    { label: "3 Months", value: "3_months" },
    { label: "6 Months", value: "6_months" },
    { label: "9 Months", value: "9_months" },
    { label: "Custom Range", value: "custom" },
  ];

  const formatDate = (d: Date) =>
    d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent={true}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />

        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Filter History</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={ms(24)} color={COLORS.text.primary} />
            </TouchableOpacity>
          </View>

          {/* Filter Pills */}
          <View style={styles.pillContainer}>
            {filterOptions.map(opt => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.pill, tempFilter === opt.value && styles.pillActive]}
                onPress={() => setTempFilter(opt.value)}>
                <Text style={[styles.pillText, tempFilter === opt.value && styles.pillTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Custom Date Range Picker UI */}
          {tempFilter === "custom" && (
            <View style={styles.customRangeContainer}>
              <View style={styles.dateCol}>
                <Text style={styles.dateLabel}>From Date</Text>
                <TouchableOpacity style={styles.dateBox} onPress={() => setShowDatePicker("start")}>
                  <Calendar size={ms(18)} color="#63A1FD" />
                  <Text style={styles.dateText}>{formatDate(tempCustomRange.start)}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.dateCol}>
                <Text style={styles.dateLabel}>To Date</Text>
                <TouchableOpacity style={styles.dateBox} onPress={() => setShowDatePicker("end")}>
                  <Calendar size={ms(18)} color="#63A1FD" />
                  <Text style={styles.dateText}>{formatDate(tempCustomRange.end)}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Apply Button */}
          <TouchableOpacity style={styles.applyBtn} onPress={handleApply}>
            <Text style={styles.applyBtnText}>APPLY FILTER</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Standard Date Picker Overlay */}
      {showDatePicker && (
        <DateTimePicker
          value={showDatePicker === "start" ? tempCustomRange.start : tempCustomRange.end}
          mode="date"
          onChange={(e, date) => {
            setShowDatePicker(null);
            if (date) {
              if (showDatePicker === "start")
                setTempCustomRange(prev => ({ ...prev, start: date }));
              else setTempCustomRange(prev => ({ ...prev, end: date }));
            }
          }}
        />
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" },
  backdrop: { ...StyleSheet.absoluteFillObject },
  sheetContainer: {
    backgroundColor: COLORS.surface.primary,
    borderTopLeftRadius: ms(24),
    borderTopRightRadius: ms(24),
    padding: ms(20),
    paddingBottom: vs(65),
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: vs(20),
  },
  title: { fontFamily: "Gilroy-Bold", fontSize: fs(20), color: COLORS.text.primary },
  closeBtn: { padding: ms(4) },

  pillContainer: { flexDirection: "row", flexWrap: "wrap", gap: hs(10), marginBottom: vs(20) },
  pill: {
    paddingVertical: vs(8),
    paddingHorizontal: hs(16),
    borderRadius: ms(20),
    borderWidth: 1,
    borderColor: COLORS.border.navBar,
    backgroundColor: COLORS.background,
  },
  pillActive: { backgroundColor: COLORS.text.primary, borderColor: COLORS.text.primary },
  pillText: { fontFamily: "Gilroy-SemiBold", fontSize: fs(14), color: COLORS.text.primary },
  pillTextActive: { color: COLORS.surface.primary },

  customRangeContainer: { flexDirection: "row", gap: hs(15), marginBottom: vs(20) },
  dateCol: { flex: 1, gap: vs(6) },
  dateLabel: { fontFamily: "Gilroy-Bold", fontSize: fs(14), color: COLORS.text.primary },
  dateBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(8),
    backgroundColor: COLORS.background,
    padding: ms(12),
    borderRadius: ms(10),
    borderWidth: 1,
    borderColor: COLORS.border.navBar,
  },
  dateText: { fontFamily: "Gilroy-SemiBold", fontSize: fs(14), color: COLORS.text.primary },

  applyBtn: {
    backgroundColor: COLORS.text.primary,
    height: vs(48),
    borderRadius: ms(10),
    justifyContent: "center",
    alignItems: "center",
    marginTop: vs(10),
  },
  applyBtnText: {
    fontFamily: "MDNichromeTest-Bold",
    fontSize: fs(22),
    color: COLORS.surface.primary,
  },
});
