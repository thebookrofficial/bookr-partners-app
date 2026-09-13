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
  RefreshControl,
  PermissionsAndroid,
  Vibration,
  DeviceEventEmitter,
  Platform,
} from "react-native";
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { Text } from "@/components/ui";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
import { Button } from "@/components/ui/Button";
import { EventHeader } from "../components/EventHeader";
import { Phone, X, Camera as CameraIcon, Image as ImageIcon } from "lucide-react-native";
import { useIsFocused, useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import { supabase } from "@/lib/supabase";
import { Camera } from "react-native-camera-kit";
import jsQR from "jsqr";
import { launchImageLibrary } from "react-native-image-picker";
import { Images } from "react-native-nitro-image";

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
  isInvite?: boolean;
  isSpot?: boolean;
  avatarUrl?: string;
  updatedAt: string; // Used for sorting
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

// --- Camera Component ---
const FullScreenCamera = ({ onClose, onCodeScanned, onGalleryPick, isProcessingGallery }: any) => {
  const isScanning = useRef(true);

  return (
    <View style={styles.cameraRoot}>
      <Camera
        testID="camera-view"
        style={StyleSheet.absoluteFillObject}
        scanBarcode={true}
        onReadCode={(event: any) => {
          const code = event.nativeEvent.codeStringValue;
          if (code && isScanning.current && !isProcessingGallery) {
            isScanning.current = false;
            Vibration.vibrate(100);
            onCodeScanned(code);
            setTimeout(() => {
              isScanning.current = true;
            }, 2000);
          }
        }}
        showFrame={false}
      />

      {/* Subtle Overlay Mask */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <View style={styles.maskTop} />
        <View style={styles.maskMiddle}>
          <View style={styles.maskSide} />
          <View style={styles.maskFrame}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
          <View style={styles.maskSide} />
        </View>
        <View style={styles.maskBottom} />
      </View>

      <View style={styles.cameraUIOverlay} pointerEvents="box-none">
        <TouchableOpacity style={styles.cameraCloseBtn} onPress={onClose}>
          <X size={ms(24)} color="#FFF" />
        </TouchableOpacity>

        {isProcessingGallery ? (
          <View style={styles.processingOverlay}>
            <ActivityIndicator size="large" color="#FFF" />
            <Text weight="bold" color="#FFF" style={{ marginTop: vs(12) }}>
              Processing Image...
            </Text>
          </View>
        ) : (
          <>
            <Text weight="medium" style={styles.cameraHintText}>
              Align QR code within the frame
            </Text>

            <TouchableOpacity style={styles.galleryBtn} onPress={onGalleryPick}>
              <ImageIcon size={ms(20)} color="#FFF" />
              <Text color="#FFF" weight="bold" style={{ marginLeft: hs(8) }}>
                Upload from Gallery
              </Text>
            </TouchableOpacity>
          </>
        )}

        {__DEV__ && !isProcessingGallery && (
          <TouchableOpacity
            style={styles.simulateBtn}
            onPress={() => onCodeScanned("pay_SnvxbS0ZkGJzEZ")}>
            <Text color="#FFF" weight="bold">
              Simulate Scan
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// --- Main Screen ---
export const EventScanScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const isFocused = useIsFocused();

  const [serviceId, setServiceId] = useState<string>("");
  const [isProcessingGallery, setIsProcessingGallery] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let id = route.params?.serviceId;
      if (!id) {
        const parentState = navigation.getParent()?.getState();
        const tabRoute = parentState?.routes.find((r: any) => r.name === "EventServiceTabs");
        const tabParams = tabRoute?.params as any;
        id = tabParams?.serviceId || tabParams?.params?.serviceId || "";
      }
      setServiceId(id || "");
    }, [route.params?.serviceId, navigation]),
  );

  const [selectedTab, setSelectedTab] = useState("All");
  const [isScanningMode, setIsScanningMode] = useState(false);

  // Real DB Data states
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const [activeEventTitle, setActiveEventTitle] = useState<string>("");
  const [activeEventImage, setActiveEventImage] = useState<string | null>(null);
  const [venueEventIds, setVenueEventIds] = useState<string[]>([]);
  const [scannedAttendees, setScannedAttendees] = useState<Attendee[]>([]);
  const [ticketCategories, setTicketCategories] = useState<string[]>([]);
  const [isFetchingHistory, setIsFetchingHistory] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [showDisclosure, setShowDisclosure] = useState(false);

  // 1. Fetch Event, Pre-load Passes, and Fetch Scanned History
  const fetchScannedHistory = useCallback(async () => {
    if (!serviceId) return;
    try {
      setIsFetchingHistory(true);

      // A. Fetch the main event for this venue to get its real event_id and its passes
      const { data: events, error: eventError } = await supabase
        .from("events")
        .select(
          `
          id,
          title,
          created_at,
          cover_image_url,
          event_passes ( name ),
          event_zones ( zone_name )
        `,
        )
        .eq("venue_id", serviceId);

      if (eventError) throw eventError;
      if (!events || events.length === 0) {
        setIsFetchingHistory(false);
        return;
      }

      // 1. Try to specifically find Neon Shadow first
      let event = events.find((e: any) => e.title && e.title.includes("Neon Shadow"));

      // 2. If not found, sort by oldest created_at
      if (!event) {
        event = events.sort(
          (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        )[0];
      }

      const realEventId = event.id;
      setActiveEventId(realEventId);
      setActiveEventTitle(event.title || "Event Scans");
      setActiveEventImage(event.cover_image_url || null);
      const fetchedVenueEventIds = events.map((e: any) => e.id);
      setVenueEventIds(fetchedVenueEventIds);

      // B. Pre-fill categories from passes and zones so the tabs ALWAYS exist
      const cats = new Set<string>();
      const passesData = event.event_passes || [];
      const zonesData = event.event_zones || [];

      passesData.forEach((p: any) => {
        if (p.name) cats.add(p.name);
      });
      zonesData.forEach((z: any) => {
        if (z.zone_name) cats.add(z.zone_name);
      });

      // C. Fetch only COMPLETED (scanned) bookings for the history list
      const [bookingsRes, invitesRes] = await Promise.all([
        supabase
          .from("event_bookings")
          .select(
            `
            id, ticket_count, booking_status, guest_name, guest_phone, updated_at, is_spot_entry, booking_source,
            profiles (full_name, phone, avatar_url),
            event_passes (name),
            event_zones (zone_name)
          `,
          )
          .in("event_id", fetchedVenueEventIds)
          .eq("booking_status", "completed")
          .order("updated_at", { ascending: false }),
        supabase
          .from("event_guest_invites")
          .select(`id, guest_name, guest_phone, status, created_at`)
          .in("event_id", fetchedVenueEventIds)
          .eq("status", "completed")
          .order("created_at", { ascending: false }),
      ]);

      if (bookingsRes.error) throw bookingsRes.error;
      if (invitesRes.error) throw invitesRes.error;

      const formattedBookings: Attendee[] = (bookingsRes.data || []).map((b: any) => {
        const profile = Array.isArray(b.profiles) ? b.profiles[0] : b.profiles;
        const pass = Array.isArray(b.event_passes) ? b.event_passes[0] : b.event_passes;
        const zone = Array.isArray(b.event_zones) ? b.event_zones[0] : b.event_zones;

        const catName = pass?.name || zone?.zone_name || "Regular";
        cats.add(catName);

        const timeStr = new Date(b.updated_at).toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });

        const isSpotBooking = b.is_spot_entry || b.booking_source === "offline";

        return {
          id: b.id,
          name: isSpotBooking && b.guest_name ? b.guest_name : profile?.full_name || "Guest",
          phone: isSpotBooking && b.guest_phone ? b.guest_phone : profile?.phone || "N/A",
          time: timeStr.toUpperCase(),
          ticketType: `${catName} x ${b.ticket_count}`,
          categoryName: catName,
          isSpot: isSpotBooking,
          avatarUrl: isSpotBooking ? undefined : profile?.avatar_url,
          updatedAt: b.updated_at,
        };
      });

      const formattedInvites: Attendee[] = (invitesRes.data || []).map((i: any) => {
        const timeStr = new Date(i.created_at).toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });

        return {
          id: i.id,
          name: i.guest_name || "Guest",
          phone: i.guest_phone || "N/A",
          time: timeStr.toUpperCase(),
          ticketType: "GUEST INVITE",
          categoryName: "Guest",
          isInvite: true,
          updatedAt: i.created_at,
        };
      });

      const combined = [...formattedBookings, ...formattedInvites].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );

      setTicketCategories(Array.from(new Set(cats)));
      setScannedAttendees(combined);
    } catch (err) {
      console.error("Error fetching scanned history:", err);
    } finally {
      setIsFetchingHistory(false);
    }
  }, [serviceId]);

  useFocusEffect(
    useCallback(() => {
      fetchScannedHistory();
    }, [fetchScannedHistory]),
  );

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchScannedHistory();
    setIsRefreshing(false);
  }, [fetchScannedHistory]);

  // Build tabs cleanly, filtering out duplicates and Guest from the mapped list
  const seenLabels = new Set<string>(["All", "Guest", "Spot"]);
  const TABS = [
    { label: "All", count: scannedAttendees.length },
    ...ticketCategories
      .filter(cat => {
        if (cat.toLowerCase() === "guest") return false;
        if (seenLabels.has(cat)) return false;
        seenLabels.add(cat);
        return true;
      })
      .map(cat => ({
        label: cat,
        count: scannedAttendees.filter(a => a.categoryName === cat).length,
      })),
    {
      label: "Guest",
      count: scannedAttendees.filter(a => a.categoryName.toLowerCase() === "guest").length,
    },
    {
      label: "Spot",
      count: scannedAttendees.filter(a => a.isSpot).length,
    },
  ];

  const filteredScans =
    selectedTab === "All"
      ? scannedAttendees
      : selectedTab === "Spot"
      ? scannedAttendees.filter(a => a.isSpot)
      : scannedAttendees.filter(
          a =>
            a.categoryName === selectedTab ||
            (selectedTab === "Guest" && a.categoryName.toLowerCase() === "guest"),
        );

  const handleOpenScanner = useCallback(async () => {
    try {
      if (Platform.OS === "ios") {
        setIsScanningMode(true);
      } else {
        const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA);
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          setIsScanningMode(true);
        } else {
          Alert.alert("Permission Required", "Camera access is required to scan tickets.");
        }
      }
    } catch (err) {
      console.warn("Camera permission error:", err);
    }
  }, []);

  const handleAcceptDisclosure = async () => {
    setShowDisclosure(false);
    try {
      if (Platform.OS === "ios") {
        setIsScanningMode(true);
      } else {
        const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA);
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          setIsScanningMode(true);
        } else {
          Alert.alert("Permission Required", "Allow camera access in settings to scan tickets.");
        }
      }
    } catch (err) {
      console.warn("Camera permission error:", err);
    }
  };

  useEffect(() => {
    fetchScannedHistory();
  }, [fetchScannedHistory]);

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener("reopenScanner", () => {
      fetchScannedHistory();
      setTimeout(() => {
        setIsScanningMode(true);
      }, 500);
    });
    return () => subscription.remove();
  }, [fetchScannedHistory]);

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
      onPress={() =>
        navigation.navigate("EventEntryDetails", { entryId: item.id, isFromScan: true } as any)
      }>
      <View style={styles.avatarContainer}>
        <Image
          source={item.avatarUrl ? { uri: item.avatarUrl } : USER_PROFILE}
          style={styles.avatar}
        />
      </View>
      <View style={styles.scanInfo}>
        <View style={styles.scanHeader}>
          <View style={styles.nameContainer}>
            <View style={styles.nameRow}>
              <Text weight="bold" style={styles.scanName} numberOfLines={1}>
                {item.name}
              </Text>
              {item.isSpot && (
                <View style={styles.spotBadge}>
                  <Text weight="semiBold" style={styles.spotText}>
                    Spot
                  </Text>
                </View>
              )}
            </View>
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

  // 2. Validate Scanned Token against Supabase DB
  const handleCodeScanned = useCallback(
    async (code: string) => {
      if (!activeEventId) return;
      try {
        let finalCode = code.trim();
        // If the QR code is a web link (e.g. https://thebookr.in/pass/ot2r17u0pyqv), extract the token part
        if (finalCode.includes("/pass/")) {
          const parts = finalCode.split("/pass/");
          finalCode = parts[parts.length - 1].replace(/\/$/, ""); // get the last part and remove trailing slash if any
        }

        const { data: booking } = await supabase
          .from("event_bookings")
          .select(
            `
            *,
            event_passes (name),
            event_zones (zone_name)
          `,
          )
          .eq("qr_code_token", finalCode)
          .in("event_id", venueEventIds)
          .maybeSingle();

        if (booking) {
          if (booking.booking_status === "completed") {
            Alert.alert("Already Scanned", "This ticket has already been used for entry.");
            return;
          }

          const { error: updateError } = await supabase
            .from("event_bookings")
            .update({ booking_status: "completed", updated_at: new Date().toISOString() })
            .eq("id", booking.id);

          if (updateError) throw updateError;

          fetchScannedHistory();

          const pass = Array.isArray(booking.event_passes)
            ? booking.event_passes[0]
            : booking.event_passes;
          const zone = Array.isArray(booking.event_zones)
            ? booking.event_zones[0]
            : booking.event_zones;
          const actualTicketType = pass?.name || zone?.zone_name || "Regular";

          setIsScanningMode(false);
          navigation.navigate("EventScanConfirmation", {
            attendee: {
              ...booking,
              name: booking.guest_name || booking.name || "Guest",
              phone: booking.guest_phone || booking.phone || "N/A",
              ticketType: `${actualTicketType} x ${booking.ticket_count}`,
            },
            isInvite: false,
          });
        } else {
          // Check for Guest Invites
          const { data: invite } = await supabase
            .from("event_guest_invites")
            .select("*")
            .eq("qr_code_token", finalCode)
            .in("event_id", venueEventIds)
            .maybeSingle();

          if (invite) {
            if (invite.status === "completed") {
              Alert.alert("Already Scanned", "This invite has already been used.");
              return;
            }

            const { error: updateError } = await supabase
              .from("event_guest_invites")
              .update({ status: "completed" })
              .eq("id", invite.id);
            if (updateError) throw updateError;

            fetchScannedHistory();

            setIsScanningMode(false);
            navigation.navigate("EventScanConfirmation", {
              attendee: {
                ...invite,
                name: invite.guest_name || "Guest",
                phone: invite.guest_phone || "N/A",
                ticketType: "GUEST INVITE",
              },
              isInvite: true,
            });
          } else {
            Alert.alert("Invalid Ticket", "QR code not found for this event.");
          }
        }
      } catch (err) {
        console.error(err);
      }
    },
    [activeEventId, navigation, venueEventIds, fetchScannedHistory],
  );

  const handleGalleryPick = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: "photo",
        quality: 1,
      });

      if (result.didCancel || !result.assets || result.assets.length === 0) {
        return;
      }

      const uri = result.assets[0].uri;
      if (!uri) return;

      setIsProcessingGallery(true);

      // Load image natively using Nitro Image
      let image = await Images.loadFromFileAsync(uri);

      // Downscale to max 800px to avoid freezing the JS thread
      const MAX_DIM = 800;
      if (image.width > MAX_DIM || image.height > MAX_DIM) {
        const ratio = Math.min(MAX_DIM / image.width, MAX_DIM / image.height);
        image = await image.resizeAsync(
          Math.round(image.width * ratio),
          Math.round(image.height * ratio),
        );
      }

      // Get raw pixel data
      const rawData = await image.toRawPixelData();
      const rawBytes = new Uint8Array(rawData.buffer);
      const width = rawData.width;
      const height = rawData.height;
      const format = rawData.pixelFormat;

      let rgba;
      const totalPixels = width * height;
      const bpp = rawBytes.length / totalPixels;

      if (bpp === 4) {
        rgba = new Uint8ClampedArray(totalPixels * 4);
        for (let i = 0; i < totalPixels; i++) {
          const idx = i * 4;
          if (format === "BGRA" || format === "BGRX") {
            rgba[idx] = rawBytes[idx + 2];
            rgba[idx + 1] = rawBytes[idx + 1];
            rgba[idx + 2] = rawBytes[idx + 0];
          } else if (format === "ARGB" || format === "XRGB") {
            rgba[idx] = rawBytes[idx + 1];
            rgba[idx + 1] = rawBytes[idx + 2];
            rgba[idx + 2] = rawBytes[idx + 3];
          } else if (format === "ABGR" || format === "XBGR") {
            rgba[idx] = rawBytes[idx + 3];
            rgba[idx + 1] = rawBytes[idx + 2];
            rgba[idx + 2] = rawBytes[idx + 1];
          } else {
            // Default assume RGBA or RGBX
            rgba[idx] = rawBytes[idx];
            rgba[idx + 1] = rawBytes[idx + 1];
            rgba[idx + 2] = rawBytes[idx + 2];
          }
          // Force alpha to 255 for qr scanning
          rgba[idx + 3] = 255;
        }
      } else if (bpp === 3) {
        rgba = new Uint8ClampedArray(totalPixels * 4);
        for (let i = 0; i < totalPixels; i++) {
          const idx3 = i * 3;
          const idx4 = i * 4;
          if (format === "BGR") {
            rgba[idx4] = rawBytes[idx3 + 2];
            rgba[idx4 + 1] = rawBytes[idx3 + 1];
            rgba[idx4 + 2] = rawBytes[idx3 + 0];
          } else {
            // RGB
            rgba[idx4] = rawBytes[idx3];
            rgba[idx4 + 1] = rawBytes[idx3 + 1];
            rgba[idx4 + 2] = rawBytes[idx3 + 2];
          }
          rgba[idx4 + 3] = 255;
        }
      } else {
        throw new Error("Unknown pixel format: " + format);
      }

      const code = jsQR(rgba, width, height);
      if (code && code.data) {
        Vibration.vibrate(100);
        handleCodeScanned(code.data);
      } else {
        Alert.alert("No QR Code", "Could not detect a QR code in the selected image.");
      }
    } catch (e) {
      console.error("Gallery scan error:", e);
      Alert.alert("Error", "Failed to process the image.");
    } finally {
      setIsProcessingGallery(false);
    }
  };

  return (
    <View style={styles.flex1}>
      {isScanningMode ? (
        <FullScreenCamera
          onClose={() => setIsScanningMode(false)}
          onCodeScanned={handleCodeScanned}
          onGalleryPick={handleGalleryPick}
          isProcessingGallery={isProcessingGallery}
          isActive={isFocused}
        />
      ) : (
        <ScreenContainer backgroundColor={COLORS.background} paddingHorizontal={hs(12)}>
          <EventHeader
            title={activeEventTitle}
            subtitle="Scan & Verify"
            imageSource={activeEventImage ? { uri: activeEventImage } : USER_PROFILE}
          />

          <View style={styles.historyHeader}>
            <Text weight="bold" variant="body1" style={styles.historyTitle}>
              SCANNED TICKETS
            </Text>
            <TouchableOpacity onPress={handleOpenScanner} style={styles.debugBtn}>
              <CameraIcon size={16} color={COLORS.primary} />
              <Text color={COLORS.primary} variant="body1">
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

          {isFetchingHistory && !isRefreshing ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: vs(20) }} />
          ) : (
            <FlatList
              data={filteredScans}
              renderItem={renderScanItem}
              keyExtractor={item => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContainer}
              ListEmptyComponent={<Text style={styles.emptyListText}>No tickets scanned yet.</Text>}
              refreshControl={
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={onRefresh}
                  tintColor={COLORS.primary}
                  colors={[COLORS.primary]}
                />
              }
            />
          )}
        </ScreenContainer>
      )}

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
  historyTitle: { fontSize: fs(18), color: COLORS.text.primary },
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
  nameRow: { flexDirection: "row", alignItems: "center", gap: hs(6) },
  scanName: { fontSize: fs(16), color: COLORS.text.primary, flexShrink: 1 },
  spotBadge: {
    backgroundColor: "#EEF3FC",
    paddingHorizontal: hs(6),
    paddingVertical: vs(2),
    borderRadius: ms(4),
  },
  spotText: { fontSize: fs(10), color: "#4A80F0" },
  phoneContainer: { flexDirection: "row", alignItems: "center", gap: hs(6) },
  scanPhone: { fontSize: fs(14), color: COLORS.text.primary },
  typeContainer: { alignItems: "flex-end", gap: vs(10) },
  scanTime: { fontSize: fs(14), color: COLORS.text.primary },
  scanType: { fontSize: fs(14), color: COLORS.primary },
  cameraRoot: { flex: 1, backgroundColor: "#000" },
  maskTop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)" },
  maskMiddle: { flexDirection: "row", height: hs(260) },
  maskSide: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)" },
  maskFrame: { width: hs(260), backgroundColor: "transparent" },
  maskBottom: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)" },
  corner: {
    position: "absolute",
    width: hs(30),
    height: hs(30),
    borderColor: COLORS.primary,
  },
  topLeft: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: ms(15) },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: ms(15),
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: ms(15),
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: ms(15),
  },
  cameraUIOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  cameraCloseBtn: {
    position: "absolute",
    top: vs(50),
    right: hs(20),
    padding: ms(10),
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: ms(25),
    zIndex: 10,
  },
  cameraHintText: {
    color: "#FFF",
    marginTop: vs(320),
    fontSize: fs(16),
    textAlign: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
    paddingHorizontal: hs(16),
    paddingVertical: vs(6),
    borderRadius: ms(20),
    overflow: "hidden",
  },
  simulateBtn: {
    position: "absolute",
    bottom: vs(50),
    backgroundColor: COLORS.primary,
    paddingHorizontal: hs(24),
    paddingVertical: vs(12),
    borderRadius: ms(10),
  },
  galleryBtn: {
    marginTop: vs(20),
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: hs(20),
    paddingVertical: vs(12),
    borderRadius: ms(25),
  },
  processingOverlay: {
    marginTop: vs(300),
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: ms(20),
    borderRadius: ms(16),
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
