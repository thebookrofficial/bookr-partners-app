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
  blockedDates?: string[];
  bookingDots?: Record<string, { key: string; color: string }[]>;
  useModal?: boolean;
}

export const CustomDatePickerModal: React.FC<CustomDatePickerModalProps> = ({
  isVisible,
  onClose,
  selectedDate,
  onSelectDate,
  minDate = new Date(),
  blockedDates = [],
  bookingDots = {},
  useModal = true,
}) => {
  const getLocalISODate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  if (!isVisible) return null;

  const content = (
    <TouchableOpacity
      style={[styles.modalOverlay, !useModal && styles.absoluteOverlay]}
      activeOpacity={1}
      onPress={onClose}>
      <View style={styles.calendarContainer}>
        <Calendar
          current={getLocalISODate(selectedDate)}
          minDate={getLocalISODate(minDate)}
          hideExtraDays={true}
          onDayPress={(day: any) => {
            const dateStr = day.dateString;
            if (blockedDates.includes(dateStr)) return;
            onSelectDate(new Date(day.year, day.month - 1, day.day));
            onClose();
          }}
          markingType={"multi-dot"}
          markedDates={{
            ...Object.keys(bookingDots).reduce((acc, date) => {
              acc[date] = { dots: bookingDots[date] };
              return acc;
            }, {} as any),
            ...blockedDates.reduce((acc, date) => {
              acc[date] = {
                ...(bookingDots[date] ? { dots: bookingDots[date] } : {}),
                disabled: true,
                disableTouchEvent: true,
                textColor: "#d9e1e8",
              };
              return acc;
            }, {} as any),
            [getLocalISODate(selectedDate)]: {
              ...(bookingDots[getLocalISODate(selectedDate)]
                ? { dots: bookingDots[getLocalISODate(selectedDate)] }
                : {}),
              ...(blockedDates.includes(getLocalISODate(selectedDate))
                ? { disabled: true, disableTouchEvent: true }
                : {}),
              selected: true,
              selectedColor: "#000000",
              selectedTextColor: "#FFFFFF",
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
  );

  if (useModal) {
    return (
      <Modal visible={isVisible} transparent={true} animationType="fade" onRequestClose={onClose}>
        {content}
      </Modal>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  absoluteOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    elevation: 9999,
  },
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
