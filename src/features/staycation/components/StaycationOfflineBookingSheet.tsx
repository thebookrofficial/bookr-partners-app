// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Alert,
  Share,
} from "react-native";
import { Text } from "@/components/ui";
import {
  User,
  Phone,
  Calendar,
  ChevronDown,
  FileText,
  ChevronRight,
  Wallet,
} from "lucide-react-native";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { supabase } from "@/lib/supabase";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MainStackParamList } from "@/navigation/navigation.types";
import { useCreateStaycationOfflineBooking } from "../hooks/useCreateStaycationOfflineBooking";

interface StaycationOfflineBookingSheetProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  activeCategory: "Farmhouse" | "Rooms";
  venueId: string;
}

export const StaycationOfflineBookingSheet = ({
  visible,
  onClose,
  onSuccess,
  activeCategory,
  venueId,
}: StaycationOfflineBookingSheetProps) => {
  const isFarmhouse = activeCategory === "Farmhouse";
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { createBooking, isLoading } = useCreateStaycationOfflineBooking();

  const [bookingFor, setBookingFor] = useState(isFarmhouse ? "Farmhouse" : "Cottages");
  const [roomType, setRoomType] = useState("Private Room");
  const [guestCount, setGuestCount] = useState(isFarmhouse ? "10" : "2");
  const [groupType, setGroupType] = useState("Family");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [totalPayment, setTotalPayment] = useState(isFarmhouse ? "1000" : "2500");
  const [advancePaid, setAdvancePaid] = useState("");

  const [checkInDate, setCheckInDate] = useState(new Date());
  const [checkOutDate, setCheckOutDate] = useState(
    new Date(new Date().setDate(new Date().getDate() + 1)),
  );
  const [showDatePicker, setShowDatePicker] = useState<"in" | "out" | null>(null);

  const [activeDropdown, setActiveDropdown] = useState<{
    type: string;
    options: string[];
    title: string;
  } | null>(null);

  const [hasHistory, setHasHistory] = useState(false);

  useEffect(() => {
    const lookupGuest = async () => {
      const cleanMobile = phone.replace(/[^\d]/g, "");

      if (cleanMobile.length !== 10) {
        setHasHistory(false);
        return;
      }

      const phoneVariants = [cleanMobile, `+91${cleanMobile}`, `+91 ${cleanMobile}`];
      const phoneOrQuery = phoneVariants.map(v => `phone.eq.${v}`).join(",");
      const guestPhoneOrQuery = phoneVariants.map(v => `guest_phone.eq.${v}`).join(",");

      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, full_name")
          .or(phoneOrQuery)
          .maybeSingle();

        let foundName = profile?.full_name || "";

        if (!foundName) {
          const { data: stayBooking } = await supabase
            .from("staycation_bookings")
            .select("guest_name")
            .or(guestPhoneOrQuery)
            .not("guest_name", "is", null)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (stayBooking?.guest_name) {
            foundName = stayBooking.guest_name;
          }
        }

        if (!foundName) {
          const { data: sportsBooking } = await supabase
            .from("sports_bookings")
            .select("guest_name")
            .or(guestPhoneOrQuery)
            .not("guest_name", "is", null)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (sportsBooking?.guest_name) {
            foundName = sportsBooking.guest_name;
          }
        }

        if (foundName) {
          setName(foundName);
        }

        const historyOrQuery = guestPhoneOrQuery + (profile?.id ? `,user_id.eq.${profile.id}` : "");
        const { count, error: historyError } = await supabase
          .from("staycation_bookings")
          .select("id", { count: "exact", head: true })
          .or(historyOrQuery);

        setHasHistory(!historyError && !!count && count > 0);
      } catch (err) {
        console.error("Lookup error:", err);
      }
    };

    lookupGuest();
  }, [phone]);

  useEffect(() => {
    setBookingFor(isFarmhouse ? "Farmhouse" : "Rooms");
    setGuestCount(isFarmhouse ? "" : "");
    setTotalPayment(isFarmhouse ? "" : "");
    setName("");
    setPhone("");
    setAdvancePaid("");
  }, [isFarmhouse, visible]);

  const handleDropdownSelect = (option: string) => {
    if (!activeDropdown) return;
    if (activeDropdown.type === "bookingFor") setBookingFor(option);
    if (activeDropdown.type === "roomType") setRoomType(option);
    if (activeDropdown.type === "guestCount") setGuestCount(option);
    if (activeDropdown.type === "groupType") setGroupType(option);
    setActiveDropdown(null);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const handleBookNow = async () => {
    if (!venueId) {
      Alert.alert("Error", "Venue information missing.");
      return;
    }

    const finalName = name.trim() || "Offline Guest";
    const finalPhone = phone.trim() || "";

    const result = await createBooking({
      venueId,
      guestName: finalName,
      guestPhone: finalPhone,
      checkInDate: checkInDate,
      checkOutDate: checkOutDate,
      guestCount: parseInt(guestCount, 10) || 1,
      totalPayment: parseFloat(totalPayment) || 0,
      advancePaid: parseFloat(advancePaid) || 0,
      bookingType: bookingFor.toLowerCase(),
      roomType: isFarmhouse ? undefined : roomType,
      groupType: isFarmhouse ? groupType : undefined,
    });

    if (result.success) {
      // 1. Calculate due dynamically
      const dueAmount = (parseFloat(totalPayment) || 0) - (parseFloat(advancePaid) || 0);

      // 2. Build the dynamic template string
      const shareMessage = `Booking Confirmed! 🎉
Hi ${finalName},
Your slot at ${result.venueName || "our venue"} is locked in via Bookr.
Date: ${formatDate(checkInDate)} to ${formatDate(checkOutDate)}
Payment Summary:
Total: ₹${totalPayment || 0}
Paid: ₹${advancePaid || 0}
Due at Venue: ₹${dueAmount}
Thank you for booking with Bookr!`;

      // 3. Trigger Native Share
      try {
        await Share.share({
          message: shareMessage,
        });
      } catch (error) {
        console.warn("Error sharing message:", error);
      }

      Alert.alert("Success", "Offline booking created successfully.");
      onSuccess?.();
      onClose();
    } else {
      Alert.alert("Error", "Failed to create booking.");
    }
  };

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (event.type === "set" && selectedDate) {
      if (showDatePicker === "in") {
        setCheckInDate(selectedDate);
        const tomorrow = new Date(selectedDate);
        tomorrow.setDate(tomorrow.getDate() + 1);
        if (selectedDate >= checkOutDate) {
          setCheckOutDate(tomorrow);
        }
      } else if (showDatePicker === "out") {
        if (selectedDate <= checkInDate) {
          Alert.alert("Invalid Date", "Check-out date must be after check-in date.");
        } else {
          setCheckOutDate(selectedDate);
        }
      }
    }
    setShowDatePicker(null);
  };

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={onClose}
        statusBarTranslucent={true}>
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

          <View style={styles.sheetContainer}>
            <View style={styles.header}>
              <Text weight="bold" style={styles.title}>
                OFFLINE BOOKING
              </Text>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}>
              {/* Name */}
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <User size={ms(20)} color={COLORS.text.primary} />
                  <Text weight="medium" style={styles.label}>
                    Name
                  </Text>
                </View>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Yash"
                    placeholderTextColor={COLORS.text.muted}
                    value={name}
                    onChangeText={setName}
                  />
                </View>
              </View>

              {/* Mobile No */}
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Phone size={ms(20)} color={COLORS.text.primary} />
                  <Text weight="medium" style={styles.label}>
                    Mobile No
                  </Text>
                </View>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="+91 78349 89934"
                    placeholderTextColor={COLORS.text.muted}
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={setPhone}
                  />
                </View>
              </View>

              {/* Booking For & Type */}
              <View style={styles.row}>
                <View style={styles.col}>
                  <View style={styles.labelRow}>
                    <Text weight="medium" style={styles.label}>
                      Booking For
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.dropdownWrapper}
                    activeOpacity={0.7}
                    onPress={() =>
                      setActiveDropdown({
                        type: "bookingFor",
                        options: ["Farmhouse", "Cottages"],
                        title: "Select Booking Type",
                      })
                    }>
                    <Text weight="semiBold" style={styles.dropdownText}>
                      {bookingFor}
                    </Text>
                    <ChevronDown size={ms(16)} color={COLORS.text.primary} />
                  </TouchableOpacity>
                </View>
                <View style={styles.col}>
                  <View style={styles.labelRow}>
                    <Text weight="medium" style={styles.label}>
                      Type
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.dropdownWrapper}
                    activeOpacity={0.7}
                    disabled={isFarmhouse}
                    onPress={() =>
                      setActiveDropdown({
                        type: "roomType",
                        options: ["Private Room", "Deluxe Room"],
                        title: "Select Room Type",
                      })
                    }>
                    <Text
                      weight="semiBold"
                      style={[styles.dropdownText, isFarmhouse && styles.mutedText]}>
                      {isFarmhouse ? "-" : roomType}
                    </Text>
                    {!isFarmhouse && <ChevronDown size={ms(16)} color={COLORS.text.primary} />}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Check In & Check Out */}
              <View style={styles.row}>
                <View style={styles.col}>
                  <View style={styles.labelRow}>
                    <Calendar size={ms(20)} color={COLORS.text.primary} />
                    <Text weight="medium" style={styles.label}>
                      Check In
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.inputWrapper}
                    activeOpacity={0.7}
                    onPress={() => setShowDatePicker("in")}>
                    <Text weight="semiBold" style={styles.inputText}>
                      {formatDate(checkInDate)}
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.col}>
                  <View style={styles.labelRow}>
                    <Calendar size={ms(20)} color={COLORS.text.primary} />
                    <Text weight="medium" style={styles.label}>
                      Check Out
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.inputWrapper}
                    activeOpacity={0.7}
                    onPress={() => setShowDatePicker("out")}>
                    <Text weight="semiBold" style={styles.inputText}>
                      {formatDate(checkOutDate)}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Guest Selection */}
              {isFarmhouse ? (
                <View style={styles.row}>
                  <View style={styles.col}>
                    <View style={styles.labelRow}>
                      <User size={ms(20)} color={COLORS.text.primary} />
                      <Text weight="medium" style={styles.label}>
                        Select Guest
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.dropdownWrapper}
                      activeOpacity={0.7}
                      onPress={() =>
                        setActiveDropdown({
                          type: "guestCount",
                          options: Array.from({ length: 20 }, (_, i) => (i + 1).toString()),
                          title: "Select Guest Count",
                        })
                      }>
                      <Text weight="semiBold" style={styles.dropdownText}>
                        {guestCount}
                      </Text>
                      <ChevronDown size={ms(16)} color={COLORS.text.primary} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.col}>
                    <View style={styles.labelRow}>
                      <User size={ms(20)} color={COLORS.text.primary} />
                      <Text weight="medium" style={styles.label}>
                        Group Type
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.dropdownWrapper}
                      activeOpacity={0.7}
                      onPress={() =>
                        setActiveDropdown({
                          type: "groupType",
                          options: ["Family", "Friends", "Corporate", "Couple", "Other"],
                          title: "Select Group Type",
                        })
                      }>
                      <Text weight="medium" style={styles.dropdownText}>
                        {groupType}
                      </Text>
                      <ChevronDown size={ms(16)} color={COLORS.text.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.inputGroup}>
                  <View style={styles.labelRow}>
                    <User size={ms(20)} color={COLORS.text.primary} />
                    <Text weight="medium" style={styles.label}>
                      Select Guest
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.dropdownWrapper}
                    activeOpacity={0.7}
                    onPress={() =>
                      setActiveDropdown({
                        type: "guestCount",
                        options: Array.from({ length: 10 }, (_, i) => (i + 1).toString()),
                        title: "Select Guest Count",
                      })
                    }>
                    <Text weight="medium" style={styles.dropdownText}>
                      Select the number of Guest
                    </Text>
                    <View style={styles.guestCountRight}>
                      <Text weight="semiBold" style={styles.guestCountNum}>
                        {guestCount}
                      </Text>
                      <ChevronDown size={ms(16)} color={COLORS.text.primary} />
                    </View>
                  </TouchableOpacity>
                </View>
              )}

              {/* Payment Details */}
              <View style={styles.row}>
                <View style={styles.col}>
                  <View style={styles.labelRow}>
                    <Wallet size={ms(20)} color={COLORS.text.primary} />
                    <Text weight="medium" style={styles.label}>
                      Total Payment
                    </Text>
                  </View>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.textInput}
                      placeholder={isFarmhouse ? "₹ 1000" : "₹ 2500"}
                      placeholderTextColor={COLORS.text.primary}
                      keyboardType="numeric"
                      value={totalPayment}
                      onChangeText={setTotalPayment}
                    />
                  </View>
                </View>
                <View style={styles.col}>
                  <View style={styles.labelRow}>
                    <Wallet size={ms(20)} color={COLORS.text.primary} />
                    <Text weight="medium" style={styles.label}>
                      Advance Paid
                    </Text>
                  </View>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.textInput}
                      placeholder={isFarmhouse ? "₹" : "₹500"}
                      placeholderTextColor="#8C8C8C"
                      keyboardType="numeric"
                      value={advancePaid}
                      onChangeText={setAdvancePaid}
                    />
                  </View>
                </View>
              </View>

              {/* Previous History Button */}
              {hasHistory && (
                <TouchableOpacity
                  style={styles.historyButton}
                  activeOpacity={0.7}
                  onPress={() => {
                    onClose();
                    navigation.navigate("GuestHistory", { guestId: phone, bookingId: "" });
                  }}>
                  <View style={styles.historyLeft}>
                    <FileText size={ms(20)} color={COLORS.text.primary} />
                    <Text weight="semiBold" style={styles.historyText}>
                      Previous History
                    </Text>
                  </View>
                  <ChevronRight size={ms(18)} color={COLORS.text.primary} />
                </TouchableOpacity>
              )}

              {/* Submit Button */}
              <TouchableOpacity
                style={styles.bookNowButton}
                activeOpacity={0.8}
                onPress={handleBookNow}
                disabled={isLoading}>
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text weight="bold" family="bison" style={styles.bookNowText}>
                    Book Now
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {showDatePicker && (
        <DateTimePicker
          value={showDatePicker === "in" ? checkInDate : checkOutDate}
          mode="date"
          display="default"
          onChange={onDateChange}
          minimumDate={
            showDatePicker === "in"
              ? new Date()
              : new Date(new Date(checkInDate).setDate(checkInDate.getDate() + 1))
          }
        />
      )}

      {/* Dropdown Modal overlay */}
      <Modal
        visible={!!activeDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveDropdown(null)}>
        <TouchableWithoutFeedback onPress={() => setActiveDropdown(null)}>
          <View style={styles.dropdownOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.dropdownMenu}>
                <Text variant="h3" weight="bold" style={styles.dropdownTitle}>
                  {activeDropdown?.title}
                </Text>
                <ScrollView showsVerticalScrollIndicator={false} style={styles.dropdownScroll}>
                  {activeDropdown?.options.map(option => (
                    <TouchableOpacity
                      key={option}
                      style={styles.dropdownItem}
                      onPress={() => handleDropdownSelect(option)}>
                      <Text variant="body1" weight="medium" style={styles.dropdownItemText}>
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
};

// ... keep existing styles below ...
const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0, 0, 0, 0.4)" },
  backdrop: { ...StyleSheet.absoluteFillObject },
  sheetContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: ms(20),
    borderTopRightRadius: ms(20),
    paddingHorizontal: hs(16),
    paddingTop: vs(20),
    paddingBottom: vs(30),
    maxHeight: "90%",
  },
  header: { marginBottom: vs(16) },
  title: { fontSize: fs(16), color: COLORS.text.primary, textTransform: "uppercase" },
  scrollContent: { gap: vs(16) },
  inputGroup: { gap: vs(8) },
  row: { flexDirection: "row", gap: hs(16) },
  col: { flex: 1, gap: vs(8) },
  labelRow: { flexDirection: "row", alignItems: "center", gap: hs(6) },
  label: { fontSize: fs(14), color: COLORS.text.primary, textTransform: "capitalize" },
  inputWrapper: {
    backgroundColor: "#F4F7FC",
    borderRadius: ms(10),
    paddingHorizontal: hs(12),
    height: vs(44),
    justifyContent: "center",
  },
  textInput: {
    fontFamily: "Gilroy-SemiBold",
    fontSize: fs(14),
    color: COLORS.text.primary,
    padding: 0,
    margin: 0,
  },
  inputText: { fontSize: fs(14), color: COLORS.text.primary },
  dropdownWrapper: {
    backgroundColor: "#F4F7FC",
    borderRadius: ms(10),
    paddingHorizontal: hs(12),
    height: vs(44),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dropdownText: { fontSize: fs(14), color: COLORS.text.primary, flex: 1 },
  mutedText: { color: "#8C8C8C" },
  guestCountRight: { flexDirection: "row", alignItems: "center", gap: hs(6) },
  guestCountNum: { fontSize: fs(14), color: COLORS.text.primary },
  historyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#CBDFFE",
    borderRadius: ms(10),
    paddingHorizontal: hs(12),
    paddingVertical: vs(12),
    marginTop: vs(8),
  },
  historyLeft: { flexDirection: "row", alignItems: "center", gap: hs(8) },
  historyText: { fontSize: fs(14), color: COLORS.text.primary },
  bookNowButton: {
    backgroundColor: "#000000",
    borderRadius: ms(10),
    height: vs(50),
    justifyContent: "center",
    alignItems: "center",
    marginTop: vs(16),
  },
  bookNowText: { color: "#FFFFFF", fontSize: fs(20), textTransform: "uppercase" },
  modalOverlayCenter: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  calendarModal: {
    backgroundColor: COLORS.background,
    borderRadius: ms(12),
    padding: ms(10),
    width: "90%",
  },
  dropdownOverlay: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: hs(30),
  },
  dropdownMenu: {
    backgroundColor: "#FFFFFF",
    borderRadius: ms(12),
    padding: ms(16),
    maxHeight: vs(300),
  },
  dropdownTitle: { marginBottom: vs(12), textAlign: "center" },
  dropdownScroll: { maxHeight: vs(250) },
  dropdownItem: {
    paddingVertical: vs(12),
    borderBottomWidth: 1,
    borderBottomColor: "#F4F7FC",
    alignItems: "center",
  },
  dropdownItemText: { color: COLORS.text.primary },
});
