// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, ScrollView, Modal } from "react-native";
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { Text, TextInput } from "@/components/ui";
import { EventHeader } from "../components/EventHeader";
import { Trash2, ChevronDown } from "lucide-react-native";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
import { useRoute, RouteProp } from "@react-navigation/native";
import { MainStackParamList } from "@/navigation/navigation.types";

const USER_PROFILE = require("../../../assets/icons/ic-user-profile.png");

export const EventGuestInviteScreen = () => {
  const route = useRoute<RouteProp<MainStackParamList, "EventGuestInvite">>();
  const _serviceId = route.params?.serviceId || "";

  // Form State
  const [guestName, setGuestName] = useState("Yash Patil");
  const [email, setEmail] = useState("pyash03@gmail.com");
  const [mobileNo, setMobileNo] = useState("+91 89127 83924");
  const [passType, setPassType] = useState("General Entry Pass");
  const [quantity, setQuantity] = useState("1");

  // Dropdown Selection State
  const [activeDropdown, setActiveDropdown] = useState<{
    type: "passType" | "quantity";
    options: string[];
  } | null>(null);

  const MOCK_INVITES = [
    { id: "1", email: "Viratkohli1818@gmail.com" },
    { id: "2", email: "Viratkohli1818@gmail.com" },
    { id: "3", email: "Viratkohli1818@gmail.com" },
  ];

  const selectOption = (option: string) => {
    if (!activeDropdown) return;
    if (activeDropdown.type === "passType") setPassType(option);
    else setQuantity(option);
    setActiveDropdown(null);
  };

  return (
    <ScreenContainer backgroundColor={COLORS.background} paddingHorizontal={hs(12)}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerWrapper}>
          <EventHeader
            title="Neon Shadow World Tour 2026"
            subtitle="Guest Invite"
            imageSource={USER_PROFILE}
          />
        </View>

        {/* GUEST INVITATION SECTION */}
        <View style={styles.section}>
          <Text weight="bold" style={styles.sectionTitle}>
            Guest invitation
          </Text>
          <Text weight="medium" style={styles.description}>
            Send Free Entry Qr Codes directly to guest emails.
          </Text>
        </View>

        {/* INVITE TO FORM */}
        <View style={styles.section}>
          <Text weight="bold" style={styles.sectionTitle}>
            INVITE TO
          </Text>

          <View style={styles.formGroup}>
            <Text variant="body2" weight="medium" style={styles.label}>
              Guest Name
            </Text>
            <TextInput
              variant="filled"
              value={guestName}
              onChangeText={setGuestName}
              placeholder="Guest Name"
            />
          </View>

          <View style={styles.formGroup}>
            <Text variant="body2" weight="medium" style={styles.label}>
              Email
            </Text>
            <TextInput
              variant="filled"
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.formGroup}>
            <Text variant="body2" weight="medium" style={styles.label}>
              Mobile No
            </Text>
            <TextInput
              variant="filled"
              value={mobileNo}
              onChangeText={setMobileNo}
              placeholder="Mobile No"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.row}>
            <View style={styles.flex1}>
              <Text variant="body2" weight="medium" style={styles.label}>
                Pass Type
              </Text>
              <TouchableOpacity
                style={styles.dropdownInput}
                onPress={() =>
                  setActiveDropdown({
                    type: "passType",
                    options: ["General Entry Pass", "VIP Pass", "VVIP Pass"],
                  })
                }>
                <Text weight="semiBold" style={styles.inputText}>
                  {passType}
                </Text>
                <ChevronDown size={ms(18)} color={COLORS.text.primary} />
              </TouchableOpacity>
            </View>
            <View style={styles.quantityCol}>
              <Text variant="body2" weight="medium" style={styles.label}>
                Quantity
              </Text>
              <TouchableOpacity
                style={styles.dropdownInput}
                onPress={() =>
                  setActiveDropdown({
                    type: "quantity",
                    options: ["1", "2", "3", "4", "5"],
                  })
                }>
                <Text weight="semiBold" style={styles.inputText}>
                  {quantity}
                </Text>
                <ChevronDown size={ms(18)} color={COLORS.text.primary} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.primaryBtn}>
            <Text family="bison" weight="bold" style={styles.btnText}>
              SEND PASS TO GUEST
            </Text>
          </TouchableOpacity>
        </View>

        {/* INVITE LIST SECTION */}
        <View style={styles.section}>
          <Text weight="bold" style={styles.sectionTitle}>
            INVITE LIST
          </Text>
          {MOCK_INVITES.map((invite, index) => (
            <View key={invite.id} style={styles.inviteRow}>
              <Text weight="semiBold" style={styles.indexText}>
                {index + 1}
              </Text>
              <Text weight="semiBold" style={styles.emailText}>
                {invite.email}
              </Text>
              <TouchableOpacity>
                <Trash2 size={ms(24)} color={COLORS.danger} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={{ height: vs(120) }} />
      </ScrollView>

      {/* OPTIONS MODAL */}
      <Modal
        visible={!!activeDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveDropdown(null)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setActiveDropdown(null)}>
          <View style={styles.optionsContainer}>
            {activeDropdown?.options.map(option => (
              <TouchableOpacity
                key={option}
                style={styles.optionItem}
                onPress={() => selectOption(option)}>
                <Text variant="body1" weight="semiBold">
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: vs(30),
  },
  headerWrapper: {
    paddingTop: vs(10),
  },
  section: {
    marginTop: vs(20),
    gap: vs(10),
    paddingHorizontal: hs(6),
  },
  sectionTitle: {
    fontSize: fs(16),
    textTransform: "uppercase",
    color: COLORS.text.primary,
  },
  description: {
    fontSize: fs(14),
    color: COLORS.text.primary,
  },
  formGroup: {
    marginTop: vs(10),
    gap: vs(4),
  },
  label: {
    color: COLORS.text.primary,
    textTransform: "capitalize",
  },
  row: {
    flexDirection: "row",
    gap: hs(15),
    marginTop: vs(15),
  },
  flex1: {
    flex: 1,
  },
  quantityCol: {
    width: hs(100),
  },
  dropdownInput: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.surface.primary,
    borderRadius: ms(10),
    paddingHorizontal: hs(10),
    paddingVertical: vs(12),
    height: vs(44),
  },
  inputText: {
    fontSize: fs(14),
    color: COLORS.text.primary,
  },
  primaryBtn: {
    backgroundColor: "#000000",
    borderRadius: ms(10),
    paddingVertical: vs(12),
    alignItems: "center",
    justifyContent: "center",
    marginTop: vs(20),
  },
  btnText: {
    fontSize: fs(20),
    color: COLORS.text.inverse,
  },
  inviteRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface.primary,
    borderRadius: ms(10),
    paddingHorizontal: hs(10),
    paddingVertical: vs(12),
    gap: hs(10),
    height: vs(70),
  },
  indexText: {
    fontSize: fs(14),
    color: COLORS.text.primary,
  },
  emailText: {
    flex: 1,
    fontSize: fs(14),
    color: COLORS.text.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  optionsContainer: {
    width: "80%",
    backgroundColor: COLORS.background,
    borderRadius: ms(12),
    padding: ms(10),
  },
  optionItem: {
    paddingVertical: vs(12),
    paddingHorizontal: hs(15),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface.primary,
  },
});
