// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Text, TextInput } from "@/components/ui";
import {
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Phone,
  Calendar,
  Clock,
  ArrowLeft,
  FileText,
  Trash2,
  Plus,
  Minus,
} from "lucide-react-native";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "@/lib/supabase";

interface ViewBulkBookingProps {
  bookingId: string;
  type: "multi" | "single";
}

export const ViewBulkBooking = ({ bookingId: _bookingId, type }: ViewBulkBookingProps) => {
  const navigation = useNavigation();
  const [historyOpen, setHistoryOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  // Payment States
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [cashInput, setCashInput] = useState("");
  const [onlineInput, setOnlineInput] = useState("");
  const [isSavingPayment, setIsSavingPayment] = useState(false);

  // Wrapped in useCallback to fix exhaustive-deps warning
  const fetchDetails = useCallback(async () => {
    try {
      setLoading(true);

      const { data: baseBooking, error: baseErr } = await supabase
        .from("sports_bookings")
        .select(`*, profiles(full_name, phone, avatar_url)`)
        .eq("id", _bookingId)
        .single();

      if (baseErr) throw baseErr;

      const createdTime = new Date(baseBooking.created_at).getTime();
      const minTime = new Date(createdTime - 60000).toISOString();
      const maxTime = new Date(createdTime + 60000).toISOString();

      let query = supabase
        .from("sports_bookings")
        .select(`id, total_amount, paid_amount, sports_slots(slot_date, start_time, end_time)`)
        .gte("created_at", minTime)
        .lte("created_at", maxTime)
        .eq("notes", "Bulk Booking Record");

      if (baseBooking.user_id) {
        query = query.eq("user_id", baseBooking.user_id);
      } else {
        query = query.eq("guest_phone", baseBooking.guest_phone);
      }

      const { data: batchBookings, error: batchErr } = await query;
      if (batchErr) throw batchErr;

      const batchIds = (batchBookings || []).map(b => b.id);
      const { data: paymentLogs } = await supabase
        .from("offline_payment_logs")
        .select("*")
        .in("booking_id", batchIds)
        .order("created_at", { ascending: false });

      const slots = (batchBookings || []).map((b: any) => b.sports_slots);

      const dates = slots.map((s: any) => new Date(s.slot_date).getTime());
      const minDate = new Date(Math.min(...dates));
      const maxDate = new Date(Math.max(...dates));
      const formatDate = (d: Date) =>
        d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

      const times = slots.map((s: any) => s.start_time).sort();
      const firstTime = times[0];
      const lastSlot = slots.find((s: any) => s.start_time === times[times.length - 1]);

      const formatTime = (t: string) => {
        if (!t) return "";
        const [h, m] = t.split(":");
        const hour = parseInt(h, 10);
        const ampm = hour >= 12 ? "PM" : "AM";
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${m} ${ampm}`;
      };

      const totalCost = (batchBookings || []).reduce(
        (sum: number, b: any) => sum + Number(b.total_amount),
        0,
      );
      const amountPaid = (paymentLogs || []).reduce(
        (sum: number, p: any) => sum + Number(p.amount),
        0,
      );

      const history = (paymentLogs || []).map((log: any) => {
        const logDate = new Date(log.created_at);
        // Convert "upi" back to "Online (UPI)" for the vendor UI
        const displayMode = log.payment_mode === "upi" ? "Online" : log.payment_mode;

        return {
          date: logDate.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
          time: logDate.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          }),
          amount: `+₹${log.amount}`,
          mode: displayMode,
        };
      });

      setData({
        name: baseBooking.profiles?.full_name || baseBooking.guest_name || "Guest",
        phone: baseBooking.profiles?.phone || baseBooking.guest_phone || "N/A",
        avatar:
          baseBooking.profiles?.avatar_url ||
          `https://ui-avatars.com/api/?name=${
            baseBooking.guest_name || "G"
          }&background=63A1FD&color=fff`,
        fromDate: formatDate(minDate),
        toDate: formatDate(maxDate),
        fromTime: formatTime(firstTime),
        toTime: formatTime(lastSlot?.end_time),
        totalPayment: totalCost,
        remainingAmount: Math.max(0, totalCost - amountPaid),
        amountPaid: amountPaid,
        history: history,
      });
    } catch (err) {
      console.error("Error fetching bulk details:", err);
      Alert.alert("Error", "Failed to load booking details.");
    } finally {
      setLoading(false);
    }
  }, [_bookingId]);

  useEffect(() => {
    if (_bookingId) fetchDetails();
  }, [_bookingId, fetchDetails]); // Now includes fetchDetails

  const handleSavePayment = async () => {
    const cash = parseFloat(cashInput || "0");
    const online = parseFloat(onlineInput || "0");

    if (cash === 0 && online === 0) {
      setIsAddingPayment(false);
      return;
    }

    setIsSavingPayment(true);
    try {
      if (cash > 0) {
        await supabase.from("offline_payment_logs").insert({
          booking_id: _bookingId,
          amount: cash,
          payment_mode: "cash",
          note: "Additional bulk payment",
        });
      }
      if (online > 0) {
        // CHANGED 'online' TO 'upi' HERE TO MATCH YOUR DATABASE ENUM
        await supabase.from("offline_payment_logs").insert({
          booking_id: _bookingId,
          amount: online,
          payment_mode: "upi",
          note: "Additional bulk payment",
        });
      }

      setCashInput("");
      setOnlineInput("");
      setIsAddingPayment(false);
      await fetchDetails();
    } catch (err) {
      Alert.alert("Error", "Failed to save payment.");
    } finally {
      setIsSavingPayment(false);
    }
  };

  if (loading || !data) {
    // Fixed Error: Replaced inline style with styles.loadingContainer
    return (
      <View style={[styles.scrollContent, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#63A1FD" />
      </View>
    );
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      {/* Custom View Header */}
      <View style={styles.viewHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={ms(24)} color="#000" />
        </TouchableOpacity>
        <Image source={{ uri: data.avatar }} style={styles.avatar} />
        <Text style={styles.viewHeaderTitle}>{data.name}</Text>
        <Text style={styles.viewHeaderBadge}>Football</Text>
      </View>

      <Text style={styles.bookingTypeTitle}>
        {type === "multi" ? "MULTI DAYS BULK BOOKING" : "SINGLE DAY BULK BOOKING"}
      </Text>

      {/* Mobile Input with Call Button */}
      <View style={styles.fieldGroup}>
        <View style={styles.labelRow}>
          <Phone size={ms(18)} color="#63A1FD" fill="#63A1FD" />
          <Text style={styles.label}>Mobile No</Text>
        </View>
        <View style={styles.inputBoxFillRow}>
          <Text style={styles.inputTextFlex}>{data.phone}</Text>
          <TouchableOpacity style={styles.callBtn}>
            <Text style={styles.callBtnText}>Call</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Date Read-Only */}
      <View style={styles.fieldGroup}>
        <View style={styles.labelRow}>
          <Calendar size={ms(18)} color="#63A1FD" />
          <Text style={styles.labelBold}>Date</Text>
        </View>
        <View style={styles.splitRow}>
          <View style={styles.flex1}>
            <Text style={styles.subLabel}>From</Text>
            <View style={styles.inputBoxSmall}>
              <Text style={styles.inputText}>{data.fromDate}</Text>
            </View>
          </View>
          {type === "multi" && (
            <View style={styles.flex1}>
              <Text style={styles.subLabel}>To</Text>
              <View style={styles.inputBoxSmall}>
                <Text style={styles.inputText}>{data.toDate}</Text>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Time Read-Only */}
      <View style={styles.fieldGroup}>
        <View style={styles.labelRow}>
          <Clock size={ms(18)} color="#63A1FD" />
          <Text style={styles.labelBold}>Time Slots</Text>
        </View>
        <View style={styles.splitRow}>
          <View style={styles.flex1}>
            <Text style={styles.subLabel}>From</Text>
            <View style={styles.inputBoxSmall}>
              <Text style={styles.inputText}>{data.fromTime}</Text>
            </View>
          </View>
          <View style={styles.flex1}>
            <Text style={styles.subLabel}>To</Text>
            <View style={styles.inputBoxSmall}>
              <Text style={styles.inputText}>{data.toTime}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Financials */}
      <View style={styles.fieldGroup}>
        <Text style={styles.labelBold}>Total Payment</Text>
        <View style={styles.inputBoxSmall}>
          <Text style={styles.inputText}>₹ {data.totalPayment}</Text>
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.labelBold}>Remaining Amount</Text>
        <View style={styles.inputBoxSmall}>
          <Text style={[styles.inputText, styles.textDanger]}>₹ {data.remainingAmount}</Text>
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.labelBold}>Amount Paid</Text>
        <View style={styles.inputBoxFillRow}>
          <Text style={[styles.inputText, styles.textSuccessFlex]}>₹ {data.amountPaid}</Text>
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
          <TouchableOpacity
            style={styles.confirmPaymentBtn}
            onPress={handleSavePayment}
            disabled={isSavingPayment}>
            {isSavingPayment ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.bisonText}>SAVE PAYMENT</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Payment History Accordion */}
      {data.history.length > 0 && (
        <View style={styles.historyAccordion}>
          <TouchableOpacity
            style={styles.historyHeader}
            onPress={() => setHistoryOpen(!historyOpen)}
            activeOpacity={0.7}>
            <View style={styles.historyTitleRow}>
              <Clock size={ms(18)} color="#000" />
              <Text style={styles.historyTitle}>Current Booking Payment History</Text>
            </View>
            {historyOpen ? (
              <ChevronUp size={ms(20)} color="#000" />
            ) : (
              <ChevronDown size={ms(20)} color="#000" />
            )}
          </TouchableOpacity>
          {historyOpen && (
            <View style={styles.historyBody}>
              {data.history.map((h: any, i: number) => (
                <View key={i} style={styles.historyRow}>
                  <View>
                    <Text style={styles.historyDate}>{h.date}</Text>
                    <Text style={styles.historyTime}>{h.time}</Text>
                  </View>
                  <View style={styles.historyAmountWrapper}>
                    <Text style={styles.historyAmount}>{h.amount}</Text>
                    {/* Add this line to show Cash or Online */}
                    <Text style={[styles.historyTime, styles.historyModeText]}>{h.mode}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Action Buttons */}
      <TouchableOpacity style={styles.actionButton} activeOpacity={0.7}>
        <FileText size={ms(20)} color="#000" />
        <Text style={styles.actionText}>Previous History</Text>
        <ChevronRight size={ms(20)} color="#000" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionButton} activeOpacity={0.7}>
        <Text style={styles.actionText}>Cancel Your Booking</Text>
        <Trash2 size={ms(20)} color="#000" />
      </TouchableOpacity>

      <View style={{ height: vs(40) }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent: { paddingTop: vs(10) },
  flex1: { flex: 1 },
  loadingContainer: { justifyContent: "center", alignItems: "center", height: "100%" }, // Added this

  /* --- FONTS --- */
  bisonText: {
    fontFamily: "MDNichromeTest-Bold",
    fontWeight: "700",
    fontSize: fs(18),
    color: "#FFF",
  },
  bookingTypeTitle: {
    fontFamily: "Gilroy-Bold",
    fontSize: fs(16),
    color: "#000",
    textTransform: "uppercase",
    marginBottom: vs(15),
  },
  historyAmountWrapper: { alignItems: "flex-end" },
  historyModeText: { textTransform: "capitalize" },
  label: { fontFamily: "Gilroy-Medium", fontSize: fs(14), color: "#000" },
  labelBold: { fontFamily: "Gilroy-Bold", fontSize: fs(14), color: "#000" },
  subLabel: { fontFamily: "Gilroy-Medium", fontSize: fs(14), color: "#000", marginBottom: vs(4) },
  inputText: { fontFamily: "Gilroy-SemiBold", fontSize: fs(14), color: "#000" },
  inputTextFlex: { fontFamily: "Gilroy-SemiBold", fontSize: fs(14), color: "#000", flex: 1 },
  addText: { fontFamily: "Gilroy-SemiBold", fontSize: fs(14), color: "#00B562" },
  textDanger: { color: "#E55959" },
  textSuccessFlex: { color: "#00B562", flex: 1 },

  /* --- LAYOUTS --- */
  fieldGroup: { marginBottom: vs(15) },
  labelRow: { flexDirection: "row", alignItems: "center", gap: hs(6), marginBottom: vs(4) },
  splitRow: { flexDirection: "row", gap: hs(10) },
  inputBoxSmall: {
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

  /* --- VIEW SPECIFICS --- */
  viewHeader: { flexDirection: "row", alignItems: "center", marginBottom: vs(20) },
  avatar: {
    width: ms(50),
    height: ms(50),
    borderRadius: ms(25),
    marginLeft: hs(10),
    marginRight: hs(10),
  },
  viewHeaderTitle: { fontFamily: "Gilroy-Bold", fontSize: fs(22), color: "#000" },
  viewHeaderBadge: {
    fontFamily: "Gilroy-SemiBold",
    fontSize: fs(14),
    color: "#000",
    marginLeft: "auto",
  },
  callBtn: {
    backgroundColor: "#000",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.25)",
    borderRadius: ms(6),
    paddingVertical: vs(6),
    paddingHorizontal: hs(14),
    justifyContent: "center",
    alignItems: "center",
  },
  callBtnText: { color: "#FFF", fontFamily: "Gilroy-Bold", fontSize: fs(14) },
  historyAccordion: {
    borderWidth: 1,
    borderColor: "#CBDFFE",
    borderRadius: ms(10),
    padding: ms(6),
    marginBottom: vs(10),
  },
  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: ms(6),
  },
  historyTitleRow: { flexDirection: "row", alignItems: "center" },
  historyTitle: {
    fontFamily: "Gilroy-SemiBold",
    fontSize: fs(14),
    color: "#E55959",
    marginLeft: hs(6),
  },
  historyBody: {
    backgroundColor: "#F4F7FC",
    borderRadius: ms(10),
    padding: ms(12),
    marginTop: vs(6),
  },
  historyRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: vs(10) },
  historyDate: { fontFamily: "Gilroy-SemiBold", fontSize: fs(14), color: "#000" },
  historyTime: { fontFamily: "Gilroy-Medium", fontSize: fs(14), color: "#000", marginTop: vs(4) },
  historyAmount: { fontFamily: "Gilroy-SemiBold", fontSize: fs(14), color: "#00B562" },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#CBDFFE",
    borderRadius: ms(10),
    paddingHorizontal: hs(12),
    height: vs(40),
    marginBottom: vs(10),
  },
  actionText: {
    fontFamily: "Gilroy-Bold",
    fontSize: fs(14),
    color: "#000",
    flex: 1,
    marginLeft: hs(6),
  },
});
