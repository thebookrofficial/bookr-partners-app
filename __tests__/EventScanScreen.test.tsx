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
  Image: "ImageIcon",
  Flashlight: "Flashlight",
  FlashlightOff: "FlashlightOff",
  Search: "Search",
}));

// Mock PermissionsAndroid
jest.spyOn(PermissionsAndroid, "request").mockResolvedValue(PermissionsAndroid.RESULTS.GRANTED);

// Mock Alert
jest.spyOn(Alert, "alert");

describe("EventScanScreen QR Code Test", () => {
  it("should successfully trigger handleCodeScanned with a mock payload", async () => {
    // Use a hardcoded mock QR payload
    const decodedPayload = "test-qr-payload-token";

    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === "events") {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          then: jest.fn(resolve =>
            resolve({
              data: [
                {
                  id: "event-1",
                  title: "Neon Shadow",
                  created_at: new Date().toISOString(),
                  event_passes: [],
                  event_zones: [],
                },
              ],
              error: null,
            }),
          ),
        };
      }
      if (table === "event_bookings") {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          in: jest.fn().mockReturnThis(),
          update: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({
            data: {
              id: "booking-1",
              booking_status: "pending",
              ticketType: "VIP",
              name: "Test User",
              ticket_count: 1,
              event_passes: [{ name: "VIP" }],
            },
            error: null,
          }),
          then: jest.fn(resolve => resolve({ data: [], error: null })),
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
        then: jest.fn(resolve => resolve({ data: [], error: null })),
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
  }, 15000);
});
