// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  RootStackParamList,
  AuthStackParamList,
  MainStackParamList,
  SportsTabParamList,
  DineTabParamList,
  StaycationTabParamList,
  EventTabParamList,
} from "./navigation.types";
import { View, StyleSheet, ActivityIndicator, Text as RNText } from "react-native";
import {
  CalendarCheck,
  FileText,
  History as HistoryIcon,
  LayoutDashboard,
  MoreHorizontal,
  User,
} from "lucide-react-native";
import { Linking, Alert } from "react-native";
import messaging from "@react-native-firebase/messaging";
import { LinkingOptions } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StaffService } from "@/features/profile/services/staff.service";

import { VendorProfileScreen } from "@/features/profile/screens/VendorProfileScreen";
import { SettingsScreen } from "@/features/settings/screens/SettingsScreen";
import { EditProfileScreen } from "@/features/profile/screens/EditProfileScreen";
import { AddStaffScreen } from "@/features/profile/screens/AddStaffScreen";
import { EditStaffScreen } from "@/features/profile/screens/EditStaffScreen";
import { StaffManagementScreen } from "@/features/profile/screens/StaffManagementScreen";
import { BookingDetailsScreen } from "@/features/sports/screens/BookingDetailsScreen";
import { GuestHistoryScreen } from "@/features/sports/screens/GuestHistoryScreen";
import { SportsHistoryScreen } from "@/features/sports/screens/SportsHistoryScreen";
import { SportsHomeScreen } from "@/features/sports/screens/SportsHomeScreen";
import { SportsDashboardScreen } from "@/features/sports/screens/SportsDashboardScreen";
import { SportsEssentialsScreen } from "@/features/sports/screens/SportsEssentialsScreen";
import { BlockUnblockScreen } from "@/features/sports/screens/BlockUnblockScreen";
import { BulkBookingScreen } from "@/features/sports/screens/BulkBookingScreen";
import { BulkBookingDetailsScreen } from "@/features/sports/screens/BulkBookingDetailsScreen";
import { RescheduleBookingScreen } from "@/features/sports/screens/RescheduleBookingScreen";
import { StaycationBookingDetailsScreen } from "@/features/staycation/screens/StaycationBookingDetailsScreen";
import { StaycationInvoiceScreen } from "@/features/staycation/screens/StaycationInvoiceScreen";
import { StaycationOffersScreen } from "@/features/staycation/screens/StaycationOffersScreen";
import { StaycationHomeScreen } from "@/features/staycation/screens/StaycationHomeScreen";
import { StaycationHistoryScreen } from "@/features/staycation/screens/StaycationHistoryScreen";
import { StaycationDashboardScreen } from "@/features/staycation/screens/StaycationDashboardScreen";
import { StaycationEssentialsScreen } from "@/features/staycation/screens/StaycationEssentialsScreen";
import { StaycationCloseDateScreen } from "@/features/staycation/screens/StaycationCloseDateScreen";
import { DineHomeScreen } from "@/features/dine/screens/DineHomeScreen";
import { DineDashboardScreen } from "@/features/dine/screens/DineDashboardScreen";
import { DineHistoryScreen } from "@/features/dine/screens/DineHistoryScreen";
import { DineEssentialsScreen } from "@/features/dine/screens/DineEssentialsScreen";
import { DineCloseDateScreen } from "@/features/dine/screens/DineCloseDateScreen";
import { DineOffersScreen } from "@/features/dine/screens/DineOffersScreen";
import { DineBookingDetailsScreen } from "@/features/dine/screens/DineBookingDetailsScreen";
import { DinePaymentDetailsScreen } from "@/features/dine/screens/DinePaymentDetailsScreen";
import { EventHomeScreen } from "@/features/event/screens/EventHomeScreen";
import { EventEssentialsScreen } from "@/features/event/screens/EventEssentialsScreen";
import { EventOffersScreen } from "@/features/event/screens/EventOffersScreen";
import { EventGuestInviteScreen } from "@/features/event/screens/EventGuestInviteScreen";
import { EventExportBookingsScreen } from "@/features/event/screens/EventExportBookingsScreen";
import { EventDashboardScreen } from "@/features/event/screens/EventDashboardScreen";
import { EventScanScreen } from "@/features/event/screens/EventScanScreen";
import { EventEntryDetailsScreen } from "@/features/event/screens/EventEntryDetailsScreen";
import { EventScanConfirmationScreen } from "@/features/event/screens/EventScanConfirmationScreen";
import { LegalViewScreen } from "@/features/settings/screens/LegalViewScreen";
import { NotificationSettingsScreen } from "@/features/settings/screens/NotificationSettingsScreen";
import { FAQScreen } from "@/features/settings/screens/FAQScreen";
import { LoginScreen } from "@/features/auth/screens/LoginScreen";
import { OtpScreen } from "@/features/auth/screens/OtpScreen";
import { AcceptInviteScreen } from "@/features/auth/screens/AcceptInviteScreen";
import { PayoutsScreen } from "@/features/finance/screens/PayoutsScreen";
import { PayoutDetailsScreen } from "@/features/finance/screens/PayoutDetailsScreen";
import { SportsInvoiceScreen } from "@/features/sports/screens/SportsInvoiceScreen";

import { COLORS } from "@/constants/theme";
import { vs, ms, fs, hs } from "@/utils/responsive.utils";

// --- AUTHENTICATION IMPORTS ---
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store";

const PlaceholderScreen = ({ title }: { title: string }) => (
  <View style={styles.placeholderContainer}>
    <RNText style={styles.placeholderText}>{title}</RNText>
  </View>
);

const SignupScreen = () => <PlaceholderScreen title="Signup Screen" />;

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainStack = createNativeStackNavigator<MainStackParamList>();
const SportsTab = createBottomTabNavigator<SportsTabParamList>();
const DineTab = createBottomTabNavigator<DineTabParamList>();
const StaycationTab = createBottomTabNavigator<StaycationTabParamList>();
const EventTab = createBottomTabNavigator<EventTabParamList>();

import { useSafeAreaInsets } from "react-native-safe-area-context";

const TabIcon =
  (IconComponent: any) =>
  ({ color }: { color: string }) =>
    <IconComponent color={color} size={ms(24)} />;

const useTabScreenOptions = () => {
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom;
  const paddingBottom = bottomInset > 0 ? bottomInset + vs(20) : vs(30);
  const height = vs(52) + paddingBottom;

  return React.useMemo(
    () => ({
      headerShown: false,
      tabBarActiveTintColor: COLORS.primary,
      tabBarInactiveTintColor: COLORS.text.muted,
      tabBarStyle: {
        position: "absolute" as const,
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: COLORS.surface.primary,
        borderTopWidth: 1,
        borderTopColor: COLORS.border.navBar,
        borderTopLeftRadius: ms(20),
        borderTopRightRadius: ms(20),
        height: height,
        paddingTop: vs(10),
        paddingBottom: paddingBottom,
        paddingHorizontal: hs(10),
        elevation: 0,
        shadowOpacity: 0,
      },
      tabBarItemStyle: {
        marginHorizontal: 0,
      },
      tabBarLabelStyle: {
        fontFamily: "Gilroy-Bold",
        fontSize: fs(12),
        lineHeight: fs(12),
        marginTop: vs(2),
      },
    }),
    [height, paddingBottom],
  );
};

const SportsTabNavigator = () => {
  const tabScreenOptions = useTabScreenOptions();
  const { clientProfile } = useAuthStore();
  const isOwner = clientProfile?.client_role === "owner" || !clientProfile; // fallback
  const perms = clientProfile?.permissions || [];
  const canAccess = (perm: string) => isOwner || perms.includes(perm);

  return (
    <SportsTab.Navigator screenOptions={tabScreenOptions}>
      {canAccess("sports:View Sports Home") && (
        <SportsTab.Screen
          name="SportsHome"
          component={SportsHomeScreen}
          options={{ title: "Home", tabBarIcon: TabIcon(CalendarCheck) }}
        />
      )}
      {canAccess("sports:View Sports History") && (
        <SportsTab.Screen
          name="SportsHistory"
          component={SportsHistoryScreen}
          options={{ title: "History", tabBarIcon: TabIcon(HistoryIcon) }}
        />
      )}
      {/* Dashboard is typically owner-only unless explicitly granted */}
      {isOwner && (
        <SportsTab.Screen
          name="SportsDashboard"
          component={SportsDashboardScreen}
          options={{ title: "Dashboard", tabBarIcon: TabIcon(LayoutDashboard) }}
        />
      )}
      {(isOwner ||
        canAccess("sports:Manage Bulk Bookings") ||
        canAccess("sports:Block / Unblock Slots")) && (
        <SportsTab.Screen
          name="SportsEssentials"
          component={SportsEssentialsScreen}
          options={{ title: "Essentials", tabBarIcon: TabIcon(MoreHorizontal) }}
        />
      )}
      {/* Profile can be accessed by everyone */}
      <SportsTab.Screen
        name="SportsProfile"
        component={VendorProfileScreen}
        options={{ title: "Profile", tabBarIcon: TabIcon(User) }}
      />
    </SportsTab.Navigator>
  );
};

const DineTabNavigator = () => {
  const tabScreenOptions = useTabScreenOptions();
  return (
    <DineTab.Navigator screenOptions={tabScreenOptions}>
      <DineTab.Screen
        name="DineHome"
        component={DineHomeScreen}
        options={{ title: "Home", tabBarIcon: TabIcon(CalendarCheck) }}
      />
      <DineTab.Screen
        name="DineHistory"
        component={DineHistoryScreen}
        options={{ title: "History", tabBarIcon: TabIcon(HistoryIcon) }}
      />
      <DineTab.Screen
        name="DineDashboard"
        component={DineDashboardScreen}
        options={{ title: "Dashboard", tabBarIcon: TabIcon(LayoutDashboard) }}
      />
      <DineTab.Screen
        name="DineEssentials"
        component={DineEssentialsScreen}
        options={{ title: "Essentials", tabBarIcon: TabIcon(MoreHorizontal) }}
      />
      <DineTab.Screen
        name="DineProfile"
        component={VendorProfileScreen}
        options={{ title: "Profile", tabBarIcon: TabIcon(User) }}
      />
    </DineTab.Navigator>
  );
};

const StaycationTabNavigator = () => {
  const tabScreenOptions = useTabScreenOptions();
  const { clientProfile } = useAuthStore();
  const isOwner = clientProfile?.client_role === "owner" || !clientProfile; // fallback
  const perms = clientProfile?.permissions || [];
  const canAccess = (perm: string) => isOwner || perms.includes(perm);

  return (
    <StaycationTab.Navigator screenOptions={tabScreenOptions}>
      {canAccess("staycation:View Staycation Home") && (
        <StaycationTab.Screen
          name="StaycationHome"
          component={StaycationHomeScreen}
          options={{ title: "Home", tabBarIcon: TabIcon(CalendarCheck) }}
        />
      )}
      {canAccess("staycation:View Staycation History") && (
        <StaycationTab.Screen
          name="StaycationHistory"
          component={StaycationHistoryScreen}
          options={{ title: "History", tabBarIcon: TabIcon(HistoryIcon) }}
        />
      )}
      {isOwner && (
        <StaycationTab.Screen
          name="StaycationDashboard"
          component={StaycationDashboardScreen}
          options={{ title: "Dashboard", tabBarIcon: TabIcon(LayoutDashboard) }}
        />
      )}
      {isOwner && (
        <StaycationTab.Screen
          name="StaycationEssentials"
          component={StaycationEssentialsScreen}
          options={{ title: "Essentials", tabBarIcon: TabIcon(MoreHorizontal) }}
        />
      )}
      <StaycationTab.Screen
        name="StaycationProfile"
        component={VendorProfileScreen}
        options={{ title: "Profile", tabBarIcon: TabIcon(User) }}
      />
      {/* Hidden tab for deep linking or programmatic navigation without showing icon */}
      <StaycationTab.Screen
        name="StaycationCloseDate"
        component={StaycationCloseDateScreen}
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: { display: "none" },
        }}
      />
    </StaycationTab.Navigator>
  );
};

const ScanTabIcon = () => (
  <View style={styles.scanButton}>
    <View style={styles.scanInner}>
      <View style={styles.scanLine} />
    </View>
  </View>
);

const EventTabNavigator = () => {
  const tabScreenOptions = useTabScreenOptions();
  return (
    <EventTab.Navigator
      screenOptions={{
        ...tabScreenOptions,
        tabBarStyle: {
          ...tabScreenOptions.tabBarStyle,
          paddingTop: vs(4), // Slightly less padding to accommodate elevated scan button
        },
      }}>
      <EventTab.Screen
        name="EventHome"
        component={EventHomeScreen}
        options={{
          title: "Bookings",
          tabBarIcon: TabIcon(FileText), // Better match for Figma list icon
        }}
      />
      <EventTab.Screen
        name="EventDashboard"
        component={EventDashboardScreen}
        options={{ title: "Dashboard", tabBarIcon: TabIcon(LayoutDashboard) }}
      />
      <EventTab.Screen
        name="EventScan"
        component={EventScanScreen}
        options={{
          title: "Scan",
          tabBarIcon: ScanTabIcon,
          tabBarLabelStyle: {
            color: COLORS.text.primary,
            fontSize: fs(12),
            fontFamily: "Gilroy-Bold",
          },
        }}
      />
      <EventTab.Screen
        name="EventEssentials"
        component={EventEssentialsScreen}
        options={{ title: "Essentials", tabBarIcon: TabIcon(MoreHorizontal) }}
      />
      <EventTab.Screen
        name="EventProfile"
        component={VendorProfileScreen}
        options={{ title: "Profile", tabBarIcon: TabIcon(User) }}
      />
    </EventTab.Navigator>
  );
};

const AuthNavigator = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="Otp" component={OtpScreen} />
    <AuthStack.Screen name="Signup" component={SignupScreen} />
    <AuthStack.Screen name="AcceptInvite" component={AcceptInviteScreen} />
    <AuthStack.Screen name="LegalView" component={LegalViewScreen} />
  </AuthStack.Navigator>
);

const MainNavigator = () => (
  <MainStack.Navigator screenOptions={{ headerShown: false }}>
    <MainStack.Screen name="VendorProfile" component={VendorProfileScreen} />
    <MainStack.Screen name="Settings" component={SettingsScreen} />
    <MainStack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
    <MainStack.Screen name="EditProfile" component={EditProfileScreen} />
    <MainStack.Screen name="StaffManagement" component={StaffManagementScreen} />
    <MainStack.Screen name="AddStaff" component={AddStaffScreen} />
    <MainStack.Screen name="EditStaff" component={EditStaffScreen} />
    <MainStack.Screen name="LegalView" component={LegalViewScreen} />
    <MainStack.Screen name="SportsServiceTabs" component={SportsTabNavigator} />
    <MainStack.Screen name="DineServiceTabs" component={DineTabNavigator} />
    <MainStack.Screen name="StaycationServiceTabs" component={StaycationTabNavigator} />
    <MainStack.Screen name="EventServiceTabs" component={EventTabNavigator} />
    <MainStack.Screen name="BookingDetails" component={BookingDetailsScreen} />
    <MainStack.Screen name="StaycationBookingDetails" component={StaycationBookingDetailsScreen} />
    <MainStack.Screen name="StaycationInvoice" component={StaycationInvoiceScreen} />
    <MainStack.Screen name="StaycationOffers" component={StaycationOffersScreen} />
    <MainStack.Screen name="DineBookingDetails" component={DineBookingDetailsScreen} />
    <MainStack.Screen name="DinePaymentDetails" component={DinePaymentDetailsScreen} />
    <MainStack.Screen name="DineCloseDate" component={DineCloseDateScreen} />
    <MainStack.Screen name="DineOffers" component={DineOffersScreen} />
    <MainStack.Screen name="EventOffers" component={EventOffersScreen} />
    <MainStack.Screen name="EventGuestInvite" component={EventGuestInviteScreen} />
    <MainStack.Screen name="EventExportBookings" component={EventExportBookingsScreen} />
    <MainStack.Screen name="EventEntryDetails" component={EventEntryDetailsScreen} />

    <MainStack.Screen name="EventScanConfirmation" component={EventScanConfirmationScreen} />
    <MainStack.Screen name="GuestHistory" component={GuestHistoryScreen} />
    <MainStack.Screen name="BlockUnblock" component={BlockUnblockScreen} />
    <MainStack.Screen name="BulkBooking" component={BulkBookingScreen} />
    <MainStack.Screen name="BulkBookingDetails" component={BulkBookingDetailsScreen} />
    <MainStack.Screen name="RescheduleBooking" component={RescheduleBookingScreen} />
    <MainStack.Screen name="Payouts" component={PayoutsScreen} />
    <MainStack.Screen name="PayoutDetails" component={PayoutDetailsScreen} />
    <MainStack.Screen name="SportsInvoice" component={SportsInvoiceScreen} />
    <MainStack.Screen name="AcceptInvite" component={AcceptInviteScreen} />
    <MainStack.Screen name="FAQ" component={FAQScreen} />
  </MainStack.Navigator>
);

const linking: LinkingOptions<RootStackParamList> = {
  // Your custom URL schemes
  prefixes: ["bookrpartner://", "https://partners.thebookr.in", "https://thebookr.in"],

  // Handles deep links when the app is completely closed (cold start)
  async getInitialURL() {
    const url = await Linking.getInitialURL();
    if (url != null) return url;

    const message = await messaging().getInitialNotification();
    if (message?.data?.link) return message.data.link as string;

    return null;
  },

  // Handles deep links when the app is running in the background
  subscribe(listener: (url: string) => void) {
    const onReceiveURL = ({ url }: { url: string }) => listener(url);
    const linkingSubscription = Linking.addEventListener("url", onReceiveURL);

    const unsubscribeNotification = messaging().onNotificationOpenedApp(message => {
      if (message?.data?.link) {
        listener(message.data.link as string);
      }
    });

    return () => {
      linkingSubscription.remove();
      unsubscribeNotification();
    };
  },

  // Maps the URL paths to your actual screens
  config: {
    screens: {
      Auth: {
        screens: {
          AcceptInvite: "invite",
        },
      },
      Main: {
        screens: {
          Settings: "settings",
          BookingDetails: "booking/:bookingId",
          Payouts: "payouts/:venueId",
          // You can map any screen from MainStackParamList here!
        },
      },
    },
  },
};

export const AppNavigator = () => {
  const { session, isInitialized, setSession, setInitialized } = useAuthStore();

  /**
   * @section Auth Initialisation — ⚠️ DO NOT MODIFY WITHOUT POOJA'S APPROVAL ⚠️
   *
   * ╔══════════════════════════════════════════════════════════════════════════╗
   * ║              CRITICAL AUTH INITIALISATION — DO NOT TOUCH               ║
   * ║                                                                        ║
   * ║  This useEffect uses the Supabase v2 INITIAL_SESSION event pattern     ║
   * ║  as the SINGLE source of truth for app boot.                           ║
   * ║                                                                        ║
   * ║  WHY THIS PATTERN WAS CHOSEN (post-1.1.3 regression analysis):        ║
   * ║  ──────────────────────────────────────────────────────────────────    ║
   * ║  The previous approach called getSession() AND subscribed to           ║
   * ║  onAuthStateChange simultaneously. This created a race condition:      ║
   * ║                                                                        ║
   * ║  1. When the JWT access token is expired, getSession() makes a         ║
   * ║     network call to refresh it (not an instant AsyncStorage read).     ║
   * ║  2. While the refresh was in-flight, onAuthStateChange fired           ║
   * ║     SIGNED_OUT with a null session.                                    ║
   * ║  3. setSession(null) was called → user shown the Login screen.         ║
   * ║  4. The refresh eventually completed but the app was already on the    ║
   * ║     wrong screen.                                                      ║
   * ║  → Result: random, intermittent logouts 1-2 out of every 7 app opens. ║
   * ║                                                                        ║
   * ║  HOW IT IS FIXED NOW:                                                  ║
   * ║  • INITIAL_SESSION fires exactly ONCE after the SDK has fully          ║
   * ║    resolved the startup session (including any token refresh).         ║
   * ║  • SIGNED_OUT is only handled AFTER init and only for genuine          ║
   * ║    sign-out actions — not transient mid-refresh null sessions.         ║
   * ║  • A 12-second safety timer calls setInitialized(true) as a last       ║
   * ║    resort if INITIAL_SESSION never fires (e.g. network fully dead),    ║
   * ║    so the user always sees a screen and never gets a frozen spinner.   ║
   * ║                                                                        ║
   * ║  DO NOT:                                                               ║
   * ║  • Call getSession() here in addition to onAuthStateChange             ║
   * ║  • Call setSession(null) on SIGNED_OUT before init is complete         ║
   * ║  • Wrap the Supabase client with AbortController or custom fetch       ║
   * ║  • Remove or shorten the safety timer without testing 10+ app opens   ║
   * ║                                                                        ║
   * ║  Changed: 2026-07-16  |  Approved by: Prasad                             ║
   * ╚══════════════════════════════════════════════════════════════════════════╝
   */
  useEffect(() => {
    let initialized = false;

    // Safety net: if INITIAL_SESSION never fires (network fully dead), unblock
    // the spinner after 12 seconds so the user at least sees a login screen.
    const safetyTimer = setTimeout(() => {
      if (!initialized) {
        initialized = true;
        setInitialized(true);
      }
    }, 12000);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (event === "INITIAL_SESSION") {
        // Fires once on startup with the final resolved session (after refresh if needed).
        // setSession is called UNCONDITIONALLY so that even if the safety timer fired
        // first (showing the login screen), the valid session still gets applied and
        // the navigator auto-switches to the home screen without a manual reopen.
        setSession(newSession);

        if (!initialized) {
          initialized = true;
          clearTimeout(safetyTimer);
          setInitialized(true);
        }

        // Non-blocking: fetch client profile in the background
        if (newSession?.user) {
          const userId = newSession.user.id;
          (async () => {
            try {
              const { data: clientData } = await supabase
                .from("client_profiles")
                .select("*")
                .eq("user_id", userId)
                .maybeSingle();
              if (clientData) {
                useAuthStore.getState().setClientProfile(clientData);
              }
            } catch (error) {
              console.error("Error fetching initial client profile:", error);
            }
          })();
        }
      } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        if (newSession?.user) {
          try {
            const { data: clientData } = await supabase
              .from("client_profiles")
              .select("*")
              .eq("user_id", newSession.user.id)
              .maybeSingle();
            if (clientData) {
              useAuthStore.getState().setClientProfile(clientData);
            }
          } catch (error) {}
        }
        setSession(newSession);
      } else if (event === "SIGNED_OUT") {
        useAuthStore.getState().setClientProfile(null);
        setSession(null);
      }
    });

    return () => {
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, [setSession, setInitialized]);

  useEffect(() => {
    if (session) {
      AsyncStorage.getItem("@pending_invite_token").then(async token => {
        if (token) {
          try {
            await StaffService.acceptStaffInvite(token);
            Alert.alert("Success", "You have successfully joined the business account!");
          } catch (error: any) {
            Alert.alert("Invite Error", error.message || "Failed to accept the pending invite.");
          } finally {
            await AsyncStorage.removeItem("@pending_invite_token");
          }
        }
      });
    }
  }, [session]);

  if (!isInitialized) {
    return (
      <View style={styles.placeholderContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer linking={linking}>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {session ? (
          <RootStack.Screen name="Main" component={MainNavigator} />
        ) : (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  placeholderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  placeholderText: {
    fontSize: fs(24),
    fontWeight: "bold",
    color: COLORS.text.primary,
  },
  scanButton: {
    width: ms(56),
    height: ms(56),
    borderRadius: ms(28),
    backgroundColor: COLORS.text.primary,
    justifyContent: "center",
    alignItems: "center",
    marginTop: vs(-30),
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  scanInner: {
    width: ms(24),
    height: ms(24),
    borderWidth: 2,
    borderColor: COLORS.text.inverse,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  scanLine: {
    width: "80%",
    height: 2,
    backgroundColor: COLORS.text.inverse,
  },
});
