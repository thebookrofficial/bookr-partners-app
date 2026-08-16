import React, { useEffect, useState } from "react";
import { View, TouchableOpacity, Keyboard, Platform, StyleSheet } from "react-native";
import { ArrowRightToLine } from "lucide-react-native";
import { COLORS } from "@/constants/theme";
import { ms, hs, vs } from "@/utils/responsive.utils";
import { useKeyboardStore } from "@/store/keyboardStore";

export const GlobalKeyboardAccessory = () => {
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const isNumericFocused = useKeyboardStore(state => state.isNumericFocused);

  useEffect(() => {
    // Listen to both willShow (smoother) and didShow (fallback for Modals on iOS)
    const showHandler = (e: any) => {
      setKeyboardVisible(true);
      setKeyboardHeight(Platform.OS === "ios" ? e.endCoordinates.height : 0);
    };

    const hideHandler = () => {
      setKeyboardVisible(false);
      setKeyboardHeight(0);
    };

    const subscriptions = [
      Keyboard.addListener(
        Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
        showHandler,
      ),
      Keyboard.addListener(
        Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
        hideHandler,
      ),
      Keyboard.addListener("keyboardDidShow", showHandler),
      Keyboard.addListener("keyboardDidHide", hideHandler),
    ];

    return () => {
      subscriptions.forEach(sub => sub.remove());
    };
  }, []);

  if (!isKeyboardVisible || !isNumericFocused) return null;

  return (
    <View style={[styles.container, { bottom: keyboardHeight }]} pointerEvents="box-none">
      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.button}
        onPress={() => Keyboard.dismiss()}>
        <ArrowRightToLine size={ms(28)} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    // Add small padding above the keyboard
    paddingBottom: vs(10),
    paddingRight: hs(16),
    alignItems: "flex-end",
    zIndex: 999, // Ensure it floats above other content
  },
  button: {
    backgroundColor: COLORS.primary,
    width: ms(52),
    height: ms(52),
    borderRadius: ms(12),
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
});
