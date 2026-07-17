import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Pressable,
  Image,
  ActivityIndicator,
} from "react-native";
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { Text } from "@/components/ui";
import { ChevronLeft, MinusCircle } from "lucide-react-native";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MainStackParamList } from "@/navigation/navigation.types";
import { useBookingDetails } from "../hooks/useBookingDetails";

const icGpay = require("@/assets/icons/google-pay.png");
const icPhonepe = require("@/assets/icons/icons8-phone-pe-48.png");
const icPaytm = require("@/assets/icons/paytm.png");
const icCash = require("@/assets/icons/pay-50.png");
// You can use a generic icon for 'other' or 'card'

export const PaymentHistoryScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const route = useRoute<RouteProp<MainStackParamList, "PaymentHistory">>();
  const { bookingId } = route.params;

  const { paymentLogs, loading, isSaving, removePaymentLog } = useBookingDetails(bookingId);

  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const getIconForMode = (mode: string, note?: string) => {
    const noteUpper = note?.toUpperCase() || "";
    if (noteUpper === "GPAY") return icGpay;
    if (noteUpper === "PHONEPE") return icPhonepe;
    if (noteUpper === "PAYTM") return icPaytm;
    if (noteUpper === "CASH" || mode === "cash") return icCash;
    if (mode === "upi") return icGpay; // fallback
    return icCash;
  };

  const getNameForMode = (mode: string, note?: string) => {
    const noteUpper = note?.toUpperCase() || "";
    if (["GPAY", "PHONEPE", "PAYTM", "CASH"].includes(noteUpper)) {
      return noteUpper === "GPAY"
        ? "GPay"
        : noteUpper === "PHONEPE"
        ? "PhonePe"
        : noteUpper === "PAYTM"
        ? "Paytm"
        : "Cash";
    }
    return mode === "upi" ? "Online" : mode.toUpperCase();
  };

  const handleCancelPayment = async () => {
    if (!selectedLog) return;
    const success = await removePaymentLog(selectedLog.id);
    if (success) {
      setShowCancelModal(false);
      setSelectedLog(null);
    }
  };

  return (
    <ScreenContainer scrollable={false}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={ms(24)} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text variant="h2" weight="bold" color={COLORS.text.primary} style={styles.title}>
          Payment History
        </Text>
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {paymentLogs.length === 0 ? (
            <Text
              variant="body1"
              color={COLORS.text.muted}
              style={{ textAlign: "center", marginTop: vs(40) }}>
              No payment logs found.
            </Text>
          ) : (
            paymentLogs.map(log => {
              const icon = getIconForMode(log.payment_mode, log.note);
              const name = getNameForMode(log.payment_mode, log.note);
              return (
                <View key={log.id} style={styles.logCard}>
                  <Image source={icon} style={styles.logIcon} />
                  <View style={styles.logCol}>
                    <Text variant="body2" weight="bold" style={styles.logName}>
                      {name}
                    </Text>
                    <Text variant="caption" weight="medium" style={styles.logDate}>
                      {new Date(log.created_at).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </Text>
                  </View>
                  <Text variant="h3" weight="bold" style={styles.logAmount}>
                    ₹{log.amount}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedLog(log);
                      setShowCancelModal(true);
                    }}>
                    <MinusCircle size={ms(30)} color="#E55959" />
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Cancel Modal Bottom Sheet */}
      <Modal
        visible={showCancelModal}
        transparent
        animationType="slide"
        statusBarTranslucent={true}>
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowCancelModal(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTextCol}>
                <Text variant="h2" weight="bold" color={COLORS.text.primary}>
                  ₹{selectedLog?.amount}
                </Text>
                <Text
                  variant="body1"
                  weight="bold"
                  color={COLORS.text.primary}
                  style={styles.modalQuestion}>
                  Are you sure you want to cancel this Payment?
                </Text>
              </View>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleCancelPayment}
                disabled={isSaving}>
                {isSaving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text variant="h3" weight="bold" style={styles.confirmBtnText}>
                    Yes
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: vs(20),
    paddingBottom: vs(16),
  },
  backBtn: {
    paddingRight: hs(16),
  },
  title: {
    fontSize: fs(22),
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingBottom: vs(40),
  },
  logCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f4f7fc",
    borderRadius: ms(10),
    padding: ms(10),
    marginBottom: vs(12),
    gap: hs(8),
  },
  logIcon: {
    width: ms(48),
    height: ms(48),
    resizeMode: "contain",
  },
  logCol: {
    width: ms(120),
    gap: vs(4),
  },
  logName: {
    fontSize: fs(14),
    color: "#000",
  },
  logDate: {
    fontSize: fs(12),
    color: "#000",
  },
  logAmount: {
    flex: 1,
    fontSize: fs(18),
    color: "#00b562",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: ms(20),
    borderTopRightRadius: ms(20),
    paddingHorizontal: hs(16),
    paddingTop: vs(16),
    paddingBottom: vs(75),
    borderTopWidth: 1,
    borderColor: "#cbdffe",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTextCol: {
    flex: 1,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  modalQuestion: {
    fontSize: fs(16),
    lineHeight: fs(20),
    marginTop: vs(4),
    width: "90%",
  },
  confirmBtn: {
    backgroundColor: "#e55959",
    borderRadius: ms(10),
    paddingVertical: vs(10),
    paddingHorizontal: hs(24),
    justifyContent: "center",
    alignItems: "center",
  },
  confirmBtnText: {
    color: "#fff",
    fontSize: fs(20),
    fontFamily: "Bison-Bold",
    textTransform: "uppercase",
  },
});
