// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState, useMemo } from "react";
import { View, Modal, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { Calendar } from "react-native-calendars";
import { Text, Button } from "@/components/ui";
import { hs, vs, ms } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
import { X } from "lucide-react-native";

interface DownloadPayoutsModalProps {
  visible: boolean;
  onClose: () => void;
  onDownload: (startDate: string, endDate: string) => Promise<void>;
  loading: boolean;
}

export const DownloadPayoutsModal = ({
  visible,
  onClose,
  onDownload,
  loading,
}: DownloadPayoutsModalProps) => {
  console.warn("DownloadPayoutsModal rendered, visible:", visible);
  const [range, setRange] = useState<{ start?: string; end?: string }>({});

  const onDayPress = (day: any) => {
    const { dateString } = day;

    if (!range.start || (range.start && range.end)) {
      setRange({ start: dateString });
    } else if (range.start && !range.end) {
      if (dateString < range.start) {
        setRange({ start: dateString });
      } else {
        setRange({ ...range, end: dateString });
      }
    }
  };

  const markedDates = useMemo(() => {
    const marked: any = {};
    if (range.start) {
      marked[range.start] = { startingDay: true, color: COLORS.primary, textColor: "white" };
    }
    if (range.end) {
      marked[range.end] = { endingDay: true, color: COLORS.primary, textColor: "white" };

      // Fill in between
      let start = new Date(range.start!);
      let end = new Date(range.end);
      while (start < end) {
        start.setDate(start.getDate() + 1);
        const dateString = start.toISOString().split("T")[0];
        if (dateString !== range.end) {
          marked[dateString] = { color: COLORS.primary + "40", textColor: COLORS.primary };
        }
      }
    }
    return marked;
  }, [range]);

  const handleDownload = () => {
    if (range.start && range.end) {
      onDownload(range.start, range.end);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text variant="h3" weight="bold">
              Download Payouts
            </Text>
            <TouchableOpacity onPress={onClose}>
              <X size={ms(24)} color={COLORS.text.primary} />
            </TouchableOpacity>
          </View>

          <Text variant="body2" color={COLORS.text.muted} style={styles.instruction}>
            Select a date range to download the payout report in PDF format.
          </Text>

          <Calendar
            onDayPress={onDayPress}
            markedDates={markedDates}
            markingType={"period"}
            theme={{
              todayTextColor: COLORS.primary,
              arrowColor: COLORS.primary,
              monthTextColor: COLORS.text.primary,
              textDayFontWeight: "600",
              textMonthFontWeight: "bold",
              textDayHeaderFontWeight: "600",
            }}
          />

          <View style={styles.footer}>
            <View style={styles.datePreview}>
              <View>
                <Text variant="caption" color={COLORS.text.muted}>
                  From
                </Text>
                <Text variant="body2" weight="semiBold">
                  {range.start || "Select date"}
                </Text>
              </View>
              <View style={styles.divider} />
              <View>
                <Text variant="caption" color={COLORS.text.muted}>
                  To
                </Text>
                <Text variant="body2" weight="semiBold">
                  {range.end || "Select date"}
                </Text>
              </View>
            </View>

            <Button
              title={loading ? "" : "Download PDF"}
              onPress={handleDownload}
              disabled={!range.start || !range.end || loading}
              style={styles.downloadBtn}>
              {loading && <ActivityIndicator color="white" />}
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: hs(20),
  },
  container: {
    backgroundColor: COLORS.background,
    borderRadius: ms(16),
    width: "100%",
    padding: ms(20),
    gap: vs(15),
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  instruction: { marginBottom: vs(10) },
  footer: { gap: vs(15), marginTop: vs(10) },
  datePreview: {
    flexDirection: "row",
    backgroundColor: COLORS.surface.primary,
    borderRadius: ms(10),
    padding: ms(12),
    alignItems: "center",
    justifyContent: "space-around",
  },
  divider: {
    width: 1,
    height: "100%",
    backgroundColor: COLORS.text.muted + "40",
  },
  downloadBtn: { height: vs(48) },
});
