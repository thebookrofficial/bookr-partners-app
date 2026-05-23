import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { EventScanScreen } from "@/features/event/screens/EventScanScreen";
import { supabase } from "@/lib/supabase";
import { Camera } from "react-native-camera-kit";
import jsqr from "jsqr";
import Jimp from "jimp";
// @ts-ignore
import path from "path";
// @ts-ignore
import fs from "fs";
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
  it("should successfully decode the QR code from the test image and trigger handleCodeScanned", async () => {
    // 1. Decode the QR code from the provided image file
    // @ts-ignore
    const imagePath = path.resolve(__dirname, "test-qr-code-image.png");
    
    if (!fs.existsSync(imagePath)) {
      throw new Error(`Test image not found at ${imagePath}`);
    }

    // Use Jimp to read the image and decode the QR code
    const image = await Jimp.read(imagePath);
    const { data, width, height } = image.bitmap;
    const qrCode = jsqr(new Uint8ClampedArray(data), width, height);

    if (!qrCode) {
      throw new Error("Could not decode QR code from the provided image.");
    }

    const decodedPayload = qrCode.data;
    console.log("Decoded QR Payload:", decodedPayload);

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
        name: "Test User" 
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
    
    // Trigger the onReadCode event with the decoded payload
    fireEvent(camera, "readCode", {
      nativeEvent: { codeStringValue: decodedPayload }
    });

    // 6. Verify that supabase was queried with the decoded token
    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith("event_bookings");
    });

    // Verify that it navigated to the confirmation screen
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("EventScanConfirmation", expect.objectContaining({
        attendee: expect.objectContaining({
          name: "Test User"
        })
      }));
    });

    console.log("Test Passed: QR Code from image successfully scanned and navigated to confirmation screen.");
  });
});
