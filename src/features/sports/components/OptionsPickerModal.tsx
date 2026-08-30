import React from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import { Text } from "@/components/ui";
import { COLORS } from "@/constants/theme";
import { vs, ms, fs } from "@/utils/responsive.utils";

interface OptionsPickerModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  options: { label: string; value: string }[];
  selectedValue: string;
  onSelectOption: (value: string) => void;
}

export const OptionsPickerModal = ({
  visible,
  onClose,
  title,
  options,
  selectedValue,
  onSelectOption,
}: OptionsPickerModalProps) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay} pointerEvents="auto">
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={StyleSheet.absoluteFillObject} />
        </TouchableWithoutFeedback>
        <View style={styles.container}>
          <Text variant="h3" weight="bold" style={styles.header}>
            {title}
          </Text>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
            {options.map((opt, idx) => (
              <TouchableOpacity
                key={idx}
                style={[styles.item, selectedValue === opt.value && styles.itemActive]}
                onPress={() => {
                  onSelectOption(opt.value);
                  onClose();
                }}>
                <Text
                  weight={selectedValue === opt.value ? "bold" : "medium"}
                  color={selectedValue === opt.value ? "#fff" : COLORS.text.primary}
                  style={{ fontSize: fs(14) }}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: "90%",
    maxHeight: "60%",
    backgroundColor: COLORS.background,
    borderRadius: ms(12),
    padding: ms(16),
  },
  header: {
    marginBottom: vs(15),
    textAlign: "center",
    textTransform: "uppercase",
  },
  list: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    gap: ms(8),
  },
  item: {
    paddingHorizontal: ms(16),
    paddingVertical: vs(10),
    borderRadius: ms(6),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5F5F5",
    minWidth: "30%",
  },
  itemActive: {
    backgroundColor: COLORS.primary,
  },
});
