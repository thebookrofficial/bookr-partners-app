import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import { StaycationOfflineBookingSheet } from "../components/StaycationOfflineBookingSheet";
import { useCreateStaycationOfflineBooking } from "../hooks/useCreateStaycationOfflineBooking";

// Mock the hook
jest.mock("../hooks/useCreateStaycationOfflineBooking");

// Mock safe area context
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: jest.fn().mockReturnValue({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaProvider: ({ children }: any) => children,
}));

jest.mock("@/assets/icons/ic-tdesign-money.svg", () => "MoneySvg");

// Mock Supabase
jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue({
      data: {
        base_price_per_night: 5000,
        extra_guest_charge: 1000,
        standard_guest_count: 8,
        max_guests: 15,
        min_guests: 2,
        security_deposit_amount: 2000,
      },
      error: null,
    }),
  },
}));

// Mock debounce to avoid timer leakage
jest.mock("@/hooks/useDebounce", () => ({
  useDebounce: (value: any) => value,
}));

describe("StaycationOfflineBookingSheet", () => {
  const mockCreateBooking = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useCreateStaycationOfflineBooking as jest.Mock).mockReturnValue({
      createBooking: mockCreateBooking,
      isLoading: false,
    });
  });

  it("should render correctly when visible", async () => {
    const { getByText } = render(
      <StaycationOfflineBookingSheet
        visible={true}
        onClose={jest.fn()}
        venueId="test-venue-id"
        activeCategory="Farmhouse"
      />,
    );
    await act(async () => {
      await new Promise<void>(resolve => setTimeout(() => resolve(), 0));
    });
    expect(getByText("Add Bookings")).toBeTruthy();
    expect(getByText("BOOKING DETAILS")).toBeTruthy();
  });

  it("should trigger booking creation with correct params", async () => {
    mockCreateBooking.mockResolvedValueOnce(true);

    const { getByText, getByPlaceholderText } = render(
      <StaycationOfflineBookingSheet
        visible={true}
        onClose={jest.fn()}
        venueId="test-venue-id"
        activeCategory="Farmhouse"
      />,
    );
    await act(async () => {
      await new Promise<void>(resolve => setTimeout(() => resolve(), 0));
    });

    // Simulate entering customer details
    const mobileInput = getByPlaceholderText("Enter Mobile No");
    fireEvent.changeText(mobileInput, "9876543210");

    const nameInput = getByPlaceholderText("Enter customers name");
    fireEvent.changeText(nameInput, "John Doe");

    const totalInput = getByPlaceholderText("1000");
    fireEvent.changeText(totalInput, "5000");

    // Press Book Now
    const bookNowBtn = getByText("BOOK NOW");
    fireEvent.press(bookNowBtn);

    await waitFor(() => {
      expect(mockCreateBooking).toHaveBeenCalled();
    });

    const callArgs = mockCreateBooking.mock.calls[0][0];
    expect(callArgs.guestPhone).toBe("9876543210");
    expect(callArgs.guestName).toBe("John Doe");
    expect(callArgs.bookingType).toBe("farmhouse");
  });

  it("should validate missing inputs before booking", async () => {
    const { getByText } = render(
      <StaycationOfflineBookingSheet
        visible={true}
        onClose={jest.fn()}
        venueId="test-venue-id"
        activeCategory="Farmhouse"
      />,
    );
    await act(async () => {
      await new Promise<void>(resolve => setTimeout(() => resolve(), 0));
    });

    // Press Book Now without entering phone/name
    const bookNowBtn = getByText("BOOK NOW");
    fireEvent.press(bookNowBtn);

    // createOfflineBooking should NOT be called
    await waitFor(() => {
      expect(mockCreateBooking).not.toHaveBeenCalled();
    });
  });

  it("should handle booking API failure gracefully", async () => {
    mockCreateBooking.mockResolvedValueOnce({ success: false, error: new Error("API Error") });

    const { getByText, getByPlaceholderText } = render(
      <StaycationOfflineBookingSheet
        visible={true}
        onClose={jest.fn()}
        venueId="test-venue-id"
        activeCategory="Farmhouse"
      />,
    );
    await act(async () => {
      await new Promise<void>(resolve => setTimeout(() => resolve(), 0));
    });

    fireEvent.changeText(getByPlaceholderText("Enter Mobile No"), "9876543210");
    fireEvent.changeText(getByPlaceholderText("Enter customers name"), "John Doe");
    fireEvent.changeText(getByPlaceholderText("1000"), "5000");

    const bookNowBtn = getByText("BOOK NOW");
    fireEvent.press(bookNowBtn);

    await waitFor(() => {
      expect(mockCreateBooking).toHaveBeenCalled();
    });

    // Test passes if it handles the rejection without crashing
  });
});
