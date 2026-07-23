// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Modal } from "react-native";
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { Text, TextInput } from "@/components/ui";
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  Key,
  MapPin,
  Calendar,
  Square,
  CheckSquare,
} from "lucide-react-native";
import { vs, hs, ms } from "@/utils/responsive.utils";
import { useNavigation, useRoute } from "@react-navigation/native";
import { COLORS } from "@/constants/theme";
import { StaffService } from "../services/staff.service";
import { useVendorData } from "../hooks/useVendorData";
import { Calendar as RNCalendar } from "react-native-calendars";

// Phase 2: Icon Label Component
const IconLabel = ({ icon: Icon, label, color = COLORS.primary }: any) => (
  <View style={styles.iconLabelRoot}>
    <Icon size={ms(18)} color={color} />
    <Text variant="body2" weight="medium" color={COLORS.text.primary}>
      {label}
    </Text>
  </View>
);

// Phase 3: Multi-Select Group Component
const MultiSelectionGroup = ({ options, selected, onToggle }: any) => (
  <View style={styles.selectionContainer}>
    {options.map((option: any) => {
      const isObject = typeof option === "object";
      const value = isObject ? option.value : option;
      const label = isObject ? option.label : option;
      const isSelected = selected.includes(value);
      return (
        <TouchableOpacity key={value} style={styles.selectionRow} onPress={() => onToggle(value)}>
          <Text variant="body2" weight="semiBold" color={COLORS.text.primary} style={styles.flex1}>
            {label}
          </Text>
          {isSelected ? (
            <CheckSquare size={ms(20)} color={COLORS.text.primary} />
          ) : (
            <Square size={ms(20)} color={COLORS.text.muted} />
          )}
        </TouchableOpacity>
      );
    })}
  </View>
);

export const AddStaffScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const serviceCategory = route.params?.serviceCategory;
  const venueId = route.params?.venueId;

  const { venues } = useVendorData();
  const filteredVenues = serviceCategory
    ? venues.filter(v => v.vertical === serviceCategory)
    : venues;

  const [sportsPerms, setSportsPerms] = useState<string[]>([]);
  const [staycationPerms, setStaycationPerms] = useState<string[]>([]);
  const [assignedVenues, setAssignedVenues] = useState<string[]>(venueId ? [venueId] : []);

  // Form State
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [joiningDate, setJoiningDate] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggleSportsPerm = (perm: string) => {
    setSportsPerms(prev => (prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]));
  };

  const toggleStaycationPerm = (perm: string) => {
    setStaycationPerms(prev =>
      prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm],
    );
  };

  const toggleAssignedVenue = (id: string) => {
    setAssignedVenues(prev => (prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]));
  };

  const handleInvite = async () => {
    if (assignedVenues.length === 0) {
      Alert.alert("Error", "Please assign at least one service/venue to the staff.");
      return;
    }
    if (!email) {
      Alert.alert("Error", "Email is required to invite staff.");
      return;
    }

    const allPerms = [
      ...sportsPerms.map(p => `sports:${p}`),
      ...staycationPerms.map(p => `staycation:${p}`),
    ];

    try {
      setLoading(true);
      await StaffService.inviteStaff({
        assignedVenueIds: assignedVenues,
        email: email.trim(),
        name: `${firstName.trim()} ${lastName.trim()}`.trim(),
        phone: phone.trim(),
        address: address.trim(),
        joiningDate: joiningDate.trim(),
        permissions: allPerms,
      });
      Alert.alert("Success", "Staff invited successfully!", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to invite staff");
    } finally {
      setLoading(false);
    }
  };

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
      </View>

      <View style={styles.formWrapper}>
        {/* Name Row */}
        <View style={styles.row}>
          <View style={styles.halfWidth}>
            <TextInput
              variant="filled"
              label={<IconLabel icon={User} label="First Name" />}
              placeholder="Yash"
              value={firstName}
              onChangeText={setFirstName}
            />
          </View>
          <View style={styles.halfWidth}>
            <TextInput
              variant="filled"
              label={<IconLabel icon={User} label="Last name" />}
              placeholder="Patil"
              value={lastName}
              onChangeText={setLastName}
            />
          </View>
        </View>

        <TextInput
          variant="filled"
          label={<IconLabel icon={Phone} label="Mobile No" />}
          placeholder="+91 98345 34534"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />

        <TextInput
          variant="filled"
          label={<IconLabel icon={Mail} label="Gmail" />}
          placeholder="patilyash03@gmail.com"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          variant="filled"
          label={<IconLabel icon={MapPin} label="Address" />}
          placeholder="LIC Colony, Near tapovan ground, kolhapur"
          value={address}
          onChangeText={setAddress}
        />

        <TouchableOpacity onPress={() => setShowDatePicker(true)} activeOpacity={0.7}>
          <View pointerEvents="none">
            <TextInput
              variant="filled"
              label={<IconLabel icon={Calendar} label="Joining Date" />}
              placeholder="e.g. 12 / 12 / 2026"
              value={joiningDate}
              editable={false}
            />
          </View>
        </TouchableOpacity>

        <Modal
          visible={showDatePicker}
          transparent={true}
          animationType="fade"
          statusBarTranslucent={true}>
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowDatePicker(false)}>
            <View style={styles.calendarContainer}>
              <RNCalendar
                current={joiningDate || new Date().toISOString().split("T")[0]}
                onDayPress={(day: any) => {
                  setJoiningDate(day.dateString);
                  setShowDatePicker(false);
                }}
                markedDates={{
                  [joiningDate || ""]: {
                    selected: true,
                    selectedColor: COLORS.primary,
                  },
                }}
              />
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Assigned Venues / Services Section */}
        <View style={styles.section}>
          <IconLabel icon={MapPin} label="Assign to Services (Venues)" />
          {filteredVenues.length === 0 ? (
            <Text variant="caption" color={COLORS.text.muted} style={{ marginBottom: vs(10) }}>
              No services/venues found for this category.
            </Text>
          ) : (
            <MultiSelectionGroup
              options={filteredVenues.map(v => ({ value: v.id, label: v.name }))}
              selected={assignedVenues}
              onToggle={toggleAssignedVenue}
            />
          )}
        </View>

        {/* Sports Permissions Section */}
        {(!serviceCategory || serviceCategory === "sports") && (
          <View style={styles.section}>
            <IconLabel icon={Key} label="Sports Permissions" />
            <MultiSelectionGroup
              options={["View Sports Home", "Manage Bulk Bookings", "View Sports History"]}
              selected={sportsPerms}
              onToggle={toggleSportsPerm}
            />
          </View>
        )}

        {/* Staycation Permissions Section */}
        {(!serviceCategory || serviceCategory === "staycation") && (
          <View style={styles.section}>
            <IconLabel icon={Key} label="Staycation Permissions" />
            <MultiSelectionGroup
              options={["View Staycation Home", "View Staycation History"]}
              selected={staycationPerms}
              onToggle={toggleStaycationPerm}
            />
          </View>
        )}
      </View>

      <TouchableOpacity
        style={styles.saveButton}
        onPress={handleInvite}
        disabled={loading}
        activeOpacity={0.8}>
        {loading ? (
          <ActivityIndicator color={COLORS.text.inverse} />
        ) : (
          <Text variant="h3" weight="bold" color={COLORS.text.inverse}>
            Added Staff
          </Text>
        )}
      </TouchableOpacity>

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
  flex1: { flex: 1 },
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
    height: vs(32),
  },
  saveButton: {
    backgroundColor: COLORS.text.primary,
    paddingVertical: vs(12),
    borderRadius: ms(10),
    alignItems: "center",
    justifyContent: "center",
    marginTop: vs(20),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  calendarContainer: {
    width: "90%",
    backgroundColor: COLORS.background,
    borderRadius: ms(12),
    padding: ms(16),
    overflow: "hidden",
  },
});
