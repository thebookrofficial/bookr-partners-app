// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { Text, TextInput } from "@/components/ui";
import { EventHeader } from "../components/EventHeader";
import { ChevronDown, X } from "lucide-react-native";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useEventSpotEntry } from "../hooks/useEventSpotEntry";

const USER_PROFILE = require("../../../assets/icons/ic-user-profile.png");

export const EventSpotEntryScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  let serviceId = route.params?.serviceId;
  if (!serviceId) {
    const parentState = navigation.getParent()?.getState();
    const tabRoute = parentState?.routes.find((r: any) => r.name === "EventServiceTabs");
    const tabParams = tabRoute?.params as any;
    serviceId = tabParams?.serviceId || tabParams?.params?.serviceId || "";
  }

  const {
    loading,
    isSubmitting,
    eventTitle,
    eventImage,
    passCategories,
    createSpotEntry,
    refresh,
  } = useEventSpotEntry(serviceId);

  // Form State
  const [guestName, setGuestName] = useState("");
  const [mobileNo, setMobileNo] = useState("");
  const [passType, setPassType] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [ticketAmount, setTicketAmount] = useState("");
  const [paidAmount, setPaidAmount] = useState("");

  useEffect(() => {
    if (passCategories.length > 0 && !passType) {
      const firstPass = passCategories[0];
      setPassType(firstPass.name);
      const q = parseInt(quantity, 10) || 1;
      setTicketAmount(String((firstPass.price || 0) * q));
    }
  }, [passCategories, passType, quantity]);

  // Dropdown Selection State
  const [activeDropdown, setActiveDropdown] = useState<{
    type: "passType" | "quantity";
    options: string[];
  } | null>(null);

  const selectOption = (option: string) => {
    if (!activeDropdown) return;

    let newPassType = passType;
    let newQuantity = quantity;

    if (activeDropdown.type === "passType") {
      newPassType = option;
      setPassType(option);
    } else {
      newQuantity = option;
      setQuantity(option);
    }

    // Recalculate ticket amount based on new selections
    const category = passCategories.find(p => p.name === newPassType);
    if (category) {
      const q = parseInt(newQuantity, 10) || 1;
      setTicketAmount(String((category.price || 0) * q));
    }

    setActiveDropdown(null);
  };

  const handleCreateEntry = async () => {
    if (!guestName.trim()) {
      Alert.alert("Error", "Please enter guest name.");
      return;
    }
    if (!mobileNo.trim() || mobileNo.length < 10) {
      Alert.alert("Error", "Please enter a valid mobile number.");
      return;
    }
    if (!ticketAmount.trim() || isNaN(parseFloat(ticketAmount))) {
      Alert.alert("Error", "Please enter a valid ticket amount.");
      return;
    }
    if (!paidAmount.trim() || isNaN(parseFloat(paidAmount))) {
      Alert.alert("Error", "Please enter a valid paid amount.");
      return;
    }

    const success = await createSpotEntry({
      guestName: guestName.trim(),
      mobileNo: mobileNo.trim(),
      passType,
      quantity,
      ticketAmount: ticketAmount.trim(),
      paidAmount: paidAmount.trim(),
    });

    if (success) {
      setGuestName("");
      setMobileNo("");
      setPassType(passCategories[0]?.name || "");
      setQuantity("1");
      setTicketAmount("");
      setPaidAmount("");
      Alert.alert("Success", "Spot entry created successfully!");
    }
  };

  return (
    <ScreenContainer backgroundColor={COLORS.background} paddingHorizontal={hs(12)}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }>
        <View style={styles.headerWrapper}>
          <EventHeader
            title={eventTitle || "Event Name"}
            subtitle="Spot Entry"
            imageSource={eventImage ? { uri: eventImage } : USER_PROFILE}
          />
        </View>

        {/* SPOT ENTRY FORM */}
        <View style={styles.section}>
          <Text weight="bold" style={styles.sectionTitle}>
            CREATE SPOT ENTRY
          </Text>

          <View style={styles.formGroup}>
            <Text variant="body2" weight="medium" style={styles.label}>
              Guest Name
            </Text>
            <TextInput
              variant="filled"
              value={guestName}
              onChangeText={setGuestName}
              placeholder="Ex: Yash Patil"
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
              placeholder="Ex: 9876543210"
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
                    options: passCategories.length > 0 ? passCategories.map(p => p.name) : [],
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
                    options: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
                  })
                }>
                <Text weight="semiBold" style={styles.inputText}>
                  {quantity}
                </Text>
                <ChevronDown size={ms(18)} color={COLORS.text.primary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.flex1}>
              <Text variant="body2" weight="medium" style={styles.label}>
                Ticket Amount (Total)
              </Text>
              <TextInput
                variant="filled"
                value={ticketAmount}
                onChangeText={setTicketAmount}
                placeholder="Ex: 500"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.flex1}>
              <Text variant="body2" weight="medium" style={styles.label}>
                Paid Amount
              </Text>
              <TextInput
                variant="filled"
                value={paidAmount}
                onChangeText={setPaidAmount}
                placeholder="Ex: 1000"
                keyboardType="numeric"
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, isSubmitting && styles.disabledBtn]}
            onPress={handleCreateEntry}
            disabled={isSubmitting}>
            {isSubmitting ? (
              <ActivityIndicator color={COLORS.text.inverse} />
            ) : (
              <Text family="bison" weight="bold" style={styles.btnText}>
                CREATE SPOT ENTRY
              </Text>
            )}
          </TouchableOpacity>
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
          <View style={styles.dropdownMenu}>
            <View style={styles.dropdownHeader2}>
              <Text weight="bold" style={styles.dropdownTitle}>
                Select {activeDropdown?.type === "passType" ? "Pass Type" : "Quantity"}
              </Text>
              <TouchableOpacity onPress={() => setActiveDropdown(null)}>
                <X size={ms(20)} color="#000" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.dropdownScroll} showsVerticalScrollIndicator={false}>
              {activeDropdown?.options.map(option => {
                const isSelected =
                  (activeDropdown.type === "passType" ? passType : quantity) === option;
                return (
                  <TouchableOpacity
                    key={option}
                    style={[styles.dropdownItem, isSelected && styles.dropdownItemSelected]}
                    onPress={() => selectOption(option)}>
                    <Text weight="medium" style={styles.dropdownItemText}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: vs(20),
  },
  headerWrapper: {
    marginTop: vs(10),
    marginBottom: vs(20),
  },
  section: {
    marginBottom: vs(30),
  },
  sectionTitle: {
    fontSize: fs(18),
    color: COLORS.text.primary,
    marginBottom: vs(12),
    textTransform: "uppercase",
  },
  formGroup: {
    marginBottom: vs(16),
  },
  row: {
    flexDirection: "row",
    gap: hs(12),
    marginBottom: vs(16),
  },
  flex1: {
    flex: 1,
  },
  quantityCol: {
    width: hs(100),
  },
  label: {
    color: COLORS.text.secondary,
    marginBottom: vs(8),
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
  disabledBtn: {
    opacity: 0.6,
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
    marginBottom: vs(8),
  },
  indexText: {
    fontSize: fs(16),
    color: COLORS.text.primary,
  },
  inviteInfo: {
    flex: 1,
  },
  guestNameText: {
    fontSize: fs(16),
    color: COLORS.text.primary,
  },
  emailText: {
    fontSize: fs(14),
    color: COLORS.text.muted,
  },
  passInfo: {
    alignItems: "flex-end",
    marginRight: hs(10),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  dropdownMenu: {
    backgroundColor: "#FFFFFF",
    borderRadius: ms(12),
    paddingBottom: ms(8),
    width: ms(250),
    maxHeight: vs(350),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  dropdownHeader2: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: vs(12),
    paddingHorizontal: ms(16),
    borderBottomWidth: 1,
    borderBottomColor: "#EAEAEA",
    marginBottom: vs(8),
  },
  dropdownTitle: { fontSize: fs(16), color: "#000" },
  dropdownScroll: { maxHeight: vs(250) },
  dropdownItem: {
    paddingVertical: vs(10),
    paddingHorizontal: ms(12),
    marginHorizontal: ms(8),
    borderRadius: ms(8),
    minHeight: vs(35),
    justifyContent: "center",
    marginBottom: vs(2),
  },
  dropdownItemSelected: {
    backgroundColor: "#E6E6E6",
  },
  dropdownItemText: { fontSize: fs(14), color: "#000" },
});
