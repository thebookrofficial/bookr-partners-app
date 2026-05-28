import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { PayoutsScreen } from "../screens/PayoutsScreen";
import { PayoutDetailsScreen } from "../screens/PayoutDetailsScreen";
import * as usePayoutsHook from "../hooks/usePayouts";
import * as usePayoutDetailsHook from "../hooks/usePayoutDetails";
import { useServiceStore } from "@/store/serviceStore";

// Mock Navigation
const mockNavigate = jest.fn();
jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
  useRoute: () => ({
    params: {
      venueId: "venue-123",
      startDate: "2026-05-28",
      endDate: "2026-05-28",
      displayLabel: "28 May 2026",
    },
  }),
}));

// Mock Lucide Icons
jest.mock("lucide-react-native", () => ({
  Calendar: "Calendar",
  ChevronDown: "ChevronDown",
  ChevronUp: "ChevronUp",
}));

// Mock store
jest.mock("@/store/serviceStore", () => ({
  useServiceStore: jest.fn(),
}));

describe("Finance UI Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useServiceStore as unknown as jest.Mock).mockReturnValue({
      activeVenueName: "Test Venue",
    });
  });

  describe("PayoutsScreen", () => {
    it("should render pending and historical payouts", async () => {
      jest.spyOn(usePayoutsHook, "usePayouts").mockReturnValue({
        activeTab: "week",
        setActiveTab: jest.fn(),
        pendingPayouts: [{ date: "2026-05-27", amount: 756, count: 1, displayDate: "27 May 2026" }],
        historicalPayouts: [
          {
            payout_date: "2026-05-20",
            total_amount: 1500,
            booking_count: 2,
            display_label: "20 May - 26 May",
          },
        ],
        loading: false,
        error: null,
        refetch: jest.fn(),
      } as any);

      const { getByText, getAllByText } = render(<PayoutsScreen />);

      expect(getByText("+₹756")).toBeTruthy();
      expect(getAllByText("27 May 2026").length).toBeGreaterThan(0);
      expect(getByText("+₹1500")).toBeTruthy();
      expect(getByText("2")).toBeTruthy();
    });
  });

  describe("PayoutDetailsScreen", () => {
    it("should display correct breakdown for Turf Full Payment", async () => {
      // Mock data matching Turf Full Scenario
      const mockBreakdown = {
        count: 1,
        totalPaid: 800,
        full: { count: 1, total: 800 },
        advance: { count: 0, total: 0 },
        commission: 28,
        gateway: 16,
        finalPayout: 756,
        commissionRate: "3.5%",
      };

      jest.spyOn(usePayoutDetailsHook, "usePayoutDetails").mockReturnValue({
        breakdown: mockBreakdown,
        loading: false,
        error: null,
        refetch: jest.fn(),
      } as any);

      const { getByText, queryByText } = render(<PayoutDetailsScreen />);

      // Verify header and summary
      expect(getByText("28 May 2026")).toBeTruthy();
      expect(getByText("1 Bookings")).toBeTruthy();

      // Verify amounts
      expect(getByText("+₹800")).toBeTruthy();
      expect(getByText("-₹28")).toBeTruthy();
      expect(getByText("-₹16")).toBeTruthy();
      expect(getByText("₹756")).toBeTruthy();

      // Verify details (Full payments section is expanded by default)
      expect(getByText("1 Full payments")).toBeTruthy();

      // Commission section is collapsed by default
      expect(queryByText("Commission (3.5%)")).toBeNull();

      // Expand commission section
      fireEvent.press(getByText("Bookr fees"));
      expect(getByText("Commission")).toBeTruthy();
    });

    it("should display correct breakdown for Turf Advance Payment", async () => {
      // Mock data matching Turf Advance Scenario
      const mockBreakdown = {
        count: 1,
        totalPaid: 1000,
        full: { count: 0, total: 0 },
        advance: { count: 1, total: 1000 },
        commission: 35,
        gateway: 2,
        finalPayout: 63,
        commissionRate: "3.5%",
      };

      jest.spyOn(usePayoutDetailsHook, "usePayoutDetails").mockReturnValue({
        breakdown: mockBreakdown,
        loading: false,
        error: null,
        refetch: jest.fn(),
      } as any);

      const { getByText } = render(<PayoutDetailsScreen />);

      expect(getByText("+₹1000")).toBeTruthy();
      expect(getByText("-₹35")).toBeTruthy();
      expect(getByText("-₹2")).toBeTruthy();
      expect(getByText("₹63")).toBeTruthy();
      expect(getByText("1 Advance payments")).toBeTruthy();
    });
  });
});
