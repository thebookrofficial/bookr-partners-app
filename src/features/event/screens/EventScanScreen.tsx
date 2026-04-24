// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
  Linking,
  SafeAreaView,
} from "react-native";
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { Text } from "@/components/ui";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
import { EventHeader } from "../components/EventHeader";
import { Calendar, ChevronRight, Phone, X, Camera as CameraIcon } from "lucide-react-native";
import { useIsFocused, useNavigation } from "@react-navigation/native";

import {
  Camera,
  useCameraDevice,
  // useObjectOutput, // Temporarily disabled to prevent native crash
  useCameraPermission,
  // type ScannedCode,
} from "react-native-vision-camera";

const USER_PROFILE = require("../../../assets/icons/ic-user-profile.png");

// Mock Data
const MOCK_SCANS = [
  { id: "1", name: "Chirag Patil", phone: "+91 89346 93456", time: "8:32 Pm", type: "VIP x 3" },
  { id: "2", name: "Yash Jadhav", phone: "+91 34345 96856", time: "8:32 Pm", type: "Regular x 2" },
  { id: "3", name: "Yash Patil", phone: "+91 89346 93456", time: "8:31 Pm", type: "Regular x 2" },
  { id: "4", name: "Tejas Sutar", phone: "+91 89346 93456", time: "8:30 Pm", type: "Premium x 6" },
  { id: "5", name: "Tejas Sutar", phone: "+91 89346 93456", time: "8:30 Pm", type: "Premium x 6" },
  { id: "6", name: "Tejas Sutar", phone: "+91 89346 93456", time: "8:30 Pm", type: "Premium x 6" },
];

const TABS = [
  { label: "All", count: 80 },
  { label: "Regular", count: 65 },
  { label: "Premium", count: 10 },
  { label: "VIP", count: 4 },
  { label: "Guest", count: 1 },
];

/**
 * Full Screen Camera Component
 * Simplified to ONLY show the camera feed to debug the white screen
 */
const FullScreenCamera = ({ onClose }: { onClose: () => void }) => {
  const isFocused = useIsFocused();
  const device = useCameraDevice("back");

  if (!device) {
    return (
      <View style={styles.loadingContainer}>
        <Text color="#FFF">Hardware: Loading Camera Device...</Text>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <X size={ms(24)} color="#FFF" />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.cameraRoot}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isFocused}
        onError={error => {
          Alert.alert("Camera Error", error.message);
        }}
      />
      <SafeAreaView style={styles.cameraOverlay}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <X size={ms(24)} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.scanFrame} />
        <Text weight="semiBold" style={styles.cameraHint}>
          Camera Feed Active (Scanner Disabled for Debug)
        </Text>
      </SafeAreaView>
    </View>
  );
};

export const EventScanScreen = () => {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const [selectedTab, setSelectedTab] = useState("All");
  const [isScanningMode, setIsScanningMode] = useState(false);

  const { hasPermission, requestPermission } = useCameraPermission();

  const handleOpenScanner = useCallback(async () => {
    if (!hasPermission) {
      const granted = await requestPermission();
      if (!granted) {
        Alert.alert("Permission Required", "Allow camera access in settings to scan tickets.", [
          { text: "Open Settings", onPress: () => Linking.openSettings() },
          { text: "Cancel", style: "cancel" },
        ]);
        return;
      }
    }
    setIsScanningMode(true);
  }, [hasPermission, requestPermission]);

  // Handle Tab Press: 2nd click opens camera
  useEffect(() => {
    const unsubscribe = navigation.addListener("tabPress", (e: any) => {
      if (isFocused) {
        e.preventDefault();
        handleOpenScanner();
      }
    });
    return unsubscribe;
  }, [navigation, isFocused, handleOpenScanner]);

  const renderTab = ({ item }: { item: (typeof TABS)[0] }) => {
    const isActive = selectedTab === item.label;
    return (
      <TouchableOpacity
        onPress={() => setSelectedTab(item.label)}
        style={[styles.tab, isActive ? styles.tabActive : styles.tabInactive]}>
        <Text
          weight="semiBold"
          style={[styles.tabText, { color: isActive ? COLORS.text.inverse : COLORS.text.muted }]}>
          {item.label}
        </Text>
        <Text
          weight="semiBold"
          style={[styles.tabText, { color: isActive ? COLORS.text.inverse : COLORS.text.muted }]}>
          ({item.count})
        </Text>
      </TouchableOpacity>
    );
  };

  const renderScanItem = ({ item }: { item: (typeof MOCK_SCANS)[0] }) => (
    <View style={styles.scanItem}>
      <View style={styles.avatarContainer}>
        <Image source={USER_PROFILE} style={styles.avatar} />
      </View>
      <View style={styles.scanInfo}>
        <View style={styles.scanHeader}>
          <View style={styles.nameContainer}>
            <Text weight="bold" style={styles.scanName}>
              {item.name}
            </Text>
            <View style={styles.phoneContainer}>
              <Phone size={ms(16)} color={COLORS.text.primary} />
              <Text style={styles.scanPhone}>{item.phone}</Text>
            </View>
          </View>
          <View style={styles.typeContainer}>
            <Text weight="semiBold" style={styles.scanTime}>
              {item.time}
            </Text>
            <Text weight="semiBold" style={styles.scanType}>
              {item.type}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  if (isScanningMode) {
    return <FullScreenCamera onClose={() => setIsScanningMode(false)} />;
  }

  return (
    <ScreenContainer backgroundColor={COLORS.background} paddingHorizontal={hs(12)}>
      <EventHeader title="Neon Shadow World Tour 2026" subtitle="Scan" imageSource={USER_PROFILE} />

      <View style={styles.dateRow}>
        <View style={styles.dateLeft}>
          <Calendar size={ms(20)} color={COLORS.text.primary} />
          <Text weight="bold" style={styles.dateText}>
            20 Apr 2026
          </Text>
        </View>
        <View style={styles.dateRight}>
          <Text weight="semiBold" style={styles.dayText}>
            Day 1
          </Text>
          <ChevronRight size={ms(14)} color={COLORS.text.primary} />
        </View>
      </View>

      <View style={styles.historyHeader}>
        <Text weight="bold" style={styles.historyTitle}>
          HISTORY
        </Text>
        {/* Debug Button in case Tab Click is finicky */}
        <TouchableOpacity onPress={handleOpenScanner} style={styles.debugBtn}>
          <CameraIcon size={16} color={COLORS.primary} />
          <Text color={COLORS.primary} variant="caption">
            Open Camera
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabsWrapper}>
        <FlatList
          data={TABS}
          renderItem={renderTab}
          keyExtractor={item => item.label}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContainer}
        />
      </View>

      <FlatList
        data={MOCK_SCANS}
        renderItem={renderScanItem}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: vs(40),
    marginBottom: vs(10),
  },
  dateLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(4),
  },
  dateText: {
    fontSize: fs(14),
    color: COLORS.text.primary,
  },
  dateRight: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: vs(4),
  },
  dayText: {
    fontSize: fs(12),
    color: COLORS.text.primary,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: vs(10),
  },
  historyTitle: {
    fontSize: fs(16),
    color: COLORS.text.primary,
  },
  debugBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(4),
    padding: hs(4),
  },
  tabsWrapper: {
    marginBottom: vs(10),
  },
  tabsContainer: {
    gap: hs(10),
  },
  tab: {
    minWidth: hs(75),
    height: vs(40),
    borderRadius: ms(10),
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: hs(4),
  },
  tabActive: {
    backgroundColor: "#282828",
  },
  tabInactive: {
    backgroundColor: COLORS.surface.primary,
  },
  tabText: {
    fontSize: fs(12),
    textAlign: "center",
    lineHeight: fs(12),
  },
  listContainer: {
    paddingBottom: vs(100),
  },
  scanItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFEFEF",
    borderRadius: ms(10),
    padding: ms(10),
    marginBottom: vs(10),
  },
  avatarContainer: {
    width: ms(50),
    height: ms(50),
    borderRadius: ms(25),
    overflow: "hidden",
    backgroundColor: COLORS.danger,
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  scanInfo: {
    flex: 1,
    marginLeft: hs(10),
  },
  scanHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  nameContainer: {
    flex: 1,
    gap: vs(6),
  },
  scanName: {
    fontSize: fs(16),
    color: COLORS.text.primary,
  },
  phoneContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(6),
  },
  scanPhone: {
    fontSize: fs(14),
    color: COLORS.text.primary,
  },
  typeContainer: {
    alignItems: "flex-end",
    gap: vs(10),
  },
  scanTime: {
    fontSize: fs(14),
    color: COLORS.text.primary,
  },
  scanType: {
    fontSize: fs(14),
    color: COLORS.primary,
  },
  cameraRoot: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#111",
    justifyContent: "center",
    alignItems: "center",
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButton: {
    position: "absolute",
    top: vs(50),
    right: hs(20),
    padding: ms(10),
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: ms(25),
    zIndex: 10,
  },
  scanFrame: {
    width: hs(250),
    height: hs(250),
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: ms(20),
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  cameraHint: {
    color: "#FFF",
    marginTop: vs(30),
    fontSize: fs(16),
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: hs(16),
    paddingVertical: vs(8),
    borderRadius: ms(8),
    overflow: "hidden",
  },
});
