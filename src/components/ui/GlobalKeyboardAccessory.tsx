import React, { useEffect, useState } from "react";
import { View, TouchableOpacity, Keyboard, Platform, StyleSheet } from "react-native";
import { ArrowRightToLine } from "lucide-react-native";
import { COLORS } from "@/constants/theme";
import { ms, hs, vs } from "@/utils/responsive.utils";

export const GlobalKeyboardAccessory = () => {
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    // On iOS we use willShow/willHide for smoother animation tracking.
    // On Android we use didShow/didHide.
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSubscription = Keyboard.addListener(showEvent, e => {
      setKeyboardVisible(true);
      // Android adjusts window size automatically if windowSoftInputMode is adjustResize.
      // So we only push it up on iOS.
      setKeyboardHeight(Platform.OS === "ios" ? e.endCoordinates.height : 0);
    });

    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardVisible(false);
      setKeyboardHeight(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  if (!isKeyboardVisible) return null;

  return (
    <View style={[styles.container, { bottom: keyboardHeight }]} pointerEvents="box-none">
      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.button}
        onPress={() => Keyboard.dismiss()}>
        <ArrowRightToLine size={ms(24)} color="#fff" />
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
    width: ms(44),
    height: ms(44),
    borderRadius: ms(10),
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
});
