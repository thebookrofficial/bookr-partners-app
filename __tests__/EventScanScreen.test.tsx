import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { EventScanScreen } from "@/features/event/screens/EventScanScreen";
import { supabase } from "@/lib/supabase";
import { PermissionsAndroid, Alert } from "react-native";

// Mock Navigation
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockAddListener = jest.fn(() => jest.fn());

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
    addListener: mockAddListener,
    getParent: jest.fn(() => ({
      getState: jest.fn(() => ({ routes: [] })),
    })),
  }),
  useRoute: () => ({
    params: { serviceId: "test-service-id" },
  }),
  useIsFocused: () => true,
  useFocusEffect: jest.fn(callback => {
    jest.requireActual("react").useEffect(() => {
      callback();
    }, []);
  }),
}));

// Mock Lucide Icons
jest.mock("lucide-react-native", () => ({
  Phone: "Phone",
  X: "X",
  Camera: "CameraIcon",
  ArrowLeft: "ArrowLeft",
}));

// Mock PermissionsAndroid
jest.spyOn(PermissionsAndroid, "request").mockResolvedValue(PermissionsAndroid.RESULTS.GRANTED);

// Mock Alert
jest.spyOn(Alert, "alert");

describe("EventScanScreen QR Code Test", () => {
  it("should successfully trigger handleCodeScanned with a mock payload", async () => {
    // Use a hardcoded mock QR payload
    const decodedPayload = "test-qr-payload-token";

    // 2. Mock Supabase responses for event fetch and booking fetch
    const mockMaybeSingleEvent = jest.fn().mockResolvedValue({
      data: { id: "event-1", event_passes: [], event_zones: [] },
      error: null,
    });

    const mockMaybeSingleBooking = jest.fn().mockResolvedValue({
      data: {
        id: "booking-1",
        booking_status: "pending",
        ticketType: "VIP",
        name: "Test User",
      },
      error: null,
    });

    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === "events") {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          maybeSingle: mockMaybeSingleEvent,
        };
      }
      if (table === "event_bookings") {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: mockMaybeSingleBooking,
          order: jest.fn().mockReturnThis(),
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: [], error: null }),
      };
    });

    // 3. Render the component
    const screen = render(<EventScanScreen />);

    // Wait for the initial fetch to complete
    await waitFor(() => expect(supabase.from).toHaveBeenCalledWith("events"));

    // 4. Open the scanner
    const scanButton = screen.getByText("Open Scanner");
    fireEvent.press(scanButton);

    // 5. Find the Camera and simulate onReadCode
    // Wait for the camera to appear after scanning mode is enabled
    const camera = await screen.findByTestId("camera-view");

    // Trigger the onReadCode event with the mock payload
    fireEvent(camera, "readCode", {
      nativeEvent: { codeStringValue: decodedPayload },
    });

    // 6. Verify that supabase was queried with the decoded token
    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith("event_bookings");
    });

    // Verify that it navigated to the confirmation screen
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        "EventScanConfirmation",
        expect.objectContaining({
          attendee: expect.objectContaining({
            name: "Test User",
          }),
        }),
      );
    });
  });
});
