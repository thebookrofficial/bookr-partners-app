// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Modal,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Text, TextInput } from "@/components/ui";
import {
  Calendar as CalendarIcon,
  Phone,
  User as UserIcon,
  Clock,
  FileText,
  ChevronRight,
  ChevronDown,
  Users,
  Star,
} from "lucide-react-native";
import { hs, vs, ms } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
import { Calendar } from "react-native-calendars";

interface DineOfflineBookingSheetProps {
  isVisible: boolean;
  onClose: () => void;
  selectedDate: Date;
  onSuccess: () => void;
}

const CustomLabel = ({ icon: Icon, text }: { icon: any; text: string }) => (
  <View style={styles.labelRow}>
    <Icon size={ms(18)} color={COLORS.primary} />
    <Text variant="body2" weight="medium" color={COLORS.text.primary}>
      {text}
    </Text>
  </View>
);

export const DineOfflineBookingSheet = ({
  isVisible,
  onClose,
  selectedDate: initialDate,
  onSuccess,
}: DineOfflineBookingSheetProps) => {
  const [currentDate, setCurrentDate] = useState<Date>(initialDate);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showGuestPicker, setShowGuestPicker] = useState(false);

  const [mobile, setMobile] = useState("");
  const [name, setName] = useState("");
  const [guestCount, setGuestCount] = useState("4");
  const [occasion, setOccasion] = useState("Birthday");
  const [selectedTime, setSelectedTime] = useState("8 Pm");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const TIME_SLOTS = [
    { time: "7 Pm", capacity: "0/100", status: "neutral" },
    { time: "7:30 Pm", capacity: "40/100", status: "available" },
    { time: "8 Pm", capacity: "51/100", status: "warning" },
    { time: "9 Pm", capacity: "52/100", status: "warning" },
    { time: "9:30 Pm", capacity: "73/100", status: "warning" },
    { time: "8:30 Pm", capacity: "80/100", status: "danger" },
  ];

  const GUEST_OPTIONS = Array.from({ length: 20 }, (_, i) => (i + 1).toString());

  useEffect(() => {
    if (isVisible) {
      setCurrentDate(initialDate);
    }
  }, [initialDate, isVisible]);

  const handleBookNow = () => {
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      onSuccess();
    }, 1500);
  };

  const getStatusColor = (status: string, isSelected: boolean) => {
    if (isSelected) return COLORS.primary;
    switch (status) {
      case "available":
        return "#00B562";
      case "warning":
        return "#FF8A3D";
      case "danger":
        return "#E55959";
      default:
        return "#8C8C8C";
    }
  };

  const getLocalISODate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
      statusBarTranslucent={true}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.bottomSheetContainer}>
          <View style={styles.handle} />

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.sheetContent}>
            {/* Header */}
            <View style={styles.sectionHeader}>
              <Text variant="body1" weight="bold" style={styles.headerText}>
                OFFLINE BOOKING
              </Text>
            </View>

            {/* Time Slots Section */}
            <View style={styles.timeSlotsSection}>
              <Text variant="body1" weight="bold" style={styles.sectionTitle}>
                TIME SLOTS
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.slotsScroll}>
                {TIME_SLOTS.map(slot => {
                  const isSelected = selectedTime === slot.time;
                  const statusColor = getStatusColor(slot.status, isSelected);
                  return (
                    <TouchableOpacity
                      key={slot.time}
                      onPress={() => setSelectedTime(slot.time)}
                      style={[styles.slotCard, isSelected && styles.selectedSlotCard]}>
                      <Text variant="body2" weight="semiBold" color={COLORS.text.primary}>
                        {slot.time}
                      </Text>
                      <Text variant="body2" weight="semiBold">
                        <Text style={{ color: statusColor }}>{slot.capacity.split("/")[0]}</Text>
                        <Text color={COLORS.text.primary}>/{slot.capacity.split("/")[1]}</Text>
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Form Fields */}
            <View style={styles.formGrid}>
              <View style={styles.row}>
                <TouchableOpacity style={styles.flex1} onPress={() => setIsDatePickerOpen(true)}>
                  <TextInput
                    label={<CustomLabel icon={CalendarIcon} text="Date" />}
                    value={currentDate.toLocaleDateString("en-GB")}
                    editable={false}
                    pointerEvents="none"
                    variant="filled"
                  />
                </TouchableOpacity>
                <TouchableOpacity style={styles.flex1} onPress={() => setShowTimePicker(true)}>
                  <TextInput
                    label={<CustomLabel icon={Clock} text="Time" />}
                    value={selectedTime}
                    rightIcon={<ChevronDown size={ms(18)} color={COLORS.text.primary} />}
                    editable={false}
                    pointerEvents="none"
                    variant="filled"
                  />
                </TouchableOpacity>
              </View>

              <TextInput
                label={<CustomLabel icon={Phone} text="Mobile No" />}
                value={mobile}
                onChangeText={setMobile}
                placeholder="+91 78349 89934"
                keyboardType="phone-pad"
                variant="filled"
              />

              <TextInput
                label={<CustomLabel icon={UserIcon} text="Name" />}
                value={name}
                onChangeText={setName}
                placeholder="Yash"
                variant="filled"
              />

              <View style={styles.row}>
                <TouchableOpacity style={styles.flex1} onPress={() => setShowGuestPicker(true)}>
                  <TextInput
                    label={<CustomLabel icon={Users} text="No of guest" />}
                    value={guestCount}
                    rightIcon={<ChevronDown size={ms(18)} color={COLORS.text.primary} />}
                    editable={false}
                    pointerEvents="none"
                    variant="filled"
                  />
                </TouchableOpacity>
                <View style={styles.flex1}>
                  <TextInput
                    label={<CustomLabel icon={Star} text="Occasion" />}
                    value={occasion}
                    onChangeText={setOccasion}
                    variant="filled"
                  />
                </View>
              </View>
            </View>

            {/* History Row */}
            <TouchableOpacity style={styles.historyRow} activeOpacity={0.7}>
              <View style={styles.historyLeft}>
                <FileText size={ms(20)} color={COLORS.text.primary} />
                <Text variant="body2" weight="semiBold" style={styles.historyText}>
                  Previous History
                </Text>
              </View>
              <ChevronRight size={ms(20)} color={COLORS.text.primary} />
            </TouchableOpacity>

            {/* Book Now Button */}
            <TouchableOpacity
              style={[styles.bookButton, isSubmitting && styles.disabledButton]}
              onPress={handleBookNow}
              disabled={isSubmitting}>
              {isSubmitting ? (
                <ActivityIndicator color={COLORS.text.inverse} />
              ) : (
                <Text
                  variant="h3"
                  weight="bold"
                  color={COLORS.text.inverse}
                  style={styles.bookButtonText}>
                  BOOK NOW
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Date Picker Modal */}
      <Modal
        visible={isDatePickerOpen}
        transparent
        animationType="fade"
        hardwareAccelerated
        statusBarTranslucent
        onRequestClose={() => setIsDatePickerOpen(false)}>
        <View style={styles.modalOverlayCenter}>
          <TouchableWithoutFeedback onPress={() => setIsDatePickerOpen(false)}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>
          <View style={styles.calendarModal}>
            <Calendar
              current={getLocalISODate(currentDate)}
              onDayPress={(day: any) => {
                // Use local components to avoid UTC timezone shifts
                setCurrentDate(new Date(day.year, day.month - 1, day.day));
                setIsDatePickerOpen(false);
              }}
              markedDates={{
                [getLocalISODate(currentDate)]: {
                  selected: true,
                  selectedColor: COLORS.primary,
                },
              }}
            />
          </View>
        </View>
      </Modal>

      {/* Time Selection Modal */}
      <Modal
        visible={showTimePicker}
        transparent
        animationType="fade"
        hardwareAccelerated
        statusBarTranslucent
        onRequestClose={() => setShowTimePicker(false)}>
        <View style={styles.modalOverlayCenter}>
          <TouchableWithoutFeedback onPress={() => setShowTimePicker(false)}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>
          <View style={styles.selectionModal}>
            <Text variant="body1" weight="bold" style={styles.pickerTitle}>
              Select Time
            </Text>
            <ScrollView style={styles.selectionList} showsVerticalScrollIndicator={true}>
              {TIME_SLOTS.map(slot => (
                <TouchableOpacity
                  key={slot.time}
                  style={styles.selectionItem}
                  onPress={() => {
                    setSelectedTime(slot.time);
                    setShowTimePicker(false);
                  }}>
                  <Text variant="body1" color={COLORS.text.primary}>
                    {slot.time}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Guest Selection Modal */}
      <Modal
        visible={showGuestPicker}
        transparent
        animationType="fade"
        hardwareAccelerated
        statusBarTranslucent
        onRequestClose={() => setShowGuestPicker(false)}>
        <View style={styles.modalOverlayCenter}>
          <TouchableWithoutFeedback onPress={() => setShowGuestPicker(false)}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>
          <View style={styles.selectionModal}>
            <Text variant="body1" weight="bold" style={styles.pickerTitle}>
              No of Guests
            </Text>
            <ScrollView style={styles.selectionList} showsVerticalScrollIndicator={true}>
              {GUEST_OPTIONS.map(count => (
                <TouchableOpacity
                  key={count}
                  style={styles.selectionItem}
                  onPress={() => {
                    setGuestCount(count);
                    setShowGuestPicker(false);
                  }}>
                  <Text variant="body1" color={COLORS.text.primary}>
                    {count}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalOverlayCenter: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  bottomSheetContainer: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: ms(20),
    borderTopRightRadius: ms(20),
    paddingTop: vs(10),
    paddingHorizontal: hs(12),
    paddingBottom: vs(30),
    maxHeight: "90%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 5,
  },
  handle: {
    width: hs(40),
    height: vs(4),
    backgroundColor: COLORS.surface.fallback,
    borderRadius: ms(2),
    alignSelf: "center",
    marginBottom: vs(10),
  },
  sheetContent: {
    gap: vs(15),
  },
  sectionHeader: {
    paddingHorizontal: hs(6),
  },
  headerText: {
    fontSize: ms(16),
    color: COLORS.text.primary,
  },
  timeSlotsSection: {
    gap: vs(10),
    paddingHorizontal: hs(6),
  },
  sectionTitle: {
    fontSize: ms(16),
    color: COLORS.text.primary,
  },
  slotsScroll: {
    flexDirection: "row",
  },
  slotCard: {
    width: hs(60),
    height: vs(76),
    backgroundColor: "#F4F7FC",
    borderRadius: ms(25),
    borderWidth: 1,
    borderColor: "#CBDFFE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: hs(10),
    gap: vs(8),
  },
  selectedSlotCard: {
    borderColor: "rgba(99, 161, 253, 0.8)",
    backgroundColor: "#F4F7FC",
  },
  formGrid: {
    gap: vs(12),
  },
  row: {
    flexDirection: "row",
    gap: hs(20),
  },
  flex1: {
    flex: 1,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(6),
    marginBottom: vs(4),
  },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#CBDFFE",
    borderRadius: ms(10),
    paddingHorizontal: hs(12),
    paddingVertical: vs(12),
    marginTop: vs(5),
  },
  historyLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(8),
  },
  historyText: {
    fontSize: ms(14),
  },
  bookButton: {
    backgroundColor: "#000000",
    borderRadius: ms(10),
    height: vs(48),
    justifyContent: "center",
    alignItems: "center",
    marginTop: vs(10),
  },
  bookButtonText: {
    fontSize: ms(20),
    fontFamily: "Bison-Bold", // Matches design
  },
  disabledButton: {
    opacity: 0.6,
  },
  calendarModal: {
    backgroundColor: COLORS.background,
    borderRadius: ms(12),
    padding: ms(10),
    width: "90%",
  },
  selectionModal: {
    backgroundColor: COLORS.background,
    borderRadius: ms(12),
    padding: ms(20),
    width: "80%",
    maxHeight: "60%",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  pickerTitle: {
    textAlign: "center",
    marginBottom: vs(15),
    fontSize: ms(18),
  },
  selectionList: {
    width: "100%",
  },
  selectionItem: {
    paddingVertical: vs(12),
    borderBottomWidth: 1,
    borderBottomColor: "#CBDFFE",
    alignItems: "center",
  },
});
