import { FinanceService } from "../services/finance.service";
import { SportsPayoutStrategy } from "../services/strategies/sports.payout.strategy";
import { StaycationPayoutStrategy } from "../services/strategies/staycation.payout.strategy";
import { supabase } from "@/lib/supabase";

jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: jest.fn(),
    rpc: jest.fn(),
  },
}));

describe("FinanceService Payout Logic", () => {
  const mockVenueId = "venue-123";

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock for venue vertical
    (supabase.from as jest.Mock).mockImplementation(table => {
      if (table === "venues") {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { vertical: "sports" },
            error: null,
          }),
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };
    });
  });

  it("should accurately calculate Turf Full Payment payout", async () => {
    // Turf: 800 price, 3.5% commission (28), 2% gateway (16) -> 756 payout
    const mockRawData = [
      {
        id: "b1",
        paid_amount: 800,
        subtotal: 800, // Added subtotal
        total_amount: 800,
        payment_type: "full",
        date: "2026-05-28",
        sports_type: "Football",
        booking_status: "confirmed",
      },
    ];

    jest.spyOn(SportsPayoutStrategy, "getBreakdownRawData").mockResolvedValue(mockRawData as any);

    const breakdown = await FinanceService.getPayoutDetailsBreakdown(
      mockVenueId,
      "2026-05-28",
      "2026-05-28",
    );

    expect(breakdown.commission).toBe(28);
    expect(breakdown.gateway).toBe(16);
    expect(breakdown.finalPayout).toBe(756);
    expect(breakdown.count).toBe(1);
  });

  it("should calculate commission on TOTAL price for Advance Payment", async () => {
    // Turf Advance: 200 subtotal (money swiped), 1000 total price.
    // Commission: 3.5% of 1000 = 35.
    // Gateway: 2% of 200 = 4.
    // Payout: 200 - 35 - 4 = 161.
    const mockRawData = [
      {
        id: "b3",
        paid_amount: 300,
        subtotal: 200, // strictly use subtotal
        total_amount: 1000,
        discount_amount: 100, // should be excluded
        payment_type: "advance",
        date: "2026-05-28",
        sports_type: "Cricket",
        booking_status: "confirmed",
      },
    ];

    jest.spyOn(SportsPayoutStrategy, "getBreakdownRawData").mockResolvedValue(mockRawData as any);

    const breakdown = await FinanceService.getPayoutDetailsBreakdown(
      mockVenueId,
      "2026-05-28",
      "2026-05-28",
    );

    expect(breakdown.commission).toBe(35);
    expect(breakdown.gateway).toBe(4);
    expect(breakdown.finalPayout).toBe(161);
  });

  it("should group multi-slot bookings correctly", async () => {
    // User books 2 slots of 500 each, pays 200 subtotal tied to first slot.
    const mockRawData = [
      {
        id: "b4-1",
        paid_amount: 200,
        subtotal: 200,
        total_amount: 500,
        payment_type: "advance",
        booking_group_id: "group-x",
        date: "2026-05-28",
        booking_status: "confirmed",
      },
      {
        id: "b4-2",
        paid_amount: 0,
        subtotal: 0,
        total_amount: 500,
        payment_type: "advance",
        booking_group_id: "group-x",
        date: "2026-05-28",
        booking_status: "confirmed",
      },
    ];

    jest.spyOn(SportsPayoutStrategy, "getBreakdownRawData").mockResolvedValue(mockRawData as any);

    const breakdown = await FinanceService.getPayoutDetailsBreakdown(
      mockVenueId,
      "2026-05-28",
      "2026-05-28",
    );

    expect(breakdown.count).toBe(1);
    expect(breakdown.totalPaid).toBe(200); // Should use sum of subtotals
    expect(breakdown.commission).toBe(35);
    expect(breakdown.finalPayout).toBe(161);
  });

  it("should calculate Staycation payout using Subtotal for gateway", async () => {
    // Mock vertical to staycation
    (supabase.from as jest.Mock).mockImplementation(table => {
      if (table === "venues") {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { vertical: "staycation" },
            error: null,
          }),
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };
    });

    // Staycation: 10100 main price.
    // Subtotal (Money Swiped) = 9900.
    // Commission (5%) = 10100 * 0.05 = 505.
    // Gateway (2% of Subtotal) = 9900 * 0.02 = 198.
    // Final Payout = 9900 - 505 - 198 = 9197.
    const mockRawData = [
      {
        id: "s1",
        paid_amount: 9900,
        subtotal: 9900,
        total_amount: 10100,
        discount_amount: 200, // excluded
        payment_type: "full",
        date: "2026-05-28",
        booking_status: "confirmed",
      },
    ];

    jest
      .spyOn(StaycationPayoutStrategy, "getBreakdownRawData")
      .mockResolvedValue(mockRawData as any);

    const breakdown = await FinanceService.getPayoutDetailsBreakdown(
      mockVenueId,
      "2026-05-28",
      "2026-05-28",
    );

    expect(breakdown.commission).toBe(505);
    expect(breakdown.gateway).toBe(198);
    expect(breakdown.finalPayout).toBe(9197);
  });

  it("should exclude non-confirmed/completed bookings", async () => {
    const mockRawData = [
      {
        id: "b_confirmed",
        paid_amount: 1000,
        subtotal: 1000,
        total_amount: 1000,
        payment_type: "full",
        booking_status: "confirmed",
        date: "2026-05-28",
      },
      {
        id: "b_pending",
        paid_amount: 1000,
        subtotal: 1000,
        total_amount: 1000,
        payment_type: "full",
        booking_status: "pending",
        date: "2026-05-28",
      },
    ];

    jest.spyOn(SportsPayoutStrategy, "getBreakdownRawData").mockResolvedValue(mockRawData as any);

    const breakdown = await FinanceService.getPayoutDetailsBreakdown(
      mockVenueId,
      "2026-05-28",
      "2026-05-28",
    );

    expect(breakdown.count).toBe(1);
    expect(breakdown.totalPaid).toBe(1000);
  });
});
