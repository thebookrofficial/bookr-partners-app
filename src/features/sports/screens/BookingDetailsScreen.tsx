// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, Image } from "react-native";
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { Text } from "@/components/ui";
import {
  ArrowLeft,
  Phone,
  Calendar,
  Clock,
  Plus,
  Minus,
  FileText,
  ChevronRight,
  MessageCircle, // <-- Imported for WhatsApp Icon
} from "lucide-react-native";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
import { useNavigation } from "@react-navigation/native";

export const BookingDetailsScreen = () => {
  const navigation = useNavigation();
  const [isAddingPayment, setIsAddingPayment] = useState(false);

  return (
    <ScreenContainer scrollable backgroundColor={COLORS.background} paddingHorizontal={hs(12)}>
      {/* 1. Header Section */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={ms(24)} color={COLORS.text.primary} />
        </TouchableOpacity>

        <Image source={{ uri: "https://placeholder.com/50" }} style={styles.avatar} />

        <Text variant="h3" weight="bold" style={styles.headerName}>
          Chirag Patil
        </Text>

        <Text variant="body2" weight="semiBold" style={styles.categoryText}>
          Football
        </Text>
      </View>

      {/* 2. Mobile Number Section */}
      <View style={styles.fieldGroup}>
        <View style={styles.labelRow}>
          <Phone size={ms(16)} color={COLORS.primary} fill={COLORS.primary} />
          <Text variant="body2" weight="medium">
            Mobile No
          </Text>
        </View>
        <View style={styles.inputBoxRow}>
          <Text variant="body2" weight="semiBold" style={styles.inputText}>
            +91 78349 89934
          </Text>

          {/* Action Buttons Wrapper */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.whatsappBtn} activeOpacity={0.7}>
              <MessageCircle size={ms(14)} color={COLORS.text.inverse} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.callButton} activeOpacity={0.7}>
              <Text variant="body2" weight="bold" color={COLORS.text.inverse}>
                Call
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* 3. Date & Time Row */}
      <View style={styles.row}>
        <View style={[styles.fieldGroup, styles.flex1]}>
          <View style={styles.labelRow}>
            <Calendar size={ms(16)} color={COLORS.primary} />
            <Text variant="body2" weight="medium">
              Date
            </Text>
          </View>
          <View style={styles.inputBox}>
            <Text variant="body2" weight="semiBold" style={styles.inputText}>
              03/04/2026
            </Text>
          </View>
        </View>

        <View style={[styles.fieldGroup, styles.flex1]}>
          <View style={styles.labelRow}>
            <Clock size={ms(16)} color={COLORS.primary} />
            <Text variant="body2" weight="medium">
              Time
            </Text>
          </View>
          <View style={styles.inputBox}>
            <Text variant="body2" weight="semiBold" style={styles.inputText}>
              7 Am - 8 Am
            </Text>
          </View>
        </View>
      </View>

      {/* 4. Total Payment */}
      <View style={styles.fieldGroup}>
        <Text variant="body2" weight="bold" style={styles.standaloneLabel}>
          Total Payment
        </Text>
        <View style={styles.inputBox}>
          <Text variant="body2" weight="semiBold" style={styles.inputText}>
            ₹ 1000
          </Text>
        </View>
      </View>

      {/* 5. Remaining Amount */}
      <View style={styles.fieldGroup}>
        <Text variant="body2" weight="bold" style={styles.standaloneLabel}>
          Remaining Amount
        </Text>
        <View style={styles.inputBox}>
          <Text variant="body2" weight="semiBold" color={COLORS.danger}>
            ₹900
          </Text>
        </View>
      </View>

      {/* 6. Amount Paid (with interactive toggle button) */}
      <View style={styles.fieldGroup}>
        <Text variant="body2" weight="bold" style={styles.standaloneLabel}>
          Amount Paid
        </Text>
        <View style={styles.inputBoxRow}>
          <Text variant="body2" weight="semiBold" color="#00B562" style={styles.inputText}>
            ₹ 100
          </Text>
          <TouchableOpacity
            style={styles.addButton}
            activeOpacity={0.7}
            onPress={() => setIsAddingPayment(!isAddingPayment)}>
            <Text
              variant="body2"
              weight="semiBold"
              color={isAddingPayment ? COLORS.danger : "#00B562"}>
              {isAddingPayment ? "Cancel" : "Add"}
            </Text>
            {isAddingPayment ? (
              <Minus size={ms(16)} color={COLORS.danger} />
            ) : (
              <Plus size={ms(16)} color="#00B562" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* 7. Cash / Online Split Box */}
      {isAddingPayment && (
        <View style={styles.splitBox}>
          <Text variant="body2" weight="medium" style={styles.splitLabel}>
            Cash
          </Text>
          <View style={styles.inputBox}>
            <Text variant="body2" weight="semiBold" style={styles.inputText}>
              ₹800
            </Text>
          </View>

          <Text variant="body2" weight="medium" style={styles.splitLabel}>
            Online
          </Text>
          <View style={styles.inputBox}>
            <Text variant="body2" weight="semiBold" style={styles.inputText}>
              ₹ 100
            </Text>
          </View>
        </View>
      )}

      {/* 8. Save Button */}
      <TouchableOpacity style={styles.saveButton} activeOpacity={0.8}>
        <Text variant="h3" family="nichrome" color={COLORS.text.inverse} style={styles.saveText}>
          SAVE
        </Text>
      </TouchableOpacity>

      {/* 9. Previous History Row */}
      <TouchableOpacity style={styles.historyRow} activeOpacity={0.7}>
        <FileText size={ms(20)} color={COLORS.text.primary} />
        <Text variant="body2" weight="semiBold" style={styles.historyText}>
          Previous History
        </Text>
        <ChevronRight size={ms(20)} color={COLORS.text.primary} />
      </TouchableOpacity>

      <View style={{ height: vs(40) }} />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: vs(10),
    marginBottom: vs(20),
  },
  backBtn: {
    marginRight: hs(10),
  },
  avatar: {
    width: ms(50),
    height: ms(50),
    borderRadius: ms(25),
    backgroundColor: COLORS.danger,
    marginRight: hs(10),
  },
  headerName: {
    flex: 1,
    fontSize: fs(22),
  },
  categoryText: {
    textTransform: "capitalize",
  },
  fieldGroup: {
    marginBottom: vs(14),
  },
  row: {
    flexDirection: "row",
    gap: hs(20),
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(6),
    marginBottom: vs(4),
  },
  standaloneLabel: {
    marginBottom: vs(4),
  },
  inputBox: {
    backgroundColor: COLORS.surface.primary,
    borderRadius: ms(10),
    paddingVertical: vs(12),
    paddingHorizontal: hs(10),
    justifyContent: "center",
    minHeight: vs(40),
  },
  inputBoxRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface.primary,
    borderRadius: ms(10),
    paddingVertical: vs(8),
    paddingHorizontal: hs(10),
    minHeight: vs(46),
  },
  inputText: {
    flex: 1,
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(8),
  },
  whatsappBtn: {
    backgroundColor: "#25D366", // WhatsApp Green
    paddingHorizontal: hs(16),
    paddingVertical: vs(7),
    borderRadius: ms(6),
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  callButton: {
    backgroundColor: "#000000",
    paddingHorizontal: hs(14),
    paddingVertical: vs(6),
    borderRadius: ms(6),
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.25)",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(4),
    padding: hs(4),
  },
  splitBox: {
    borderWidth: 1,
    borderColor: COLORS.border.navBar,
    borderRadius: ms(10),
    padding: hs(10),
    gap: vs(10),
    marginBottom: vs(20),
  },
  splitLabel: {
    marginBottom: -vs(4),
  },
  saveButton: {
    backgroundColor: "#000000",
    borderRadius: ms(10),
    height: vs(44),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: vs(16),
  },
  saveText: {
    fontSize: fs(20),
    textTransform: "uppercase",
  },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border.navBar,
    borderRadius: ms(10),
    paddingHorizontal: hs(10),
    height: vs(40),
  },
  historyText: {
    flex: 1,
    marginLeft: hs(6),
  },
});
