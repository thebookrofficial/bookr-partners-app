import React from "react";
import { Modal, View, StyleSheet, TouchableOpacity } from "react-native";
import { Text } from "@/components/ui/Text";
import { COLORS } from "@/constants/theme";
import { vs, hs } from "@/utils/responsive.utils";
import { BatteryWarning } from "lucide-react-native";

interface AutoStartPromptProps {
  visible: boolean;
  onFixSettings: () => void;
}

export function AutoStartPrompt({ visible, onFixSettings }: AutoStartPromptProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.iconContainer}>
            <BatteryWarning size={hs(32)} color={COLORS.primary} />
          </View>

          <Text variant="h3" style={styles.title}>
            Important Action Required
          </Text>

          <Text variant="body1" style={styles.description}>
            Your phone's battery optimizer will kill this app in the background. To ensure you NEVER
            miss a new booking notification, you must allow Bookr to run in the background.
          </Text>

          <Text variant="caption" style={styles.instructions}>
            Click below to open settings. Look for "Battery Optimization" or "Autostart" and allow
            the app.
          </Text>

          <TouchableOpacity style={styles.button} onPress={onFixSettings} activeOpacity={0.8}>
            <Text style={styles.buttonText}>Fix Settings Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: hs(24),
  },
  container: {
    backgroundColor: COLORS.background,
    borderRadius: hs(16),
    padding: hs(24),
    alignItems: "center",
    width: "100%",
  },
  iconContainer: {
    width: hs(64),
    height: hs(64),
    borderRadius: hs(32),
    backgroundColor: COLORS.primary + "20",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: vs(16),
  },
  title: {
    color: COLORS.text.primary,
    marginBottom: vs(12),
    textAlign: "center",
  },
  description: {
    color: COLORS.text.secondary,
    textAlign: "center",
    marginBottom: vs(16),
    lineHeight: 22,
  },
  instructions: {
    color: COLORS.text.muted,
    textAlign: "center",
    marginBottom: vs(24),
    fontStyle: "italic",
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: vs(14),
    paddingHorizontal: hs(32),
    borderRadius: hs(12),
    width: "100%",
    alignItems: "center",
  },
  buttonText: {
    color: COLORS.text.inverse,
    fontWeight: "bold",
    fontSize: hs(16),
  },
});
