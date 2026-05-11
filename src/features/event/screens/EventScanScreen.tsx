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
  Modal,
  ActivityIndicator,
} from "react-native";
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { Text } from "@/components/ui";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
import { Button } from "@/components/ui/Button";
import { EventHeader } from "../components/EventHeader";
import { Phone, X, Camera as CameraIcon, Ticket, User } from "lucide-react-native";
import { useIsFocused, useNavigation, useRoute } from "@react-navigation/native";
import { supabase } from "@/lib/supabase";

import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useObjectOutput,
} from "react-native-vision-camera";
import { Platform } from "react-native";

const USER_PROFILE = require("../../../assets/icons/ic-user-profile.png");

// --- Types ---
export type PassType = "All" | "Regular" | "Premium" | "VIP" | "Guest";

export interface Attendee {
  id: string;
  name: string;
  phone: string;
  time: string;
  ticketType: string;
  categoryName: string;
  isAlreadyScanned?: boolean;
  isInvite?: boolean;
  avatarUrl?: string;
}

// --- Disclosure Modal ---
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

// --- Camera Components ---
const FullScreenCameraIOS = ({ onClose, onCodeScanned, isActive }: any) => {
  const device = useCameraDevice("back");
  const isScanning = useRef(true);

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

const FullScreenCameraAndroid = ({ onClose, onCodeScanned, isActive }: any) => {
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
            onPress={() => onCodeScanned("TEST_QR_TOKEN_123")}>
            <Text color="#FFF" weight="bold">
              Simulate Scan
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const FullScreenCamera = (props: any) => {
  if (Platform.OS === "ios") {
    return <FullScreenCameraIOS {...props} />;
  }
  return <FullScreenCameraAndroid {...props} />;
};

// --- Modal Component ---
const ScanResultModal = ({ modalMode, activeAttendee, onClose, onConfirm, isProcessing }: any) => (
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
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onClose}
                disabled={isProcessing}>
                <Text weight="bold" style={styles.cancelButtonText}>
                  CANCEL
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={onConfirm}
                disabled={isProcessing}>
                {isProcessing ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text weight="bold" style={styles.confirmButtonText}>
                    CONFIRM ENTRY
                  </Text>
                )}
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

// --- Main Screen ---
export const EventScanScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const isFocused = useIsFocused();

  let serviceId = route.params?.serviceId;
  if (!serviceId) {
    const parentState = navigation.getParent()?.getState();
    const tabRoute = parentState?.routes.find((r: any) => r.name === "EventServiceTabs");
    const tabParams = tabRoute?.params as any;
    serviceId = tabParams?.serviceId || tabParams?.params?.serviceId || "";
  }

  const [selectedTab, setSelectedTab] = useState("All");
  const [isScanningMode, setIsScanningMode] = useState(false);

  // Real DB Data states
  const [scannedAttendees, setScannedAttendees] = useState<Attendee[]>([]);
  const [ticketCategories, setTicketCategories] = useState<string[]>([]);
  const [isFetchingHistory, setIsFetchingHistory] = useState(true);
  const [isProcessingEntry, setIsProcessingEntry] = useState(false);

  const [modalMode, setModalMode] = useState<"confirmation" | "warning" | null>(null);
  const [activeAttendee, setActiveAttendee] = useState<Attendee | null>(null);
  const [showDisclosure, setShowDisclosure] = useState(false);

  const { hasPermission, requestPermission } = useCameraPermission();

  // 1. Fetch History from DB (Attendees who already entered)
  const fetchScannedHistory = useCallback(async () => {
    if (!serviceId) return;
    try {
      setIsFetchingHistory(true);
      const { data, error } = await supabase
        .from("event_bookings")
        .select(
          `
          id, ticket_count, booking_status, guest_name, guest_phone, updated_at,
          profiles (full_name, phone, avatar_url),
          event_passes (name),
          event_zones (zone_name)
        `,
        )
        .eq("event_id", serviceId)
        .eq("booking_status", "completed") // Completed means they have checked in
        .order("updated_at", { ascending: false });

      if (error) throw error;

      const cats = new Set<string>();
      const formattedData: Attendee[] = (data || []).map((b: any) => {
        const profile = Array.isArray(b.profiles) ? b.profiles[0] : b.profiles;
        const pass = Array.isArray(b.event_passes) ? b.event_passes[0] : b.event_passes;
        const zone = Array.isArray(b.event_zones) ? b.event_zones[0] : b.event_zones;

        const catName = pass?.name || zone?.zone_name || "General";
        cats.add(catName);

        const timeStr = new Date(b.updated_at).toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });

        return {
          id: b.id,
          name: b.guest_name || profile?.full_name || "Guest",
          phone: b.guest_phone || profile?.phone || "N/A",
          time: timeStr.toUpperCase(),
          ticketType: `${catName} x ${b.ticket_count}`,
          categoryName: catName,
          avatarUrl: profile?.avatar_url,
        };
      });

      setTicketCategories(Array.from(cats));
      setScannedAttendees(formattedData);
    } catch (err) {
      console.error("Error fetching scanned history:", err);
    } finally {
      setIsFetchingHistory(false);
    }
  }, [serviceId]);

  useEffect(() => {
    fetchScannedHistory();
  }, [fetchScannedHistory]);

  const TABS = [
    { label: "All", count: scannedAttendees.length },
    {
      label: "Guest",
      count: scannedAttendees.filter(a => a.categoryName.toLowerCase() === "guest").length,
    },
    ...ticketCategories.map(cat => ({
      label: cat,
      count: scannedAttendees.filter(a => a.categoryName === cat).length,
    })),
  ];

  const filteredScans =
    selectedTab === "All"
      ? scannedAttendees
      : scannedAttendees.filter(
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
      Alert.alert("Permission Required", "Allow camera access in settings to scan tickets.");
    }
  };

  // 2. Validate Scanned Token against Supabase DB
  // 2. Validate Scanned Token against Supabase DB
  const handleCodeScanned = useCallback(
    async (code: string) => {
      try {
        // Search in regular event bookings first
        const { data: booking } = await supabase
          .from("event_bookings")
          .select(
            `
        id, ticket_count, booking_status, guest_name, guest_phone,
        profiles (full_name, phone, avatar_url),
        event_passes (name),
        event_zones (zone_name)
      `,
          )
          .eq("qr_code_token", code)
          .eq("event_id", serviceId)
          .maybeSingle();

        if (booking) {
          const profile = Array.isArray(booking.profiles) ? booking.profiles[0] : booking.profiles;
          const pass = Array.isArray(booking.event_passes)
            ? booking.event_passes[0]
            : booking.event_passes;
          const zone = Array.isArray(booking.event_zones)
            ? booking.event_zones[0]
            : booking.event_zones;
          const catName = pass?.name || zone?.zone_name || "General";

          const attendee: Attendee = {
            id: booking.id,
            name: booking.guest_name || profile?.full_name || "Guest",
            phone: booking.guest_phone || profile?.phone || "N/A",
            time: "Now",
            ticketType: `${catName} x ${booking.ticket_count}`,
            categoryName: catName,
            isAlreadyScanned: booking.booking_status === "completed", // Use booking_status enum
            isInvite: false,
          };

          setActiveAttendee(attendee);
          setModalMode(attendee.isAlreadyScanned ? "warning" : "confirmation");
          return;
        }

        // Check event guest invites if not found in regular bookings
        const { data: invite } = await supabase
          .from("event_guest_invites")
          .select("*")
          .eq("qr_code_token", code)
          .eq("event_id", serviceId)
          .maybeSingle();

        if (invite) {
          const attendee: Attendee = {
            id: invite.id,
            name: invite.guest_name,
            phone: invite.guest_phone,
            time: "Now",
            ticketType: `Guest Pass x ${invite.quantity}`,
            categoryName: "Guest",
            isAlreadyScanned: invite.status === "completed",
            isInvite: true,
          };

          setActiveAttendee(attendee);
          setModalMode(attendee.isAlreadyScanned ? "warning" : "confirmation");
          return;
        }

        Alert.alert("Invalid Ticket", "This QR code does not match any booking for this event.");
      } catch (err) {
        console.error("Scan lookup error:", err);
        Alert.alert("Lookup Failed", "Failed to retrieve ticket information.");
      }
    },
    [serviceId],
  );

  // 3. Confirm Entry (Update DB)
  const handleConfirmEntry = async () => {
    if (!activeAttendee) return;
    setIsProcessingEntry(true);

    try {
      if (activeAttendee.isInvite) {
        await supabase
          .from("event_guest_invites")
          .update({ status: "completed" })
          .eq("id", activeAttendee.id);
      } else {
        // Mark regular booking as 'completed' upon check-in
        await supabase
          .from("event_bookings")
          .update({ booking_status: "completed" })
          .eq("id", activeAttendee.id);
      }

      // Refresh history, close modal, exit scanner
      fetchScannedHistory();
      setModalMode(null);
      setActiveAttendee(null);
      setIsScanningMode(false);
    } catch (err) {
      console.error("Check-in error:", err);
      Alert.alert("Error", "Failed to check in attendee.");
    } finally {
      setIsProcessingEntry(false);
    }
  };

  const handleCloseModal = () => {
    setModalMode(null);
    setActiveAttendee(null);
  };

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
          {item.label} ({item.count})
        </Text>
      </TouchableOpacity>
    );
  };

  const renderScanItem = ({ item }: { item: Attendee }) => (
    <TouchableOpacity
      style={styles.scanItem}
      onPress={() => navigation.navigate("EventEntryDetails", { entryId: item.id })}>
      <View style={styles.avatarContainer}>
        <Image
          source={item.avatarUrl ? { uri: item.avatarUrl } : USER_PROFILE}
          style={styles.avatar}
        />
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
    </TouchableOpacity>
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
        <ScreenContainer backgroundColor={COLORS.background} paddingHorizontal={hs(12)}>
          <EventHeader title="Event Scans" subtitle="Scan & Verify" imageSource={USER_PROFILE} />

          <View style={styles.historyHeader}>
            <Text weight="bold" style={styles.historyTitle}>
              SCANNED TICKETS
            </Text>
            <TouchableOpacity onPress={handleOpenScanner} style={styles.debugBtn}>
              <CameraIcon size={16} color={COLORS.primary} />
              <Text color={COLORS.primary} variant="caption">
                Open Scanner
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

          {isFetchingHistory ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: vs(20) }} />
          ) : (
            <FlatList
              data={filteredScans}
              renderItem={renderScanItem}
              keyExtractor={item => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContainer}
              ListEmptyComponent={<Text style={styles.emptyListText}>No tickets scanned yet.</Text>}
            />
          )}
        </ScreenContainer>
      )}

      <ScanResultModal
        modalMode={modalMode}
        activeAttendee={activeAttendee}
        onClose={handleCloseModal}
        onConfirm={handleConfirmEntry}
        isProcessing={isProcessingEntry}
      />

      <CameraDisclosureModal
        visible={showDisclosure}
        onAccept={handleAcceptDisclosure}
        onClose={() => setShowDisclosure(false)}
      />
    </View>
  );
};

// ... keep existing styles object at the bottom ...
const styles = StyleSheet.create({
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: vs(40),
    marginBottom: vs(10),
  },
  dateLeft: { flexDirection: "row", alignItems: "center", gap: hs(4) },
  dateText: { fontSize: fs(14), color: COLORS.text.primary },
  dateRight: { flexDirection: "row", alignItems: "center", paddingVertical: vs(4) },
  dayText: { fontSize: fs(12), color: COLORS.text.primary },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: vs(10),
  },
  historyTitle: { fontSize: fs(16), color: COLORS.text.primary },
  debugBtn: { flexDirection: "row", alignItems: "center", gap: hs(4), padding: hs(4) },
  tabsWrapper: { marginBottom: vs(10) },
  tabsContainer: { gap: hs(10) },
  tab: {
    minWidth: hs(75),
    height: vs(40),
    borderRadius: ms(10),
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: hs(8),
  },
  tabActive: { backgroundColor: "#282828" },
  tabInactive: { backgroundColor: COLORS.surface.primary },
  tabText: { fontSize: fs(12), textAlign: "center", lineHeight: fs(12) },
  listContainer: { paddingBottom: vs(100) },
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
  avatar: { width: "100%", height: "100%" },
  scanInfo: { flex: 1, marginLeft: hs(10) },
  scanHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  nameContainer: { flex: 1, gap: vs(6) },
  scanName: { fontSize: fs(16), color: COLORS.text.primary },
  phoneContainer: { flexDirection: "row", alignItems: "center", gap: hs(6) },
  scanPhone: { fontSize: fs(14), color: COLORS.text.primary },
  typeContainer: { alignItems: "flex-end", gap: vs(10) },
  scanTime: { fontSize: fs(14), color: COLORS.text.primary },
  scanType: { fontSize: fs(14), color: COLORS.primary },
  cameraRoot: { flex: 1, backgroundColor: "#000" },
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
  flex1: { flex: 1 },
  blackBg: { backgroundColor: "#000" },
  dualRowRight: { flex: 1, marginLeft: hs(10) },
  warningTitle: { color: COLORS.danger },
  closeBtnLarge: {
    flex: 1,
    height: vs(45),
    backgroundColor: "#000",
    borderRadius: ms(10),
    justifyContent: "center",
    alignItems: "center",
  },
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
  modalHeader: { marginBottom: vs(10), paddingHorizontal: hs(6) },
  modalTitle: { fontSize: fs(16), color: COLORS.text.primary, textTransform: "uppercase" },
  modalBody: { gap: vs(10), padding: ms(6) },
  modalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.surface.primary,
    borderRadius: ms(10),
    paddingHorizontal: hs(10),
    paddingVertical: vs(12),
  },
  dualRow: { flexDirection: "row", alignItems: "center" },
  rowLabelContainer: { flexDirection: "row", alignItems: "center", gap: hs(6) },
  rowLabel: { fontSize: fs(14), color: COLORS.text.primary },
  rowValueContainer: { alignItems: "flex-end" },
  passTypeText: { fontSize: fs(14), color: COLORS.primary },
  rowValueText: { fontSize: fs(14), color: COLORS.text.primary },
  modalFooter: { flexDirection: "row", gap: hs(10), marginTop: vs(20) },
  cancelButton: {
    flex: 1,
    height: vs(45),
    borderWidth: 1,
    borderColor: COLORS.border.navBar,
    borderRadius: ms(10),
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButtonText: { fontSize: fs(20), color: COLORS.text.primary, fontFamily: "Bison-Bold" },
  confirmButton: {
    flex: 1,
    height: vs(45),
    backgroundColor: "#000",
    borderRadius: ms(10),
    justifyContent: "center",
    alignItems: "center",
  },
  confirmButtonText: { fontSize: fs(20), color: COLORS.text.inverse, fontFamily: "Bison-Bold" },
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
  disclosureTitle: { marginBottom: vs(12), textAlign: "center" },
  disclosureDescription: {
    textAlign: "center",
    color: COLORS.text.secondary,
    marginBottom: vs(24),
    lineHeight: fs(22),
  },
  disclosureButton: { width: "100%", marginBottom: vs(12) },
  disclosureCancel: { padding: ms(8) },
  emptyListText: { textAlign: "center", marginTop: vs(20) },
});
