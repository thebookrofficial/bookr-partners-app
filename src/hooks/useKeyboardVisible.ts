import { useState, useEffect } from "react";
import { Keyboard } from "react-native";

export const useKeyboardVisible = () => {
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener("keyboardWillShow", () =>
      setKeyboardVisible(true),
    );
    const keyboardDidShowListener = Keyboard.addListener("keyboardDidShow", () =>
      setKeyboardVisible(true),
    );
    const keyboardWillHideListener = Keyboard.addListener("keyboardWillHide", () =>
      setKeyboardVisible(false),
    );
    const keyboardDidHideListener = Keyboard.addListener("keyboardDidHide", () =>
      setKeyboardVisible(false),
    );

    return () => {
      keyboardWillHideListener.remove();
      keyboardDidHideListener.remove();
      keyboardWillShowListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  return isKeyboardVisible;
};
