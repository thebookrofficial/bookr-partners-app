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
  ArrowLeft: "ArrowLeft",
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
        pendingPayouts: [
          { date: "2026-05-27", amount: 756.25, count: 1, displayDate: "27 May 2026" },
        ],
        historicalPayouts: [
          {
            payout_date: "2026-05-20",
            total_amount: 1500.5,
            booking_count: 2,
            display_label: "20 May - 26 May",
          },
        ],
        loading: false,
        error: null,
        refetch: jest.fn(),
      } as any);

      const { getByText, getAllByText } = render(<PayoutsScreen />);

      expect(getByText("+₹756.25")).toBeTruthy();
      expect(getAllByText("27 May 2026").length).toBeGreaterThan(0);
      expect(getByText("+₹1500.50")).toBeTruthy();
      expect(getByText("2")).toBeTruthy();
    });
  });

  describe("PayoutDetailsScreen", () => {
    it("should display correct breakdown with 2 decimal places", async () => {
      // Mock data matching precise decimal Scenario
      const mockBreakdown = {
        count: 1,
        totalPaid: 800.75,
        full: { count: 1, total: 800.75 },
        advance: { count: 0, total: 0 },
        commission: 28.02,
        gateway: 16.01,
        finalPayout: 756.72,
        commissionRate: "3.5%",
      };

      jest.spyOn(usePayoutDetailsHook, "usePayoutDetails").mockReturnValue({
        breakdown: mockBreakdown,
        loading: false,
        error: null,
        refetch: jest.fn(),
      } as any);

      const { getByText, getAllByText } = render(<PayoutDetailsScreen />);

      // Verify amounts with 2 decimals
      expect(getByText("+₹800.75")).toBeTruthy();
      expect(getAllByText("-₹28.02").length).toBe(1); // One in collapsed header

      // Expand commission section
      fireEvent.press(getByText("Bookr fees"));
      expect(getByText("bookr commission fees")).toBeTruthy();
      expect(getAllByText("-₹28.02").length).toBe(2); // One in header, one in detail row
    });
  });
});
