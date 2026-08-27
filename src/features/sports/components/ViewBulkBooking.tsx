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
  Linking,
} from "react-native";
import { Text, TextInput } from "@/components/ui";
import {
  ChevronDown,
  ChevronUp,
  Phone,
  Calendar,
  Clock,
  ArrowLeft,
  Tag,
  MapPin,
  Download,
  Wallet,
} from "lucide-react-native";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { useNavigation } from "@react-navigation/native";
import { useServiceStore } from "@/store/serviceStore";
import { supabase } from "@/lib/supabase";

const icWhatsapp = require("@/assets/icons/social.png");

// Helper to get payment mode icon
const getPaymentIcon = (mode: string) => {
  switch (mode?.toLowerCase()) {
    case "gpay":
      return require("@/assets/icons/google-pay.png");
    case "phonepe":
      return require("@/assets/icons/icons8-phone-pe-48.png");
    case "paytm":
      return require("@/assets/icons/paytm.png");
    default:
      return require("@/assets/icons/pay-50.png");
  }
};

interface ViewBulkBookingProps {
  bookingId: string;
  type: "multi" | "single";
}

export const ViewBulkBooking = ({ bookingId: _bookingId, type }: ViewBulkBookingProps) => {
  const navigation = useNavigation();

  // Extract initial serviceId
  const parentState = navigation.getParent()?.getState();
  const tabRoute = parentState?.routes.find((r: any) => r.name === "SportsServiceTabs");
  const serviceId =
    (tabRoute?.params as any)?.serviceId || (tabRoute?.params as any)?.params?.serviceId || "";

  const { selectedCategories } = useServiceStore();
  const selectedCategory = selectedCategories[serviceId] || "Football";

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
        .select(`*, profiles(full_name, phone, avatar_url), sports_slots(sports_grounds(name))`)
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

      const currentBatchIds = (batchBookings || []).map(b => b.id);

      const { data: paymentLogs } = await supabase
        .from("offline_payment_logs")
        .select("*")
        .in("booking_id", currentBatchIds)
        .order("created_at", { ascending: false });

      const slots = (batchBookings || []).map((b: any) => b.sports_slots).filter(Boolean);

      const parseSlotDate = (dateStr: string) => {
        if (!dateStr) return new Date();
        const [year, month, day] = dateStr.split("-").map(Number);
        return new Date(year, month - 1, day);
      };

      const dates = slots
        .map((s: any) => parseSlotDate(s.slot_date).getTime())
        .filter((t: number) => !isNaN(t));
      const minDate = dates.length > 0 ? new Date(Math.min(...dates)) : new Date();
      const maxDate = dates.length > 0 ? new Date(Math.max(...dates)) : new Date();
      const formatDate = (d: Date) => {
        if (isNaN(d.getTime())) return "";
        return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
      };

      const times = slots
        .map((s: any) => s.start_time)
        .filter(Boolean)
        .sort();
      const firstTime = times.length > 0 ? times[0] : "";
      const lastSlot =
        times.length > 0 ? slots.find((s: any) => s.start_time === times[times.length - 1]) : null;

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
            day: "2-digit",
            month: "short",
            year: "numeric",
          }),
          amount: `₹${log.amount}`,
          mode: displayMode,
        };
      });

      // Avoid rendering issues with missing images
      const baseAvatar = baseBooking.profiles?.avatar_url;
      const computedAvatar = baseAvatar
        ? baseAvatar
        : `https://ui-avatars.com/api/?name=${
            baseBooking.guest_name || "G"
          }&background=63A1FD&color=fff`;

      setData({
        name: baseBooking.profiles?.full_name || baseBooking.guest_name || "Guest",
        phone: baseBooking.profiles?.phone || baseBooking.guest_phone || "N/A",
        avatar: computedAvatar,
        category: baseBooking.sport_category || selectedCategory,
        groundName: baseBooking.sports_slots?.sports_grounds?.name || "Ground",
        fromDate: formatDate(minDate),
        toDate: formatDate(maxDate),
        fromTime: formatTime(firstTime),
        toTime: formatTime(lastSlot?.end_time),
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
  }, [_bookingId, selectedCategory]);

  useEffect(() => {
    if (_bookingId) fetchDetails();
  }, [_bookingId, fetchDetails]);

  const handleSavePayment = async () => {
    const cash = parseFloat(cashInput || "0");
    const online = parseFloat(onlineInput || "0");

    if (cash === 0 && online === 0) {
      setIsAddingPayment(false);
      return;
    }

    setIsSavingPayment(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const vendorId = userData?.user?.id;
      if (!vendorId) {
        throw new Error("Could not identify logged-in user.");
      }

      if (cash > 0) {
        const { error } = await supabase.from("offline_payment_logs").insert({
          booking_id: _bookingId,
          booking_vertical: "sports",
          amount: cash,
          payment_mode: "cash",
          note: "Additional bulk payment",
          logged_by: vendorId,
        });
        if (error) throw error;
      }
      if (online > 0) {
        const { error } = await supabase.from("offline_payment_logs").insert({
          booking_id: _bookingId,
          booking_vertical: "sports",
          amount: online,
          payment_mode: "upi",
          note: "Additional bulk payment",
          logged_by: vendorId,
        });
        if (error) throw error;
      }

      setCashInput("");
      setOnlineInput("");
      setIsAddingPayment(false);
      await fetchDetails();
    } catch (err: any) {
      console.error("Error saving payment:", err);
      Alert.alert("Error", err.message || "Failed to save payment.");
    } finally {
      setIsSavingPayment(false);
    }
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleWhatsAppShare = (phone: string) => {
    const message = "Hello from Bookr!";
    Linking.openURL(`whatsapp://send?phone=+91${phone}&text=${message}`);
  };

  if (loading || !data) {
    return (
      <View style={[styles.scrollContent, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#63A1FD" />
      </View>
    );
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={ms(24)} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Details</Text>
      </View>

      {/* User Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.profileLeft}>
          <View style={styles.avatarContainer}>
            <Image source={{ uri: data.avatar }} style={styles.avatar} />
          </View>
          <View>
            <Text style={styles.profileName}>{data.name}</Text>
            <Text style={styles.profilePhone}>{data.phone}</Text>
            <View style={styles.offlineTag}>
              <Text style={styles.offlineTagText}>Offline</Text>
            </View>
          </View>
        </View>
        <View style={styles.profileActions}>
          <TouchableOpacity
            onPress={() => handleWhatsAppShare(data.phone)}
            style={styles.actionIconBtn}>
            <Image source={icWhatsapp} style={styles.whatsappIcon} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleCall(data.phone)} style={styles.callIconBtn}>
            <Phone size={ms(18)} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Info Grid */}
      <View style={styles.gridContainer}>
        <View style={styles.gridRow}>
          <View style={styles.gridCard}>
            <View style={styles.iconCircleLightBlue}>
              <Tag size={ms(18)} color="#63A1FD" />
            </View>
            <View style={styles.gridTextContainer}>
              <Text style={styles.gridLabel}>Category</Text>
              <Text style={styles.gridValue} numberOfLines={1}>
                {data.category}
              </Text>
            </View>
          </View>
          <View style={styles.gridCard}>
            <View style={styles.iconCircleLightBlue}>
              <MapPin size={ms(18)} color="#63A1FD" />
            </View>
            <View style={styles.gridTextContainer}>
              <Text style={styles.gridLabel}>Ground</Text>
              <Text style={styles.gridValue} numberOfLines={1}>
                {data.groundName}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.gridRow}>
          <View style={styles.gridCard}>
            <View style={styles.iconCircleLightBlue}>
              <Calendar size={ms(18)} color="#63A1FD" />
            </View>
            <View style={styles.gridTextContainer}>
              <Text style={styles.gridLabel}>Date</Text>
              <Text style={styles.gridValue} numberOfLines={1}>
                {type === "multi" ? `${data.fromDate} - ${data.toDate}` : data.fromDate}
              </Text>
            </View>
          </View>
          <View style={styles.gridCard}>
            <View style={styles.iconCircleLightBlue}>
              <Clock size={ms(18)} color="#63A1FD" />
            </View>
            <View style={styles.gridTextContainer}>
              <Text style={styles.gridLabel}>Time Slots</Text>
              <Text style={styles.gridValue} numberOfLines={1}>
                {data.fromTime} to {data.toTime}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Payment Summary */}
      <View style={styles.paymentSummaryCard}>
        <View style={styles.paymentSummaryTop}>
          <View style={styles.paymentCol}>
            <View style={styles.iconCircleLightRed}>
              <Clock size={ms(16)} color="#E55959" />
            </View>
            <View style={styles.paymentTextContainer}>
              <Text style={styles.paymentLabel}>Pending Amount</Text>
              <Text style={styles.pendingAmountText}>₹{data.remainingAmount}</Text>
            </View>
          </View>
          <View style={styles.paymentCol}>
            <View style={styles.iconCircleLightGreen}>
              <Download size={ms(16)} color="#00B562" />
            </View>
            <View style={styles.paymentTextContainer}>
              <Text style={styles.paymentLabel}>Received Amount</Text>
              <Text style={styles.receivedAmountText}>₹{data.amountPaid}</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity
          style={styles.addMoneyBtn}
          onPress={() => setIsAddingPayment(!isAddingPayment)}>
          <Text style={styles.addMoneyText}>Add Money +</Text>
        </TouchableOpacity>
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
      <View style={styles.historyCard}>
        <TouchableOpacity
          style={styles.historyHeader}
          onPress={() => setHistoryOpen(!historyOpen)}
          activeOpacity={0.7}>
          <View style={styles.historyTitleRow}>
            <Wallet size={ms(20)} color="#00B562" />
            <Text style={styles.historyTitle}>Payment History</Text>
          </View>
          {historyOpen ? (
            <ChevronUp size={ms(20)} color="#000" />
          ) : (
            <ChevronDown size={ms(20)} color="#000" />
          )}
        </TouchableOpacity>

        {historyOpen && data.history.length > 0 && (
          <View style={styles.historyBody}>
            {data.history.map((h: any, i: number) => (
              <View key={i} style={styles.historyListItem}>
                <View style={styles.historyListLeft}>
                  <Image source={getPaymentIcon(h.mode)} style={styles.paymentMethodIcon} />
                  <Text style={styles.historyMethodName}>{h.mode}</Text>
                </View>
                <Text style={styles.historyDateText}>{h.date}</Text>
                <Text style={styles.historyAmountText}>{h.amount}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={{ height: vs(40) }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent: { paddingTop: vs(10), paddingHorizontal: hs(0), paddingBottom: vs(20) },
  loadingContainer: { justifyContent: "center", alignItems: "center", height: "100%" },

  /* --- HEADER --- */
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: vs(20),
  },
  backBtn: {
    marginRight: hs(15),
  },
  headerTitle: {
    fontFamily: "Gilroy-Bold",
    fontSize: fs(22),
    color: "#000",
  },

  /* --- PROFILE CARD --- */
  profileCard: {
    backgroundColor: "#F6F8FA",
    borderRadius: ms(16),
    padding: ms(16),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: vs(16),
  },
  profileLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    width: ms(50),
    height: ms(50),
    borderRadius: ms(25),
    backgroundColor: "#EBF3FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: hs(12),
  },
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: ms(25),
  },
  profileName: {
    fontFamily: "Gilroy-Bold",
    fontSize: fs(16),
    color: "#000",
  },
  profilePhone: {
    fontFamily: "Gilroy-Medium",
    fontSize: fs(16),
    color: "#666",
    marginBottom: vs(4),
  },
  offlineTag: {
    backgroundColor: "#FFEDED",
    paddingHorizontal: hs(8),
    paddingVertical: vs(2),
    borderRadius: ms(12),
    alignSelf: "flex-start",
  },
  offlineTagText: {
    fontFamily: "Gilroy-SemiBold",
    fontSize: fs(16),
    color: "#E55959",
  },
  profileActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(8),
  },
  actionIconBtn: {
    width: ms(36),
    height: ms(36),
    borderRadius: ms(18),
    backgroundColor: "#00B562",
    justifyContent: "center",
    alignItems: "center",
  },
  callIconBtn: {
    width: ms(36),
    height: ms(36),
    borderRadius: ms(18),
    backgroundColor: "#63A1FD",
    justifyContent: "center",
    alignItems: "center",
  },
  whatsappIcon: {
    width: ms(24),
    height: ms(24),
    resizeMode: "contain",
  },

  /* --- INFO GRID --- */
  gridContainer: {
    marginBottom: vs(16),
    gap: vs(12),
  },
  gridRow: {
    flexDirection: "row",
    gap: hs(12),
  },
  gridCard: {
    flex: 1,
    backgroundColor: "#F6F8FA",
    borderRadius: ms(16),
    padding: ms(12),
    flexDirection: "row",
    alignItems: "center",
    gap: hs(10),
  },
  iconCircleLightBlue: {
    width: ms(32),
    height: ms(32),
    borderRadius: ms(16),
    backgroundColor: "#EBF3FF",
    justifyContent: "center",
    alignItems: "center",
  },
  gridTextContainer: {
    flex: 1,
  },
  gridLabel: {
    fontFamily: "Gilroy-SemiBold",
    fontSize: fs(16),
    color: "#000",
    marginBottom: vs(2),
  },
  gridValue: {
    fontFamily: "Gilroy-Medium",
    fontSize: fs(16),
    color: "#000",
  },

  /* --- PAYMENT SUMMARY --- */
  paymentSummaryCard: {
    backgroundColor: "#F6F8FA",
    borderRadius: ms(16),
    padding: ms(16),
    marginBottom: vs(16),
  },
  paymentSummaryTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: vs(16),
  },
  paymentCol: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: hs(8),
  },
  iconCircleLightRed: {
    width: ms(28),
    height: ms(28),
    borderRadius: ms(14),
    backgroundColor: "#FFEDED",
    justifyContent: "center",
    alignItems: "center",
  },
  iconCircleLightGreen: {
    width: ms(28),
    height: ms(28),
    borderRadius: ms(14),
    backgroundColor: "#E6F8F0",
    justifyContent: "center",
    alignItems: "center",
  },
  paymentTextContainer: {
    flex: 1,
  },
  paymentLabel: {
    fontFamily: "Gilroy-Medium",
    fontSize: fs(16),
    color: "#000",
  },
  pendingAmountText: {
    fontFamily: "Gilroy-SemiBold",
    fontSize: fs(18),
    color: "#E55959",
    marginTop: vs(2),
  },
  receivedAmountText: {
    fontFamily: "Gilroy-SemiBold",
    fontSize: fs(18),
    color: "#00B562",
    marginTop: vs(2),
  },
  addMoneyBtn: {
    backgroundColor: "#63A1FD",
    borderRadius: ms(10),
    paddingVertical: vs(12),
    alignItems: "center",
  },
  addMoneyText: {
    fontFamily: "Gilroy-Bold",
    fontSize: fs(16),
    color: "#FFF",
  },
  paymentDrawer: {
    padding: ms(15),
    borderWidth: 1,
    borderColor: "#CBDFFE",
    borderRadius: ms(10),
    marginBottom: vs(16),
    gap: vs(10),
  },
  confirmPaymentBtn: {
    backgroundColor: "#000",
    height: vs(44),
    borderRadius: ms(10),
    justifyContent: "center",
    alignItems: "center",
  },
  bisonText: {
    fontFamily: "Bison-Bold",
    fontSize: fs(22),
    color: "#FFF",
    letterSpacing: 1,
  },

  /* --- PAYMENT HISTORY --- */
  historyCard: {
    borderWidth: 1,
    borderColor: "#CBDFFE",
    borderRadius: ms(16),
    padding: ms(16),
    backgroundColor: "#FFF",
  },
  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  historyTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(8),
  },
  historyTitle: {
    fontFamily: "Gilroy-Bold",
    fontSize: fs(16),
    color: "#000",
  },
  historyBody: {
    marginTop: vs(16),
  },
  historyListItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: vs(12),
  },
  historyListLeft: {
    flexDirection: "row",
    alignItems: "center",
    width: hs(90),
    gap: hs(8),
  },
  paymentMethodIcon: {
    width: ms(24),
    height: ms(24),
    resizeMode: "contain",
  },
  historyMethodName: {
    fontFamily: "Gilroy-Medium",
    fontSize: fs(16),
    color: "#000",
    textTransform: "capitalize",
  },
  historyDateText: {
    fontFamily: "Gilroy-Medium",
    fontSize: fs(16),
    color: "#000",
    flex: 1,
    textAlign: "center",
  },
  historyAmountText: {
    fontFamily: "Gilroy-SemiBold",
    fontSize: fs(16),
    color: "#00B562",
    width: hs(60),
    textAlign: "right",
  },
});
