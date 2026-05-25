// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, Modal } from "react-native";
import { Text } from "@/components/ui";
import { X, Calendar } from "lucide-react-native";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
import DateTimePicker from "@react-native-community/datetimepicker";

interface CustomRangeSheetProps {
  visible: boolean;
  onClose: () => void;
  onApply: (start: Date, end: Date) => void;
  initialRange?: { start: Date; end: Date };
}

export const CustomRangeSheet = ({
  visible,
  onClose,
  onApply,
  initialRange,
}: CustomRangeSheetProps) => {
  const [startDate, setStartDate] = useState<Date>(initialRange?.start || new Date());
  const [endDate, setEndDate] = useState<Date>(initialRange?.end || new Date());
  const [showPicker, setShowPicker] = useState<"start" | "end" | null>(null);

  useEffect(() => {
    if (visible && initialRange) {
      setStartDate(initialRange.start);
      setEndDate(initialRange.end);
    }
  }, [visible, initialRange]);

  const handleApply = () => {
    onApply(startDate, endDate);
    onClose();
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheetContainer}>
          <View style={styles.header}>
            <Text variant="h2" weight="bold" style={styles.title}>
              Selection
            </Text>
            <TouchableOpacity onPress={onClose}>
              <X size={ms(24)} color={COLORS.text.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.rangeContainer}>
            <View style={styles.dateCol}>
              <Text variant="body2" weight="bold" style={styles.label}>
                From Date
              </Text>
              <TouchableOpacity
                style={styles.datePickerBtn}
                onPress={() => setShowPicker("start")}
                activeOpacity={0.7}>
                <Calendar size={ms(18)} color={COLORS.primary} />
                <Text variant="body2" weight="semiBold" style={styles.dateText}>
                  {formatDate(startDate)}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.dateCol}>
              <Text variant="body2" weight="bold" style={styles.label}>
                To Date
              </Text>
              <TouchableOpacity
                style={styles.datePickerBtn}
                onPress={() => setShowPicker("end")}
                activeOpacity={0.7}>
                <Calendar size={ms(18)} color={COLORS.primary} />
                <Text variant="body2" weight="semiBold" style={styles.dateText}>
                  {formatDate(endDate)}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.applyBtn} onPress={handleApply} activeOpacity={0.8}>
            <Text variant="body1" weight="bold" style={styles.applyBtnText}>
              APPLY
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {showPicker && (
        <DateTimePicker
          value={showPicker === "start" ? startDate : endDate}
          mode="date"
          onChange={(event, date) => {
            setShowPicker(null);
            if (date) {
              if (showPicker === "start") setStartDate(date);
              else setEndDate(date);
            }
          }}
        />
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheetContainer: {
    backgroundColor: "#F4F7FC",
    borderTopLeftRadius: ms(20),
    borderTopRightRadius: ms(20),
    padding: ms(20),
    paddingBottom: vs(40),
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: vs(24),
  },
  title: {
    fontSize: fs(20),
  },
  rangeContainer: {
    flexDirection: "row",
    gap: hs(12),
    marginBottom: vs(30),
  },
  dateCol: {
    flex: 1,
    gap: vs(8),
  },
  label: {
    fontSize: fs(14),
  },
  datePickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: hs(12),
    height: vs(48),
    borderRadius: ms(10),
    gap: hs(8),
    borderWidth: 1,
    borderColor: "#CBDFFE",
  },
  dateText: {
    fontSize: fs(14),
  },
  applyBtn: {
    backgroundColor: "#282828",
    height: vs(50),
    borderRadius: ms(10),
    justifyContent: "center",
    alignItems: "center",
  },
  applyBtnText: {
    color: "#FFFFFF",
    fontSize: fs(18),
  },
});
