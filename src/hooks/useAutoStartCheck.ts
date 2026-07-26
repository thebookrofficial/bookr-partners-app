import { useState, useEffect } from "react";
import { Platform, NativeModules } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { AutoStartModule } = NativeModules;
const AUTOSTART_CHECKED_KEY = "@autostart_checked_v1";

export function useAutoStartCheck() {
  const [needsAutoStart, setNeedsAutoStart] = useState(false);

  useEffect(() => {
    checkAutoStart();
  }, []);

  const checkAutoStart = async () => {
    if (Platform.OS !== "android") return;

    try {
      const hasChecked = await AsyncStorage.getItem(AUTOSTART_CHECKED_KEY);
      if (hasChecked === "true") return;

      const manufacturer = await AutoStartModule.getManufacturer();

      const chineseOems = [
        "xiaomi",
        "redmi",
        "poco",
        "oppo",
        "realme",
        "vivo",
        "iqoo",
        "huawei",
        "honor",
        "samsung",
      ];
      const isAggressiveOem = chineseOems.some(oem => manufacturer.includes(oem));

      if (isAggressiveOem) {
        setNeedsAutoStart(true);
      } else {
        // If not a problematic OEM, just mark it as checked
        await AsyncStorage.setItem(AUTOSTART_CHECKED_KEY, "true");
      }
    } catch (e) {
      console.error("Error checking autostart", e);
    }
  };

  const openAutoStartSettings = async () => {
    try {
      await AutoStartModule.openAutoStartSettings();
      // Assume the user fixed it
      await AsyncStorage.setItem(AUTOSTART_CHECKED_KEY, "true");
      setNeedsAutoStart(false);
    } catch (e) {
      console.error("Error opening autostart settings", e);
    }
  };

  return { needsAutoStart, openAutoStartSettings };
}
