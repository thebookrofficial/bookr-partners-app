/**
 * @format
 */

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
