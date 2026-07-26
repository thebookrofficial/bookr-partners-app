/**
 * @format
 */

// Completely disable Firebase deprecation warnings at the core level so they stop lagging the JS thread!
// eslint-disable-next-line no-undef
globalThis.RNFB_SILENCE_MODULAR_DEPRECATION_WARNINGS = true;

import "react-native-gesture-handler";
import { AppRegistry } from "react-native";
import App from "./App";
import { name as appName } from "./app.json";

import messaging from "@react-native-firebase/messaging";

// Register background handler before AppRegistry
messaging().setBackgroundMessageHandler(async remoteMessage => {
  // eslint-disable-next-line no-console
  console.log("Message handled in the background!", remoteMessage);
});

AppRegistry.registerComponent(appName, () => App);
