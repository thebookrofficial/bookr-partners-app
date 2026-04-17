// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React from "react";
import { View, StyleSheet, TouchableOpacity, Modal, ScrollView } from "react-native";
import { Text, TextInput } from "@/components/ui";
import {
  Calendar as CalendarIcon,
  Phone,
  User as UserIcon,
  Clock,
  FileText,
  ChevronRight,
  ChevronDown,
} from "lucide-react-native";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";

interface OfflineBookingSheetProps {
  isVisible: boolean;
  onClose: () => void;
}

/**
 * FIX: Moved outside to prevent 'react/no-unstable-nested-components'
 */
const CustomLabel = ({ icon: Icon, text }: { icon: any; text: string }) => (
  <View style={styles.labelRow}>
    <Icon size={ms(16)} color={COLORS.primary} />
    <Text variant="body2" weight="medium">
      {text}
    </Text>
  </View>
);

export const OfflineBookingSheet = ({ isVisible, onClose }: OfflineBookingSheetProps) => {
  return (
    <Modal visible={isVisible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.bottomSheetContainer}>
          <View style={styles.handle} />

          <View style={styles.sheetHeader}>
            <Text variant="body1" weight="bold" style={styles.headerText}>
              Offline Booking
            </Text>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.sheetContent}>
            <TextInput
              variant="filled"
              label={<CustomLabel icon={CalendarIcon} text="Selected Date" />}
              value="12/04/2026"
              rightIcon={<ChevronDown size={ms(16)} color={COLORS.text.primary} />}
              editable={false}
            />

            <TextInput
              variant="filled"
              label={<CustomLabel icon={Phone} text="Mobile No" />}
              placeholder="+91 78349 89934"
              keyboardType="phone-pad"
            />

            <TextInput
              variant="filled"
              label={<CustomLabel icon={UserIcon} text="Name" />}
              placeholder="Yash"
            />

            <View style={styles.row}>
              <View style={styles.flex1}>
                <TextInput
                  variant="filled"
                  label={<CustomLabel icon={Clock} text="Time" />}
                  value="7 Am -8 Am"
                  editable={false}
                />
              </View>
              <View style={styles.flex1}>
                <TextInput
                  variant="filled"
                  label={
                    <Text variant="body2" weight="medium">
                      Add More Time Slots
                    </Text>
                  }
                  placeholder="7 Am -8 Am"
                  rightIcon={<ChevronDown size={ms(16)} color={COLORS.text.primary} />}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.flex1}>
                <TextInput
                  variant="filled"
                  label={<CustomLabel icon={Clock} text="Total Payment" />}
                  placeholder="₹ 1000"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.flex1}>
                <TextInput
                  variant="filled"
                  label={
                    <Text variant="body2" weight="medium">
                      Advance Paid
                    </Text>
                  }
                  placeholder="₹"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <TouchableOpacity style={styles.historyRow} activeOpacity={0.7}>
              <FileText size={ms(20)} color={COLORS.text.primary} />
              <Text variant="body2" weight="semiBold" style={styles.historyText}>
                Previous History
              </Text>
              <ChevronRight size={ms(20)} color={COLORS.text.primary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveButton} activeOpacity={0.8} onPress={onClose}>
              <Text
                variant="h3"
                family="nichrome"
                color={COLORS.text.inverse}
                style={styles.saveText}>
                BOOK NOW
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  bottomSheetContainer: {
    width: "100%",
    backgroundColor: COLORS.background,
    borderTopLeftRadius: ms(20),
    borderTopRightRadius: ms(20),
    borderTopWidth: 1,
    borderTopColor: COLORS.border.navBar,
    paddingTop: vs(12),
    paddingHorizontal: hs(12),
    paddingBottom: vs(30),
    maxHeight: "85%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 10,
  },
  handle: {
    width: hs(40),
    height: vs(4),
    backgroundColor: COLORS.surface.fallback,
    borderRadius: ms(2),
    alignSelf: "center",
    marginBottom: vs(12),
  },
  sheetHeader: {
    marginBottom: vs(16),
    paddingHorizontal: hs(6),
  },
  headerText: {
    textTransform: "uppercase",
  },
  sheetContent: {
    paddingBottom: vs(20),
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(6),
  },
  row: {
    flexDirection: "row",
    gap: hs(20),
    width: "100%",
  },
  flex1: {
    flex: 1,
  },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border.navBar,
    borderRadius: ms(10),
    paddingHorizontal: hs(10),
    height: vs(40),
    marginBottom: vs(16),
  },
  historyText: {
    flex: 1,
    marginLeft: hs(6),
  },
  saveButton: {
    backgroundColor: "#000000",
    borderRadius: ms(10),
    height: vs(44),
    justifyContent: "center",
    alignItems: "center",
  },
  saveText: {
    fontSize: fs(20),
    textTransform: "uppercase",
  },
});
