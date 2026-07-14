import React from "react";
import { Modal, TouchableOpacity, View, StyleSheet } from "react-native";
import { Calendar } from "react-native-calendars";
import { COLORS } from "@/constants/theme";
import { ms } from "@/utils/responsive.utils";

interface CustomDatePickerModalProps {
  isVisible: boolean;
  onClose: () => void;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  minDate?: Date;
}

export const CustomDatePickerModal: React.FC<CustomDatePickerModalProps> = ({
  isVisible,
  onClose,
  selectedDate,
  onSelectDate,
  minDate = new Date(),
}) => {
  const getLocalISODate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  return (
    <Modal visible={isVisible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.calendarContainer}>
          <Calendar
            current={getLocalISODate(selectedDate)}
            minDate={getLocalISODate(minDate)}
            onDayPress={(day: any) => {
              onSelectDate(new Date(day.year, day.month - 1, day.day));
              onClose();
            }}
            markedDates={{
              [getLocalISODate(selectedDate)]: {
                selected: true,
                selectedColor: COLORS.primary,
              },
            }}
            theme={{
              todayTextColor: COLORS.primary,
              arrowColor: COLORS.primary,
              textDayFontFamily: "Gilroy-SemiBold",
              textMonthFontFamily: "Gilroy-ExtraBold",
              textDayHeaderFontFamily: "Gilroy-SemiBold",
            }}
          />
        </View>
      </TouchableOpacity>
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
  calendarContainer: {
    width: "95%",
    maxWidth: ms(420),
    backgroundColor: COLORS.background,
    borderRadius: ms(16),
    padding: ms(16),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
