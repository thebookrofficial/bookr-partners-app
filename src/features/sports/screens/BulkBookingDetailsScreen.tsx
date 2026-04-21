// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native";
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { Text, TextInput } from "@/components/ui";
import { ServiceHeader } from "../components/ServiceHeader";
import { Plus, Minus, ChevronDown, Phone, User, Calendar, Clock } from "lucide-react-native";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import { MainStackParamList } from "@/navigation/navigation.types";
import { useBulkBooking } from "../hooks/useBulkBooking";
import DateTimePicker from "@react-native-community/datetimepicker";
import { supabase } from "@/lib/supabase";

// IMPORT THE NEW VIEW COMPONENT
import { ViewBulkBooking } from "../components/ViewBulkBooking";

const HOURS = [
  "6 AM",
  "7 AM",
  "8 AM",
  "9 AM",
  "10 AM",
  "11 AM",
  "12 PM",
  "1 PM",
  "2 PM",
  "3 PM",
  "4 PM",
  "5 PM",
  "6 PM",
  "7 PM",
  "8 PM",
  "9 PM",
  "10 PM",
  "11 PM",
  "12 AM",
];

// ==========================================
// CREATE MODE (Internal Component)
// ==========================================
const CreateBulkBooking = ({ type }: { type: "multi" | "single" }) => {
  const navigation = useNavigation();
  const [bookingType, setBookingType] = useState<"multi" | "single">(type);
  const [mobile, setMobile] = useState("");
  const [name, setName] = useState("");
  const [fromDate, setFromDate] = useState(new Date());
  const [toDate, setToDate] = useState(new Date());
  const [fromTime, setFromTime] = useState("7 AM");
  const [toTime, setToTime] = useState("8 AM");
  const [pricePerHour] = useState(1000);
  const [cashInput, setCashInput] = useState("");
  const [onlineInput, setOnlineInput] = useState("");
  const [stagedPayments, setStagedPayments] = useState<{ mode: "cash" | "upi"; amount: number }[]>(
    [],
  );
  const [showDatePicker, setShowDatePicker] = useState<"from" | "to" | null>(null);
  const [showHourPicker, setShowHourPicker] = useState<"from" | "to" | null>(null);
  const [isAddingPayment, setIsAddingPayment] = useState(false);

  const { confirmBulkBooking, isSubmitting } = useBulkBooking();

  const totalSlots =
    (bookingType === "single"
      ? 1
      : Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)) + 1) *
    (HOURS.indexOf(toTime) - HOURS.indexOf(fromTime));
  const totalPayment = totalSlots * pricePerHour;
  const amountPaid = stagedPayments.reduce((sum, p) => sum + p.amount, 0);
  const remainingAmount = totalPayment - amountPaid;

  useEffect(() => {
    const lookupGuest = async () => {
      const cleanMobile = mobile.replace(/[^\d]/g, "");
      if (cleanMobile.length < 10) return;
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("phone", cleanMobile)
          .maybeSingle();
        let foundName = profile?.full_name || "";
        if (!foundName) {
          const { data: lastBooking } = await supabase
            .from("sports_bookings")
            .select("guest_name")
            .eq("guest_phone", cleanMobile)
            .not("guest_name", "is", null)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          if (lastBooking?.guest_name) foundName = lastBooking.guest_name;
        }
        if (foundName) setName(foundName);
      } catch (err) {
        console.error("Lookup error:", err);
      }
    };
    lookupGuest();
  }, [mobile]);

  const handleAddPayment = () => {
    const newPayments = [...stagedPayments];
    const cash = parseFloat(cashInput || "0");
    const online = parseFloat(onlineInput || "0");
    if (cash > 0) newPayments.push({ mode: "cash", amount: cash });
    if (online > 0) newPayments.push({ mode: "upi", amount: online });
    setStagedPayments(newPayments);
    setCashInput("");
    setOnlineInput("");
    setIsAddingPayment(false);
  };

  const onConfirm = async () => {
    if (!mobile || !name || totalSlots <= 0) {
      Alert.alert("Missing Info", "Please ensure dates, times, and guest info are valid.");
      return;
    }
    const success = await confirmBulkBooking({
      mobile,
      name,
      fromDate,
      toDate: bookingType === "single" ? fromDate : toDate,
      fromTime,
      toTime,
      totalAmountPerSlot: pricePerHour,
      initialPayments: stagedPayments,
    });
    if (success) navigation.goBack();
  };

  return (
    <View style={styles.flex1}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <ServiceHeader
          title="Elite Strikers Club"
          subtitle="Bulk Booking"
          rightComponent={<Text style={[styles.bisonText, styles.headerBadgeText]}>FOOTBALL</Text>}
        />

        <View style={styles.tabBar}>
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[
                styles.tabPill,
                bookingType === "multi" ? styles.tabActive : styles.tabInactive,
              ]}
              onPress={() => setBookingType("multi")}>
              <Text
                style={[
                  styles.tabText,
                  bookingType === "multi" ? styles.tabTextActive : styles.tabTextInactive,
                ]}>
                Multiple days
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tabPill,
                bookingType === "single" ? styles.tabActive : styles.tabInactive,
              ]}
              onPress={() => setBookingType("single")}>
              <Text
                style={[
                  styles.tabText,
                  bookingType === "single" ? styles.tabTextActive : styles.tabTextInactive,
                ]}>
                Single days
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.bookingTypeTitle}>
          {bookingType === "multi" ? "MULTIPLE DAYS BULK BOOKING" : "SINGLE DAY BOOKING"}
        </Text>

        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <Phone size={ms(18)} color="#63A1FD" fill="#63A1FD" />
            <Text style={styles.label}>Mobile No</Text>
          </View>
          <TextInput
            variant="filled"
            value={mobile}
            onChangeText={setMobile}
            keyboardType="phone-pad"
            placeholder="+91 ..."
            style={styles.inputFill}
          />
        </View>

        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <User size={ms(18)} color="#63A1FD" />
            <Text style={styles.label}>Name</Text>
          </View>
          <TextInput
            variant="filled"
            value={name}
            onChangeText={setName}
            placeholder="Guest Name"
            style={styles.inputFill}
          />
        </View>

        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <Calendar size={ms(18)} color="#63A1FD" />
            <Text style={styles.labelBold}>Select Dates</Text>
          </View>
          <View style={styles.splitRow}>
            <View style={styles.flex1}>
              <Text style={styles.subLabel}>From</Text>
              <TouchableOpacity
                style={styles.inputBoxSmall}
                onPress={() => setShowDatePicker("from")}>
                <Text style={styles.inputText}>
                  {fromDate.toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </Text>
              </TouchableOpacity>
            </View>
            {bookingType === "multi" && (
              <View style={styles.flex1}>
                <Text style={styles.subLabel}>To</Text>
                <TouchableOpacity
                  style={styles.inputBoxSmall}
                  onPress={() => setShowDatePicker("to")}>
                  <Text style={styles.inputText}>
                    {toDate.toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <Clock size={ms(18)} color="#63A1FD" />
            <Text style={styles.labelBold}>Select Time Slots</Text>
          </View>
          <View style={styles.splitRow}>
            <View style={styles.flex1}>
              <Text style={styles.subLabel}>From</Text>
              <TouchableOpacity
                style={styles.inputBoxSmallRow}
                onPress={() => setShowHourPicker("from")}>
                <Text style={styles.inputText}>{fromTime}</Text>
                <ChevronDown size={ms(16)} color="#000" />
              </TouchableOpacity>
            </View>
            <View style={styles.flex1}>
              <Text style={styles.subLabel}>To</Text>
              <TouchableOpacity
                style={styles.inputBoxSmallRow}
                onPress={() => setShowHourPicker("to")}>
                <Text style={styles.inputText}>{toTime}</Text>
                <ChevronDown size={ms(16)} color="#000" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.labelBold}>Total Payment</Text>
          <View style={styles.inputBoxFill}>
            <Text style={styles.inputText}>₹ {totalPayment}</Text>
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.labelBold}>Remaining Amount</Text>
          <View style={styles.inputBoxFill}>
            <Text style={[styles.inputText, styles.textDanger]}>₹ {remainingAmount}</Text>
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.labelBold}>Amount Paid</Text>
          <View style={styles.inputBoxFillRow}>
            <Text style={[styles.inputText, styles.textSuccessFlex]}>₹ {amountPaid}</Text>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => setIsAddingPayment(!isAddingPayment)}>
              <Text style={styles.addText}>{isAddingPayment ? "Cancel" : "Add"}</Text>
              {isAddingPayment ? (
                <Minus size={ms(18)} color="#E55959" />
              ) : (
                <Plus size={ms(18)} color="#00B562" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {isAddingPayment && (
          <View style={styles.paymentDrawer}>
            <TextInput
              variant="filled"
              label="Cash"
              value={cashInput}
              onChangeText={setCashInput}
              keyboardType="numeric"
              placeholder="₹"
            />
            <TextInput
              variant="filled"
              label="Online"
              value={onlineInput}
              onChangeText={setOnlineInput}
              keyboardType="numeric"
              placeholder="₹"
            />
            <TouchableOpacity style={styles.confirmPaymentBtn} onPress={handleAddPayment}>
              <Text style={styles.bisonText}>SAVE PAYMENT</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={styles.confirmBtn} onPress={onConfirm} disabled={isSubmitting}>
          {isSubmitting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.bisonText}>CONFIRM BULK BOOKING</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: vs(40) }} />
      </ScrollView>

      {showDatePicker && (
        <DateTimePicker
          value={showDatePicker === "from" ? fromDate : toDate}
          mode="date"
          onChange={(e, date) => {
            setShowDatePicker(null);
            if (date) {
              if (showDatePicker === "from") setFromDate(date);
              else setToDate(date);
            }
          }}
        />
      )}

      <Modal visible={!!showHourPicker} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowHourPicker(null)}>
          <View style={styles.hourPickerContainer}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {HOURS.map(hour => (
                <TouchableOpacity
                  key={hour}
                  style={styles.hourItem}
                  onPress={() => {
                    if (showHourPicker === "from") setFromTime(hour);
                    else setToTime(hour);
                    setShowHourPicker(null);
                  }}>
                  <Text style={styles.inputText}>{hour}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

// ==========================================
// MAIN SCREEN EXPORT (The Smart Switch)
// ==========================================
export const BulkBookingDetailsScreen = () => {
  const route = useRoute<RouteProp<MainStackParamList, "BulkBookingDetails">>();
  const { bookingId, type } = route.params;

  return (
    <ScreenContainer backgroundColor="#FFFFFF" paddingHorizontal={hs(12)}>
      {bookingId === "new" ? (
        <CreateBulkBooking type={type} />
      ) : (
        <ViewBulkBooking bookingId={bookingId} type={type} />
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scrollContent: { paddingTop: vs(10) },
  flex1: { flex: 1 },

  /* --- FONTS --- */
  bisonText: {
    fontFamily: "MDNichromeTest-Bold",
    fontWeight: "700",
    fontSize: fs(20),
    color: "#FFF",
  },
  tabText: { fontFamily: "Gilroy-SemiBold", fontSize: fs(12) },
  bookingTypeTitle: {
    fontFamily: "Gilroy-Bold",
    fontSize: fs(16),
    color: "#000",
    textTransform: "uppercase",
    marginBottom: vs(15),
  },
  label: { fontFamily: "Gilroy-Medium", fontSize: fs(14), color: "#000" },
  labelBold: { fontFamily: "Gilroy-Bold", fontSize: fs(14), color: "#000" },
  subLabel: { fontFamily: "Gilroy-Medium", fontSize: fs(14), color: "#000", marginBottom: vs(4) },
  inputText: { fontFamily: "Gilroy-SemiBold", fontSize: fs(14), color: "#000" },
  addText: { fontFamily: "Gilroy-SemiBold", fontSize: fs(14), color: "#00B562" },
  textDanger: { color: "#E55959" },
  textSuccessFlex: { color: "#00B562", flex: 1 },

  /* --- CREATE LAYOUT --- */
  tabBar: { flexDirection: "row", alignItems: "center", marginBottom: vs(15), gap: hs(10) },
  tabContainer: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#F4F7FC",
    borderRadius: ms(10),
    padding: ms(4),
  },
  tabPill: {
    flex: 1,
    height: vs(32),
    justifyContent: "center",
    alignItems: "center",
    borderRadius: ms(8),
  },
  tabActive: { backgroundColor: "#282828" },
  tabInactive: { backgroundColor: "transparent" },
  headerBadgeText: { color: "#000", fontSize: fs(18) },
  tabTextActive: { color: "#FFF" },
  tabTextInactive: { color: "#8C8C8C" },
  fieldGroup: { marginBottom: vs(15) },
  labelRow: { flexDirection: "row", alignItems: "center", gap: hs(6), marginBottom: vs(4) },
  inputFill: { backgroundColor: "#F4F7FC", borderRadius: ms(10), borderWidth: 0 },
  inputBoxSmall: {
    backgroundColor: "#F4F7FC",
    borderRadius: ms(10),
    padding: ms(12),
    height: vs(40),
    justifyContent: "center",
  },
  inputBoxSmallRow: {
    backgroundColor: "#F4F7FC",
    borderRadius: ms(10),
    padding: ms(10),
    height: vs(40),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  inputBoxFill: {
    backgroundColor: "#F4F7FC",
    borderRadius: ms(10),
    padding: ms(12),
    height: vs(40),
    justifyContent: "center",
  },
  inputBoxFillRow: {
    backgroundColor: "#F4F7FC",
    borderRadius: ms(10),
    paddingHorizontal: ms(12),
    height: vs(48),
    flexDirection: "row",
    alignItems: "center",
  },
  splitRow: { flexDirection: "row", gap: hs(10) },
  addBtn: { flexDirection: "row", alignItems: "center", gap: hs(4) },
  paymentDrawer: {
    padding: ms(15),
    borderWidth: 1,
    borderColor: "#CBDFFE",
    borderRadius: ms(10),
    marginBottom: vs(15),
    gap: vs(10),
  },
  confirmPaymentBtn: {
    backgroundColor: "#000",
    height: vs(44),
    borderRadius: ms(10),
    justifyContent: "center",
    alignItems: "center",
  },
  confirmBtn: {
    backgroundColor: "#000",
    height: vs(44),
    borderRadius: ms(10),
    justifyContent: "center",
    alignItems: "center",
    marginTop: vs(10),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  hourPickerContainer: {
    width: "80%",
    backgroundColor: "#FFF",
    borderRadius: ms(10),
    maxHeight: "50%",
    padding: ms(10),
  },
  hourItem: {
    padding: ms(15),
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
    alignItems: "center",
  },
});
