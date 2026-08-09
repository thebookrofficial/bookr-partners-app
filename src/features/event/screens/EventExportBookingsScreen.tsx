import React, { useState } from "react";
import { fetchEventBookings } from "../services/event.service";
import { View, StyleSheet, TouchableOpacity, Alert, Platform } from "react-native";
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { hs, vs, ms } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
import { Text } from "@/components/ui/Text";
import { Button } from "@/components/ui/Button";
import { PlatformDatePicker as DatePicker } from "@/components/ui/PlatformDatePicker";
import { Calendar } from "lucide-react-native";
import { useRoute, RouteProp } from "@react-navigation/native";
import { MainStackParamList } from "@/navigation/navigation.types";
import ReactNativeBlobUtil from "react-native-blob-util";
import Share from "react-native-share";

export const EventExportBookingsScreen = () => {
  const route = useRoute<RouteProp<MainStackParamList, "EventExportBookings">>();
  const { serviceId } = route.params;

  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const handleExport = async () => {
    try {
      const bookings = await fetchEventBookings(serviceId, startDate, endDate);

      // Create CSV content
      const header = "Booking ID,Guest Name,Guest Phone,Ticket Count,Total Amount,Status,Date\n";
      const rows = bookings
        .map(
          b =>
            `${b.id},${b.guest_name},${b.guest_phone},${b.ticket_count},${b.total_amount},${b.booking_status},${b.created_at}`,
        )
        .join("\n");
      const csvContent = header + rows;

      const { fs } = ReactNativeBlobUtil;
      const filePath = `${fs.dirs.CacheDir}/Bookings_Export.csv`;

      await fs.writeFile(filePath, csvContent, "utf8");

      await Share.open({
        url: Platform.OS === "ios" ? filePath : `file://${filePath}`,
        type: "text/csv",
        filename: "Bookings_Export",
      });

      Alert.alert("Success", "Export completed successfully!");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to export bookings.");
    }
  };

  return (
    <View style={styles.root}>
      <ScreenContainer scrollable backgroundColor={COLORS.background} paddingHorizontal={hs(12)}>
        <Text style={styles.title}>Export Bookings</Text>

        <View style={styles.container}>
          <TouchableOpacity
            style={styles.datePickerInput}
            onPress={() => setShowStartDatePicker(true)}>
            <Calendar size={ms(20)} color={COLORS.primary} />
            <Text style={styles.dateText}>Start Date: {startDate.toDateString()}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.datePickerInput}
            onPress={() => setShowEndDatePicker(true)}>
            <Calendar size={ms(20)} color={COLORS.primary} />
            <Text style={styles.dateText}>End Date: {endDate.toDateString()}</Text>
          </TouchableOpacity>

          <Button title="Export Bookings to Excel" onPress={handleExport} />
        </View>

        <View style={styles.historyContainer}>
          <Text style={styles.sectionTitle}>Previous Export History</Text>
          <View style={styles.historyItem}>
            <Text style={styles.historyText}>Export: 2026-05-20 to 2026-05-24</Text>
            <Text style={styles.historyDate}>2026-05-24 10:00 AM</Text>
          </View>
        </View>

        <DatePicker
          modal
          open={showStartDatePicker}
          date={startDate}
          mode="date"
          onConfirm={date => {
            setShowStartDatePicker(false);
            setStartDate(date);
          }}
          onCancel={() => setShowStartDatePicker(false)}
        />
        <DatePicker
          modal
          open={showEndDatePicker}
          date={endDate}
          mode="date"
          onConfirm={date => {
            setShowEndDatePicker(false);
            setEndDate(date);
          }}
          onCancel={() => setShowEndDatePicker(false)}
        />
      </ScreenContainer>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  title: {
    fontSize: ms(20),
    fontWeight: "bold",
    marginVertical: vs(20),
    color: COLORS.text.primary,
  },
  container: {
    gap: vs(20),
  },
  datePickerInput: {
    flexDirection: "row",
    alignItems: "center",
    padding: ms(12),
    borderWidth: 1,
    borderColor: COLORS.border.pillActive,
    borderRadius: ms(8),
    gap: hs(10),
  },
  dateText: {
    fontSize: ms(16),
    color: COLORS.text.primary,
  },
  historyContainer: {
    marginTop: vs(30),
    gap: vs(10),
  },
  sectionTitle: {
    fontSize: ms(18),
    fontWeight: "bold",
    color: COLORS.text.primary,
  },
  historyItem: {
    padding: ms(12),
    backgroundColor: COLORS.surface.primary,
    borderRadius: ms(8),
    borderWidth: 1,
    borderColor: COLORS.border.pillActive,
  },
  historyText: {
    fontSize: ms(14),
    color: COLORS.text.primary,
  },
  historyDate: {
    fontSize: ms(12),
    color: COLORS.text.secondary,
    marginTop: vs(4),
  },
});
