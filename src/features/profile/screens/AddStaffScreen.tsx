// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { Text, TextInput } from "@/components/ui";
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  Key,
  UserPlus,
  // MapPin,
  // Calendar,
  Circle,
  CheckCircle2,
} from "lucide-react-native";
import { vs, hs, ms } from "@/utils/responsive.utils";
import { useNavigation } from "@react-navigation/native";
import { COLORS } from "@/constants/theme";

// Phase 2: Icon Label Component
const IconLabel = ({ icon: Icon, label, color = COLORS.primary }: any) => (
  <View style={styles.iconLabelRoot}>
    <Icon size={ms(18)} color={color} />
    <Text variant="body2" weight="medium" color={COLORS.text.primary}>
      {label}
    </Text>
  </View>
);

// Phase 3: Radio Group Component
const SelectionGroup = ({ options, selected, onSelect }: any) => (
  <View style={styles.selectionContainer}>
    {options.map((option: string) => (
      <TouchableOpacity key={option} style={styles.selectionRow} onPress={() => onSelect(option)}>
        <Text variant="body2" weight="semiBold" color={COLORS.text.primary}>
          {option}
        </Text>
        {selected === option ? (
          <CheckCircle2 size={ms(20)} color={COLORS.text.primary} />
        ) : (
          <Circle size={ms(20)} color={COLORS.text.muted} />
        )}
      </TouchableOpacity>
    ))}
  </View>
);

export const AddStaffScreen = () => {
  const navigation = useNavigation();
  const [access, setAccess] = useState("Full Access");
  const [role, setRole] = useState("Manager");

  return (
    <ScreenContainer scrollable backgroundColor={COLORS.background} paddingHorizontal={hs(12)}>
      {/* App Bar */}
      <View style={styles.appBar}>
        <View style={styles.appBarLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <ArrowLeft size={ms(20)} color={COLORS.text.primary} />
          </TouchableOpacity>
          <Text variant="h3" weight="bold">
            Add Staff
          </Text>
        </View>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text variant="body1" weight="bold" color={COLORS.primary}>
            Save
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.formWrapper}>
        {/* Name Row */}
        <View style={styles.row}>
          <View style={styles.halfWidth}>
            <TextInput
              variant="filled"
              label={<IconLabel icon={User} label="First Name" />}
              placeholder="Yash"
            />
          </View>
          <View style={styles.halfWidth}>
            <TextInput
              variant="filled"
              label={<IconLabel icon={User} label="Last name" />}
              placeholder="Patil"
            />
          </View>
        </View>

        <TextInput
          variant="filled"
          label={<IconLabel icon={Phone} label="Mobile No" />}
          placeholder="+91 98345 34534"
          keyboardType="phone-pad"
        />

        <TextInput
          variant="filled"
          label={<IconLabel icon={Mail} label="Gmail" />}
          placeholder="patilyash03@gmail.com"
          keyboardType="email-address"
        />

        {/* Access Level Section */}
        <View style={styles.section}>
          <IconLabel icon={Key} label="Access Level" />
          <SelectionGroup
            options={["Full Access", "Booking Management"]}
            selected={access}
            onSelect={setAccess}
          />
        </View>

        {/* Role Section */}
        <View style={styles.section}>
          <IconLabel icon={UserPlus} label="Role" />
          <SelectionGroup options={["Manager", "Employee"]} selected={role} onSelect={setRole} />
        </View>

        {/* Comment-Out: This feature was discussed yet. */}
        {/* <TextInput
          variant="filled"
          label={<IconLabel icon={MapPin} label="Address" />}
          placeholder="LIC Colony, Near tapovan ground, kolhapur"
        />

        <TextInput
          variant="filled"
          label={<IconLabel icon={Calendar} label="Joining Date" />}
          placeholder="12 / 12 / 2026"
        /> */}
      </View>

      <View style={{ height: vs(40) }} />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  appBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: vs(37),
    marginTop: vs(6),
    marginBottom: vs(20),
  },
  appBarLeft: { flexDirection: "row", alignItems: "center", gap: hs(10) },
  formWrapper: { gap: vs(17) }, // Figma gap: 17px
  row: { flexDirection: "row", gap: hs(20) },
  halfWidth: { flex: 1 },
  iconLabelRoot: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(6),
    marginBottom: vs(4),
  },
  section: {
    width: "100%",
  },
  selectionContainer: {
    backgroundColor: COLORS.surface.primary,
    borderRadius: ms(10),
    paddingHorizontal: hs(10),
    paddingVertical: vs(6),
  },
  selectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: vs(32),
  },
});
