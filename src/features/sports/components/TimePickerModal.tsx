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

interface TimePickerModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  hours: string[];
  selectedTime: string;
  onSelectTime: (time: string) => void;
  isHourDisabled?: (hour: string, index: number) => boolean;
  isFetching?: boolean;
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
}: TimePickerModalProps) => {
  const formatDisplayHour = (hr: string) => {
    const parts = hr.split(" ");
    if (parts.length === 2) {
      return `${parts[0]}:00 ${parts[1].toLowerCase()}`;
    }
    return hr.toLowerCase();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.timePickerContainer}>
              <Text variant="body1" weight="bold" style={styles.pickerHeader}>
                {title}
              </Text>
              {isFetching ? (
                <ActivityIndicator color={COLORS.primary} style={{ margin: vs(20) }} />
              ) : (
                <ScrollView showsVerticalScrollIndicator={false}>
                  <View style={styles.timePickerGrid}>
                    {hours.map((hour, index) => {
                      const isDisabled = isHourDisabled ? isHourDisabled(hour, index) : false;
                      const isSelected = selectedTime === hour;

                      return (
                        <TouchableOpacity
                          key={hour}
                          style={[
                            styles.timePickerItem,
                            isSelected && styles.timePickerItemActive,
                            isDisabled && styles.timePickerItemDisabled,
                          ]}
                          disabled={isDisabled}
                          onPress={() => {
                            onSelectTime(hour);
                            onClose();
                          }}>
                          <Text
                            style={[
                              styles.timePickerItemText,
                              isSelected && styles.timePickerItemTextActive,
                              isDisabled && { color: COLORS.text.secondary },
                            ]}>
                            {formatDisplayHour(hour)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
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
