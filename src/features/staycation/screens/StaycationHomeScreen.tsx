// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { Text } from "@/components/ui";
import { StaycationHeader } from "../components/StaycationHeader";
import { StaycationBookingCard } from "../components/StaycationBookingCard";
import { Plus } from "lucide-react-native";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
import { useRoute, RouteProp } from "@react-navigation/native";
import { StaycationTabParamList } from "@/navigation/navigation.types";
import { useStaycationHome } from "../hooks/useStaycationHome";
import { Calendar } from "react-native-calendars";

const USER_PROFILE = require("../../../assets/icons/ic-user-profile.png");

const MOCK_BOOKINGS = [
  {
    id: "1",
    name: "Chirag Patil",
    phone: "+91 89346 93456",
    checkIn: "6 Apr",
    checkOut: "9 Apr",
    guestCount: 10,
    amount: "500",
    status: "Complete" as const,
  },
  {
    id: "2",
    name: "Yash Jadhav",
    phone: "+91 89346 93456",
    checkIn: "10 Apr",
    checkOut: "11 Apr",
    guestCount: 10,
    amount: "10000",
    status: "Complete" as const,
  },
  {
    id: "3",
    name: "Om Powar",
    phone: "+91 89346 93456",
    checkIn: "14 Apr",
    checkOut: "15 Apr",
    guestCount: 7,
    amount: "800",
    status: "Offline" as const,
  },
  {
    id: "4",
    name: "Yash Jadhav",
    phone: "+91 89346 93456",
    checkIn: "17 Apr",
    checkOut: "18 Apr",
    guestCount: 10,
    amount: "1000",
    status: "Advance" as const,
  },
  {
    id: "5",
    name: "Rohit Sharma",
    phone: "+91 89346 93456",
    checkIn: "13 Apr",
    checkOut: "14 Apr",
    guestCount: 8,
    amount: "500",
    status: "Advance" as const,
  },
];

export const StaycationHomeScreen = () => {
  const route = useRoute<RouteProp<StaycationTabParamList, "StaycationHome">>();
  const { serviceId } = route.params;
  const { venue } = useStaycationHome(serviceId);

  // Custom markings for the calendar based on status in Figma
  const markedDates: any = {
    "2026-05-01": {
      customStyles: {
        container: {
          borderWidth: 1,
          borderColor: "#8c8c8c",
          borderRadius: 4,
          justifyContent: "center",
          alignItems: "center",
        },
        text: { color: "black" },
      },
    },
    // manuel (Red) - using color from Figma #e55959
    "2026-05-10": {
      customStyles: {
        container: {
          backgroundColor: "#e55959",
          borderRadius: 4,
          justifyContent: "center",
          alignItems: "center",
        },
        text: { color: "white" },
      },
    },
    "2026-05-14": {
      customStyles: {
        container: {
          backgroundColor: "#e55959",
          borderRadius: 4,
          justifyContent: "center",
          alignItems: "center",
        },
        text: { color: "white" },
      },
    },
    "2026-05-19": {
      customStyles: {
        container: {
          backgroundColor: "#e55959",
          borderRadius: 4,
          justifyContent: "center",
          alignItems: "center",
        },
        text: { color: "white" },
      },
    },
    // Online (Blue) - using color from Figma #63a1fd
    "2026-05-06": {
      customStyles: {
        container: {
          backgroundColor: "#63a1fd",
          borderRadius: 4,
          justifyContent: "center",
          alignItems: "center",
        },
        text: { color: "white" },
      },
    },
    "2026-05-08": {
      customStyles: {
        container: {
          backgroundColor: "#63a1fd",
          borderRadius: 4,
          justifyContent: "center",
          alignItems: "center",
        },
        text: { color: "white" },
      },
    },
    "2026-05-17": {
      customStyles: {
        container: {
          backgroundColor: "#63a1fd",
          borderRadius: 4,
          justifyContent: "center",
          alignItems: "center",
        },
        text: { color: "white" },
      },
    },
  };

  return (
    <View style={styles.root}>
      <ScreenContainer scrollable backgroundColor={COLORS.background} paddingHorizontal={hs(12)}>
        <StaycationHeader
          title={venue?.name || "Vally view farmhouse"}
          subtitle="Bookings"
          imageSource={venue?.cover_image_url ? { uri: venue.cover_image_url } : USER_PROFILE}
        />

        {/* Status Legend */}
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={styles.availableDot} />
            <Text style={styles.legendText}>Available</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.dot, styles.manuelDot]} />
            <Text style={styles.legendText}>manuel</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.dot, styles.onlineDot]} />
            <Text style={styles.legendText}>Online</Text>
          </View>
        </View>

        {/* Inline Calendar */}
        <View style={styles.calendarContainer}>
          <Calendar
            current={"2026-05-01"}
            markingType={"custom"}
            markedDates={markedDates}
            renderArrow={direction => (
              <Text style={styles.calendarArrow}>{direction === "left" ? "<" : ">"}</Text>
            )}
            enableSwipeMonths={true}
            theme={
              {
                backgroundColor: "#ffffff",
                calendarBackground: "#ffffff",
                textSectionTitleColor: "#b3b3b3",
                selectedDayBackgroundColor: "#63a1fd",
                selectedDayTextColor: "#ffffff",
                todayTextColor: "black",
                dayTextColor: "#000000",
                textDisabledColor: "transparent",
                monthTextColor: "black",
                textDayFontFamily: "Gilroy-Bold",
                textMonthFontFamily: "Gilroy-Bold",
                textDayHeaderFontFamily: "Gilroy-Bold",
                textDayFontSize: fs(11),
                textMonthFontSize: fs(14),
                textDayHeaderFontSize: fs(14),
                "stylesheet.calendar.header": {
                  dayHeader: {
                    marginTop: 2,
                    marginBottom: 7,
                    width: 32,
                    textAlign: "center",
                    fontSize: fs(14),
                    fontFamily: "Gilroy-Bold",
                    color: "#b3b3b3",
                  },
                  dayTextAtIndex5: { color: "#009bff" },
                  dayTextAtIndex6: { color: "#009bff" },
                  header: {
                    flexDirection: "row",
                    justifyContent: "center",
                    paddingLeft: 10,
                    paddingRight: 10,
                    marginTop: 10,
                    alignItems: "center",
                    gap: hs(40),
                  },
                },
              } as any
            }
          />
        </View>

        {/* Bookings Section */}
        <View style={styles.bookingsHeader}>
          <Text style={styles.bookingsTitle}>Booking For April</Text>
        </View>

        <View style={styles.bookingsList}>
          {MOCK_BOOKINGS.map(booking => (
            <StaycationBookingCard key={booking.id} {...booking} />
          ))}
        </View>

        <View style={{ height: vs(120) }} />
      </ScreenContainer>

      <TouchableOpacity style={styles.fab} activeOpacity={0.8}>
        <Plus size={ms(30)} color={COLORS.text.inverse} strokeWidth={2} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(12),
    marginTop: vs(10),
    marginBottom: vs(10),
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(6),
  },
  dot: {
    width: ms(10),
    height: ms(10),
    borderRadius: ms(5),
  },
  availableDot: {
    width: ms(10),
    height: ms(10),
    borderRadius: ms(5),
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#CBDFFE",
  },
  manuelDot: {
    backgroundColor: "#e55959",
  },
  onlineDot: {
    backgroundColor: "#63a1fd",
  },
  legendText: {
    fontFamily: "Gilroy-Bold",
    fontSize: fs(14),
    color: COLORS.text.primary,
    textTransform: "lowercase",
  },
  calendarContainer: {
    backgroundColor: "#FFFFFF",
    marginBottom: vs(20),
  },
  calendarArrow: {
    fontSize: fs(16),
    fontFamily: "Gilroy-Bold",
    color: "black",
  },
  bookingsHeader: {
    marginBottom: vs(10),
  },
  bookingsTitle: {
    fontFamily: "Gilroy-Bold",
    fontSize: fs(20),
    color: COLORS.text.primary,
  },
  bookingsList: {
    gap: vs(2),
  },
  fab: {
    position: "absolute",
    right: hs(18),
    bottom: vs(100),
    width: ms(60),
    height: ms(60),
    borderRadius: ms(30),
    backgroundColor: "#63a1fd",
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 4,
  },
});
