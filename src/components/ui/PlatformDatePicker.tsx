// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React from "react";
import { Platform, Modal, View, TouchableOpacity, Text, StyleSheet } from "react-native";
import RNDatePicker, { DatePickerProps } from "react-native-date-picker";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";

type PlatformDatePickerProps = Omit<DatePickerProps, "onConfirm" | "onCancel"> & {
  open?: boolean;
  onConfirm?: (date: Date) => void;
  onCancel?: () => void;
};

/**
 * A wrapper component that conditionally renders different date pickers based on the platform.
 * - Android: react-native-date-picker
 * - iOS: @react-native-community/datetimepicker
 *
 * This resolves the React Native 0.81 New Architecture incompatibility with react-native-date-picker on iOS,
 * while preserving the exact original UI/UX on Android.
 */
export const PlatformDatePicker: React.FC<PlatformDatePickerProps> = ({
  open,
  date,
  mode = "date",
  onConfirm,
  onCancel,
  minimumDate,
  maximumDate,
  title = "Select Date",
  ...rest
}) => {
  if (Platform.OS === "android") {
    return (
      <RNDatePicker
        modal
        open={open}
        date={date}
        mode={mode}
        onConfirm={onConfirm}
        onCancel={onCancel}
        minimumDate={minimumDate}
        maximumDate={maximumDate}
        {...rest}
      />
    );
  }

  // iOS rendering
  if (!open) return null;

  let tempDate = date;

  const handleChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (selectedDate) {
      tempDate = selectedDate;
    }
  };

  return (
    <Modal visible={open} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>{title}</Text>
          <DateTimePicker
            value={date}
            mode={mode}
            display="spinner"
            onChange={handleChange}
            minimumDate={minimumDate}
            maximumDate={maximumDate}
          />
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.button} onPress={onCancel}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => onConfirm?.(tempDate)}>
              <Text style={[styles.buttonText, { fontWeight: "bold" }]}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    paddingHorizontal: 20,
  },
  button: {
    padding: 10,
  },
  buttonText: {
    fontSize: 16,
    color: "#007AFF",
  },
});
