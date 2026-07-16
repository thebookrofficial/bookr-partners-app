import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import LottieView from "lottie-react-native";
import { COLORS } from "@/constants/theme";

const { width, height } = Dimensions.get("window");

interface SplashScreenProps {
  onFinish?: () => void;
}

export const SplashScreen = ({ onFinish }: SplashScreenProps) => {
  return (
    <View style={styles.container}>
      <LottieView
        source={require("@/assets/animations/splash-screen-animation.json")}
        autoPlay
        loop={false}
        onAnimationFinish={onFinish}
        style={styles.animation}
        resizeMode="cover"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background, // Or whatever background color the splash needs
    justifyContent: "center",
    alignItems: "center",
  },
  animation: {
    width: width,
    height: height,
  },
});
