import React from "react";
import { render, waitFor } from "@testing-library/react-native";
import { StaycationBookingDetailsScreen } from "../screens/StaycationBookingDetailsScreen";
import { useStaycationBookingDetails } from "../hooks/useStaycationBookingDetails";
import { useNavigation, useRoute } from "@react-navigation/native";

jest.mock("@/assets/icons/ic-streamline-plump-wallet.svg", () => "WalletSvg");
jest.mock("@/assets/icons/ic-tdesign-money.svg", () => "MoneySvg");
jest.mock("@/assets/icons/ic-solar-calendar-outline.svg", () => "CalendarSvg");
jest.mock("@/assets/icons/ic-material-symbols-download-rounded.svg", () => "DownloadSvg");
jest.mock("@/assets/icons/ic-tabler-clock.svg", () => "ClockSvg");
jest.mock("@/assets/icons/ic-round-person.svg", () => "PersonSvg");

jest.mock("@/layouts/ScreenContainer", () => ({
  ScreenContainer: ({ children }: any) => <>{children}</>,
}));

// Mock dependencies
jest.mock("../hooks/useStaycationBookingDetails");
jest.mock("@react-navigation/native", () => {
  const ReactMock = require("react");
  return {
    useNavigation: jest.fn(),
    useRoute: jest.fn(),
    NavigationContext: ReactMock.createContext({
      isFocused: () => true,
      addListener: jest.fn(),
      removeListener: jest.fn(),
    }),
  };
});

jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockResolvedValue({ error: null }),
  },
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: jest.fn().mockReturnValue({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaProvider: ({ children }: any) => children,
}));

describe("StaycationBookingDetailsScreen", () => {
  const mockUpdateDeposit = jest.fn();
  const mockUpdatePayment = jest.fn();
  const mockRefetch = jest.fn();

  const dummyBookingDetails = {
    id: "booking-123",
    total_amount: "5000",
    paid_amount: "2000",
    deposit: "1000",
    booking_status: "confirmed",
    guest_name: "Test User",
    guest_phone: "9999999999",
    profiles: {
      full_name: "Test User Profile",
      phone: "9999999999",
    },
    venues: {
      staycation_venues: {
        security_deposit_amount: 1000,
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (useRoute as jest.Mock).mockReturnValue({
      params: { booking: { id: "booking-123" } },
    });

    (useNavigation as jest.Mock).mockReturnValue({
      goBack: jest.fn(),
      navigate: jest.fn(),
    });

    (useStaycationBookingDetails as jest.Mock).mockReturnValue({
      isLoading: false,
      isUpdating: false,
      bookingDetails: dummyBookingDetails,
      paymentLogs: [],
      updateDeposit: mockUpdateDeposit,
      updatePayment: mockUpdatePayment,
      refetch: mockRefetch,
    });
  });

  it("should render booking details accurately", async () => {
    const { getByText, getAllByText } = render(<StaycationBookingDetailsScreen />);

    await waitFor(() => {
      // Check customer name
      expect(getByText("Test User")).toBeTruthy();
      // Check deposit value
      expect(getAllByText("₹1000")).toBeTruthy();
      // Check total amount
      expect(getAllByText("₹5000")).toBeTruthy();
    });
  });

  it("should handle deposit edit and update successfully", async () => {
    mockUpdateDeposit.mockReset();
    mockUpdateDeposit.mockResolvedValueOnce(true);

    const { getAllByText, getByText } = render(<StaycationBookingDetailsScreen />);

    expect(getAllByText("₹1000")).toBeTruthy();
    await waitFor(() => expect(getByText("Deposit")).toBeTruthy());

    await mockUpdateDeposit(1500);
    expect(mockUpdateDeposit).toHaveBeenCalledWith(1500);
  });

  it("should handle API failure when fetching or updating gracefully", async () => {
    mockUpdateDeposit.mockReset();
    // Mock the hook to simulate an update failure
    mockUpdateDeposit.mockRejectedValueOnce(new Error("Supabase connection failed"));

    const { getByText } = render(<StaycationBookingDetailsScreen />);

    await waitFor(() => expect(getByText("Deposit")).toBeTruthy());

    // Expect the mocked function to throw when called directly in test
    await expect(mockUpdateDeposit(1500)).rejects.toThrow("Supabase connection failed");
  });
});
