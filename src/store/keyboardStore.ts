import { create } from "zustand";

interface KeyboardState {
  isNumericFocused: boolean;
  setIsNumericFocused: (val: boolean) => void;
}

export const useKeyboardStore = create<KeyboardState>(set => ({
  isNumericFocused: false,
  setIsNumericFocused: val => set({ isNumericFocused: val }),
}));
