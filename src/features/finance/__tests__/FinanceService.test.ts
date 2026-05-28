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
        total_amount: 800,
        payment_type: "full",
        date: "2026-05-28",
        sports_type: "Football",
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

  it("should accurately calculate Pickleball Full Payment payout with 2 decimals", async () => {
    // Pickleball: 500 price, 3.5% commission (17.5), 1.5% gateway (7.5) -> 475 payout
    const mockRawData = [
      {
        id: "b2",
        paid_amount: 500,
        total_amount: 500,
        payment_type: "full",
        date: "2026-05-28",
        sports_type: "Pickleball",
      },
    ];

    jest.spyOn(SportsPayoutStrategy, "getBreakdownRawData").mockResolvedValue(mockRawData as any);

    const breakdown = await FinanceService.getPayoutDetailsBreakdown(
      mockVenueId,
      "2026-05-28",
      "2026-05-28",
    );

    // Math: 500 * 0.035 = 17.5, 500 * 0.015 = 7.5. 500 - 17.5 - 7.5 = 475.
    expect(breakdown.commission).toBe(17.5);
    expect(breakdown.gateway).toBe(7.5);
    expect(breakdown.finalPayout).toBe(475);
  });

  it("should accurately calculate Turf Advance Payment payout with 2 decimals", async () => {
    // Turf Advance: 100 paid, 0 discount.
    // Commission: 3.5% of 100 = 3.5.
    // Gateway: 2% of 100 = 2.
    // Payout: 100 - 3.5 - 2 = 94.5.
    const mockRawData = [
      {
        id: "b3",
        paid_amount: 100,
        total_amount: 1000,
        discount_amount: 0,
        payment_type: "advance",
        date: "2026-05-28",
        sports_type: "Cricket",
      },
    ];

    jest.spyOn(SportsPayoutStrategy, "getBreakdownRawData").mockResolvedValue(mockRawData as any);

    const breakdown = await FinanceService.getPayoutDetailsBreakdown(
      mockVenueId,
      "2026-05-28",
      "2026-05-28",
    );

    expect(breakdown.commission).toBe(3.5);
    expect(breakdown.gateway).toBe(2);
    expect(breakdown.finalPayout).toBe(94.5);
  });

  it("should accurately calculate commission on Gross Collection (8600 scenario)", async () => {
    // Gross Collection = 8600.
    // If Paid = 8371 and Discount = 229 -> Base is 8600.
    // Commission (3.5%) = 301.
    const mockRawData = [
      {
        id: "b4",
        paid_amount: 8371,
        total_amount: 8600,
        discount_amount: 229,
        payment_type: "full",
        date: "2026-05-28",
        sports_type: "Football",
      },
    ];

    jest.spyOn(SportsPayoutStrategy, "getBreakdownRawData").mockResolvedValue(mockRawData as any);

    const breakdown = await FinanceService.getPayoutDetailsBreakdown(
      mockVenueId,
      "2026-05-28",
      "2026-05-28",
    );

    expect(breakdown.commission).toBe(301);
    expect(breakdown.gateway).toBe(Number((8371 * 0.02).toFixed(2))); // 167.42
    expect(breakdown.finalPayout).toBe(Number((8371 - 301 - 8371 * 0.02).toFixed(2))); // 7902.58
  });

  it("should calculate Staycation payout using Gross Collection for gateway fee", async () => {
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

    // Staycation: 10100 main price (9900 paid + 200 discount).
    // Commission (5%) = 10100 * 0.05 = 505.
    // Gateway (2%) = 10100 * 0.02 = 202. (Staycation logic)
    // Final Payout = 9900 - 505 - 202 = 9193.
    const mockRawData = [
      {
        id: "s1",
        paid_amount: 9900,
        total_amount: 10100,
        discount_amount: 200,
        payment_type: "full",
        date: "2026-05-28",
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
    expect(breakdown.gateway).toBe(202);
    expect(breakdown.finalPayout).toBe(9193);
  });
});
