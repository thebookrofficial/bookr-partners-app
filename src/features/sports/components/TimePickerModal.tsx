// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from "react-native";
import { Text } from "@/components/ui";
import { COLORS } from "@/constants/theme";
import { vs, ms, fs } from "@/utils/responsive.utils";

import { getValidSlotsForGround } from "../utils/pricing.utils";

interface TimePickerModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  hours: string[];
  selectedTime: string;
  onSelectTime: (time: string) => void;
  isHourDisabled?: (hour: string, index: number) => boolean;
  isFetching?: boolean;
  useModal?: boolean;
  ground?: any;
  allGrounds?: any[];
}

export const TimePickerModal = ({
  visible,
  onClose,
  title,
  hours,
  selectedTime,
  onSelectTime,
  isHourDisabled,
  isFetching,
  useModal = true,
  ground,
  allGrounds,
}: TimePickerModalProps) => {
  const formatDisplayHour = (hr: string) => {
    // If it already contains a colon, we assume it has minutes and just lowercase the AM/PM
    if (hr.includes(":")) {
      return hr.toLowerCase();
    }
    const parts = hr.split(" ");
    if (parts.length === 2) {
      return `${parts[0]}:00 ${parts[1].toLowerCase()}`;
    }
    return hr.toLowerCase();
  };

  const validHours = React.useMemo(() => {
    return ground ? getValidSlotsForGround(ground, hours, allGrounds) : hours;
  }, [ground, hours, allGrounds]);

  const content = (
    <View style={[styles.modalOverlay, !useModal && styles.absoluteOverlay]} pointerEvents="auto">
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={StyleSheet.absoluteFillObject} />
      </TouchableWithoutFeedback>
      <View style={styles.timePickerContainer}>
        <Text variant="h3" weight="bold" style={styles.pickerHeader}>
          {title}
        </Text>
        {isFetching ? (
          <View style={{ paddingVertical: 20 }}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.timePickerGrid}>
            {validHours.map((hour, idx) => {
              const displayHour = formatDisplayHour(hour);
              const isDisabled = isHourDisabled ? isHourDisabled(hour, idx) : false;

              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.timePickerItem,
                    selectedTime === hour && styles.timePickerItemActive,
                    isDisabled && { opacity: 0.3 },
                  ]}
                  onPress={() => !isDisabled && onSelectTime(hour)}
                  activeOpacity={isDisabled ? 1 : 0.7}
                  disabled={isDisabled}>
                  <Text
                    weight={selectedTime === hour ? "bold" : "medium"}
                    color={selectedTime === hour ? "#fff" : COLORS.text.primary}
                    style={{ fontSize: fs(14) }}>
                    {displayHour}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>
    </View>
  );

  if (useModal) {
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        {content}
      </Modal>
    );
  }

  return visible ? content : null;
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  absoluteOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
  },
  timePickerContainer: {
    width: "90%",
    maxHeight: "60%",
    backgroundColor: COLORS.background,
    borderRadius: ms(12),
    padding: ms(16),
  },
  pickerHeader: {
    marginBottom: vs(15),
    textAlign: "center",
    textTransform: "uppercase",
  },
  timePickerGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    gap: ms(8),
  },
  timePickerItem: {
    width: "23%",
    paddingVertical: vs(10),
    borderRadius: ms(6),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5F5F5",
  },
  timePickerItemActive: {
    backgroundColor: COLORS.primary,
    opacity: 1,
  },
  timePickerItemDisabled: {
    backgroundColor: "#F5F5F5",
    opacity: 0.4,
  },
  timePickerItemText: {
    fontSize: fs(12),
    color: COLORS.text.primary,
  },
  timePickerItemTextActive: {
    color: "#FFF",
    fontWeight: "bold",
  },
});
