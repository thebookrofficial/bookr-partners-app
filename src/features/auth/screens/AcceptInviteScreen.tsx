import React, { useState, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "@/constants/theme";
import { vs, ms, hs } from "@/utils/responsive.utils";
import { Text } from "@/components/ui";
import { useAuthStore } from "@/store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StaffService } from "@/features/profile/services/staff.service";
import { ArrowLeft } from "lucide-react-native";

export const AcceptInviteScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { session } = useAuthStore();

  const initialToken = route.params?.token || "";

  const [token, setToken] = useState(initialToken);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (route.params?.token) {
      setToken(route.params.token);
    }
  }, [route.params?.token]);

  const handleAccept = async () => {
    if (!token.trim()) {
      Alert.alert("Error", "Invalid or missing invite token.");
      return;
    }

    if (!session) {
      // Store token and redirect to Login
      try {
        await AsyncStorage.setItem("@pending_invite_token", token.trim());
        Alert.alert(
          "Authentication Required",
          "You must log in to accept this invite. You will be redirected.",
          [
            {
              text: "OK",
              onPress: () => navigation.navigate("Login"),
            },
          ],
        );
      } catch (err) {
        console.error("Failed to save pending invite token", err);
      }
      return;
    }

    try {
      setLoading(true);
      await StaffService.acceptStaffInvite(token.trim());
      Alert.alert(
        "Success",
        "Invite accepted successfully! Please refresh or re-login to update your profile.",
      );
      navigation.goBack();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to accept invite. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={ms(24)} color={COLORS.text.primary} />
        </TouchableOpacity>
      </View>
      <View style={styles.content}>
        <Text variant="h2" weight="bold" color={COLORS.text.primary} style={styles.title}>
          Accept Staff Invite
        </Text>
        <Text variant="body1" color={COLORS.text.muted} style={styles.subtitle}>
          You have been invited to join a business account. Click the button below to proceed.
        </Text>

        <TouchableOpacity style={styles.button} onPress={handleAccept} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={COLORS.text.inverse} />
          ) : (
            <Text variant="body1" weight="semiBold" color={COLORS.text.inverse}>
              {session ? "Accept Invite" : "Proceed to Login"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: hs(20),
    paddingTop: vs(20),
  },
  backButton: {
    padding: ms(8),
    marginLeft: -ms(8),
  },
  content: {
    flex: 1,
    paddingHorizontal: hs(20),
    paddingTop: vs(20),
  },
  title: {
    marginBottom: vs(10),
  },
  subtitle: {
    marginBottom: vs(30),
  },

  button: {
    backgroundColor: COLORS.primary,
    height: vs(50),
    borderRadius: ms(12),
    alignItems: "center",
    justifyContent: "center",
  },
});
