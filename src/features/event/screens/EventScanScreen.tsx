// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
  Linking,
  Modal,
} from "react-native";
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { Text } from "@/components/ui";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
import { Button } from "@/components/ui/Button";
import { EventHeader } from "../components/EventHeader";
import {
  Calendar,
  ChevronRight,
  Phone,
  X,
  Camera as CameraIcon,
  Ticket,
  Clock,
  User,
} from "lucide-react-native";
import { useIsFocused, useNavigation, useRoute } from "@react-navigation/native";
import { Attendee, useAdminEventStore } from "../store/useAdminEventStore";

import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  // useObjectOutput is currently disabled for Android in this Nitro build due to native crash
  useObjectOutput,
} from "react-native-vision-camera";
import { Platform } from "react-native";

const USER_PROFILE = require("../../../assets/icons/ic-user-profile.png");

/**
 * Prominent Disclosure Modal for Camera Permission (Google Play Compliance)
 */
const CameraDisclosureModal = ({
  visible,
  onAccept,
  onClose,
}: {
  visible: boolean;
  onAccept: () => void;
  onClose: () => void;
}) => (
  <Modal visible={visible} transparent animationType="fade">
    <View style={styles.disclosureOverlay}>
      <View style={styles.disclosureContainer}>
        <View style={styles.disclosureIconContainer}>
          <CameraIcon size={ms(32)} color={COLORS.primary} />
        </View>
        <Text variant="h3" weight="bold" style={styles.disclosureTitle}>
          Camera Access
        </Text>
        <Text variant="body1" style={styles.disclosureDescription}>
          Bookr Partner requires access to your camera to scan ticket QR codes and verify attendee
          entries at your event.
        </Text>
        <Button title="Continue" onPress={onAccept} style={styles.disclosureButton} />
        <TouchableOpacity onPress={onClose} style={styles.disclosureCancel}>
          <Text variant="body2" color={COLORS.text.secondary}>
            Not Now
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

/**
 * iOS Specific Camera with Scanning
 */
const FullScreenCameraIOS = ({
  onClose,
  onCodeScanned,
  isActive,
}: {
  onClose: () => void;
  onCodeScanned: (value: string) => void;
  isActive: boolean;
}) => {
  const device = useCameraDevice("back");
  const isScanning = useRef(true);

  // useObjectOutput is safe here as this component only renders on iOS
  const objectOutput = useObjectOutput({
    // @ts-ignore
    types: ["qr"],
    onObjectsScanned: (objects: any[]) => {
      if (objects.length > 0 && objects[0].value && isScanning.current) {
        isScanning.current = false;
        onCodeScanned(objects[0].value);
        setTimeout(() => {
          isScanning.current = true;
        }, 2000);
      }
    },
  });

  if (!device) return <View style={styles.loadingContainer} />;

  return (
    <View style={styles.cameraRoot}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isActive}
        outputs={[objectOutput]}
        onError={error => {
          Alert.alert("Camera Error", error.message);
          onClose();
        }}
      />
      <View style={styles.cameraOverlay} pointerEvents="box-none">
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <X size={ms(24)} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.scanFrame} />
        <Text weight="semiBold" style={styles.cameraHint}>
          Align QR code within the frame
        </Text>
      </View>
    </View>
  );
};

/**
 * Android Specific Camera (Nitro version restricted)
 */
const FullScreenCameraAndroid = ({
  onClose,
  onCodeScanned,
  isActive,
}: {
  onClose: () => void;
  onCodeScanned: (value: string) => void;
  isActive: boolean;
}) => {
  const device = useCameraDevice("back");

  if (!device) return <View style={styles.loadingContainer} />;

  return (
    <View style={styles.cameraRoot}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isActive}
        onError={error => {
          Alert.alert("Camera Error", error.message);
          onClose();
        }}
      />
      <View style={styles.cameraOverlay} pointerEvents="box-none">
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <X size={ms(24)} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.scanFrame} />
        <Text weight="semiBold" style={styles.cameraHint}>
          Scanner restricted on Android Nitro version
        </Text>
        {__DEV__ && (
          <TouchableOpacity
            style={styles.simulateButton}
            onPress={() => onCodeScanned("TEST_ID_1")}>
            <Text color="#FFF" weight="bold">
              Simulate Scan
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

/**
 * Main Camera Entry Point
 */
const FullScreenCamera = (props: any) => {
  if (Platform.OS === "ios") {
    return <FullScreenCameraIOS {...props} />;
  }
  return <FullScreenCameraAndroid {...props} />;
};

interface ScanResultModalProps {
  modalMode: "confirmation" | "warning" | null;
  activeAttendee: Attendee | null;
  onClose: () => void;
  onConfirm: () => void;
}

const ScanResultModal = ({
  modalMode,
  activeAttendee,
  onClose,
  onConfirm,
}: ScanResultModalProps) => (
  <Modal visible={modalMode !== null} transparent animationType="slide" statusBarTranslucent={true}>
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text
            weight="bold"
            style={[styles.modalTitle, modalMode === "warning" && styles.warningTitle]}>
            {modalMode === "confirmation" ? "ENTRY CONFIRMATION" : "ALREADY SCANNED"}
          </Text>
        </View>

        <View style={styles.modalBody}>
          {/* Pass Type */}
          <View style={styles.modalRow}>
            <View style={styles.rowLabelContainer}>
              <Ticket size={ms(18)} color={COLORS.text.primary} />
              <Text weight="bold" style={styles.rowLabel}>
                Pass Type
              </Text>
            </View>
            <View style={styles.rowValueContainer}>
              <Text weight="bold" style={styles.passTypeText}>
                {activeAttendee?.ticketType}
              </Text>
            </View>
          </View>

          {/* Date and Time */}
          <View style={styles.dualRow}>
            <View style={styles.flex1}>
              <View style={styles.modalRow}>
                <View style={styles.rowLabelContainer}>
                  <Calendar size={ms(18)} color={COLORS.text.primary} />
                  <Text weight="medium" style={styles.rowLabel}>
                    Date
                  </Text>
                </View>
                <View style={styles.rowValueContainer}>
                  <Text weight="semiBold" style={styles.rowValueText}>
                    20/04/26
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.dualRowRight}>
              <View style={styles.modalRow}>
                <View style={styles.rowLabelContainer}>
                  <Clock size={ms(18)} color={COLORS.text.primary} />
                  <Text weight="medium" style={styles.rowLabel}>
                    Time / Slot Time
                  </Text>
                </View>
                <View style={styles.rowValueContainer}>
                  <Text weight="semiBold" style={styles.rowValueText}>
                    {activeAttendee?.time}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Name */}
          <View style={styles.modalRow}>
            <View style={styles.rowLabelContainer}>
              <User size={ms(18)} color={COLORS.text.primary} />
              <Text weight="medium" style={styles.rowLabel}>
                Name
              </Text>
            </View>
            <View style={styles.rowValueContainer}>
              <Text weight="semiBold" style={styles.rowValueText}>
                {activeAttendee?.name}
              </Text>
            </View>
          </View>

          {/* Mobile No */}
          <View style={styles.modalRow}>
            <View style={styles.rowLabelContainer}>
              <Phone size={ms(18)} color={COLORS.text.primary} />
              <Text weight="medium" style={styles.rowLabel}>
                Mobile No
              </Text>
            </View>
            <View style={styles.rowValueContainer}>
              <Text weight="semiBold" style={styles.rowValueText}>
                {activeAttendee?.phone}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.modalFooter}>
          {modalMode === "confirmation" ? (
            <>
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text weight="bold" style={styles.cancelButtonText}>
                  CANCEL
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={onConfirm}>
                <Text weight="bold" style={styles.confirmButtonText}>
                  CONFIRM ENTRY
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity style={styles.closeBtnLarge} onPress={onClose}>
              <Text weight="bold" style={styles.confirmButtonText}>
                CLOSE
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  </Modal>
);

export const EventScanScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const isFocused = useIsFocused();

  // Safely resolve serviceId from params or parent navigator
  let serviceId = route.params?.serviceId;
  if (!serviceId) {
    const parentState = navigation.getParent()?.getState();
    const tabRoute = parentState?.routes.find((r: any) => r.name === "EventServiceTabs");
    const tabParams = tabRoute?.params as any;
    serviceId = tabParams?.serviceId || tabParams?.params?.serviceId || "";
  }

  const { ticketCategories, attendees, fetchTicketCategories, fetchTodayAttendees } =
    useAdminEventStore();

  const [selectedTab, setSelectedTab] = useState("All");
  const [isScanningMode, setIsScanningMode] = useState(false);
  const [alreadyScannedCodes, setAlreadyScannedCodes] = useState<string[]>([]);
  const [modalMode, setModalMode] = useState<"confirmation" | "warning" | null>(null);
  const [activeAttendee, setActiveAttendee] = useState<Attendee | null>(null);
  const [showDisclosure, setShowDisclosure] = useState(false);

  const { hasPermission, requestPermission } = useCameraPermission();

  useEffect(() => {
    if (serviceId) {
      fetchTicketCategories(serviceId);
      fetchTodayAttendees(serviceId);
    }
  }, [serviceId, fetchTicketCategories, fetchTodayAttendees]);

  // Compute dynamic tabs based on current attendees and categories
  const TABS = [
    { label: "All", count: attendees.length },
    {
      label: "Guest",
      count: attendees.filter(a => a.categoryName.toLowerCase() === "guest").length,
    },
    ...ticketCategories.map(cat => ({
      label: cat,
      count: attendees.filter(a => a.categoryName === cat).length,
    })),
  ];

  const filteredScans =
    selectedTab === "All"
      ? attendees
      : attendees.filter(
          a =>
            a.categoryName === selectedTab ||
            (selectedTab === "Guest" && a.categoryName.toLowerCase() === "guest"),
        );

  const handleOpenScanner = useCallback(async () => {
    if (!hasPermission) {
      setShowDisclosure(true);
      return;
    }
    setIsScanningMode(true);
  }, [hasPermission]);

  const handleAcceptDisclosure = async () => {
    setShowDisclosure(false);
    const granted = await requestPermission();
    if (granted) {
      setIsScanningMode(true);
    } else {
      Alert.alert("Permission Required", "Allow camera access in settings to scan tickets.", [
        { text: "Open Settings", onPress: () => Linking.openSettings() },
        { text: "Cancel", style: "cancel" },
      ]);
    }
  };

  const handleCodeScanned = useCallback(
    (code: string) => {
      // Find attendee by ID
      let attendee = attendees.find(a => a.id === code);

      // Add mock handling for testing Simulation on Android
      if (!attendee && code === "TEST_ID_1") {
        attendee = {
          id: "TEST_ID_1",
          name: "Yash Jadhav",
          phone: "+91 78349 89934",
          time: "8 PM",
          ticketType: "Regular x 2",
          categoryName: "Regular",
        };
      }

      if (!attendee) {
        Alert.alert("Invalid Ticket", "This QR code does not match any booking.");
        return;
      }

      setActiveAttendee(attendee);

      if (alreadyScannedCodes.includes(code)) {
        setModalMode("warning");
      } else {
        setModalMode("confirmation");
      }
    },
    [attendees, alreadyScannedCodes],
  );

  const handleConfirmEntry = () => {
    if (activeAttendee) {
      setAlreadyScannedCodes(prev => [...prev, activeAttendee.id]);
      // Close modal first
      setModalMode(null);
      setActiveAttendee(null);
      // Then exit scanning mode
      setIsScanningMode(false);
    }
  };

  const handleCloseModal = () => {
    setModalMode(null);
    setActiveAttendee(null);
  };

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

  const renderScanItem = ({ item }: { item: any }) => (
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
              {item.ticketType}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  const mainContent = (
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
        data={filteredScans}
        renderItem={renderScanItem}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />
    </ScreenContainer>
  );

  return (
    <View style={styles.flex1}>
      {isScanningMode ? (
        <FullScreenCamera
          onClose={() => setIsScanningMode(false)}
          onCodeScanned={handleCodeScanned}
          isActive={isFocused}
        />
      ) : (
        mainContent
      )}

      {/* Shared Modal to prevent duplicate instances or stale state */}
      <ScanResultModal
        modalMode={modalMode}
        activeAttendee={activeAttendee}
        onClose={handleCloseModal}
        onConfirm={handleConfirmEntry}
      />

      <CameraDisclosureModal
        visible={showDisclosure}
        onAccept={handleAcceptDisclosure}
        onClose={() => setShowDisclosure(false)}
      />
    </View>
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
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#000",
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
    textAlign: "center",
  },
  simulateButton: {
    marginTop: vs(20),
    backgroundColor: COLORS.primary,
    paddingHorizontal: hs(20),
    paddingVertical: vs(12),
    borderRadius: ms(10),
  },
  flex1: {
    flex: 1,
  },
  blackBg: {
    backgroundColor: "#000",
  },
  dualRowRight: {
    flex: 1,
    marginLeft: hs(10),
  },
  warningTitle: {
    color: COLORS.danger,
  },
  closeBtnLarge: {
    flex: 1,
    height: vs(45),
    backgroundColor: "#000",
    borderRadius: ms(10),
    justifyContent: "center",
    alignItems: "center",
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: hs(20),
  },
  modalContent: {
    width: "100%",
    backgroundColor: COLORS.background,
    borderRadius: ms(20),
    paddingVertical: vs(20),
    paddingHorizontal: hs(12),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    marginBottom: vs(10),
    paddingHorizontal: hs(6),
  },
  modalTitle: {
    fontSize: fs(16),
    color: COLORS.text.primary,
    textTransform: "uppercase",
  },
  modalBody: {
    gap: vs(10),
    padding: ms(6),
  },
  modalRow: {
    gap: vs(4),
  },
  dualRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  rowLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(6),
  },
  rowLabel: {
    fontSize: fs(14),
    color: COLORS.text.primary,
  },
  rowValueContainer: {
    backgroundColor: COLORS.surface.primary,
    borderRadius: ms(10),
    paddingHorizontal: hs(10),
    paddingVertical: vs(12),
  },
  passTypeText: {
    fontSize: fs(14),
    color: COLORS.primary,
  },
  rowValueText: {
    fontSize: fs(14),
    color: COLORS.text.primary,
  },
  modalFooter: {
    flexDirection: "row",
    gap: hs(10),
    marginTop: vs(20),
  },
  cancelButton: {
    flex: 1,
    height: vs(45),
    borderWidth: 1,
    borderColor: COLORS.border.navBar,
    borderRadius: ms(10),
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: fs(20),
    color: COLORS.text.primary,
    fontFamily: "Bison-Bold",
  },
  confirmButton: {
    flex: 1,
    height: vs(45),
    backgroundColor: "#000",
    borderRadius: ms(10),
    justifyContent: "center",
    alignItems: "center",
  },
  confirmButtonText: {
    fontSize: fs(20),
    color: COLORS.text.inverse,
    fontFamily: "Bison-Bold",
  },
  disclosureOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: hs(20),
  },
  disclosureContainer: {
    backgroundColor: COLORS.background,
    borderRadius: ms(20),
    padding: ms(24),
    alignItems: "center",
    width: "100%",
  },
  disclosureIconContainer: {
    width: ms(64),
    height: ms(64),
    borderRadius: ms(32),
    backgroundColor: COLORS.surface.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: vs(16),
  },
  disclosureTitle: {
    marginBottom: vs(12),
    textAlign: "center",
  },
  disclosureDescription: {
    textAlign: "center",
    color: COLORS.text.secondary,
    marginBottom: vs(24),
    lineHeight: fs(22),
  },
  disclosureButton: {
    width: "100%",
    marginBottom: vs(12),
  },
  disclosureCancel: {
    padding: ms(8),
  },
});
