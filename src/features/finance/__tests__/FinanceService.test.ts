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

  const createChainMock = (result: any = { data: null, error: null }) => {
    const chain: any = {
      select: jest.fn(),
      eq: jest.fn(),
      in: jest.fn(),
      not: jest.fn(),
      gte: jest.fn(),
      lte: jest.fn(),
      limit: jest.fn(),
      single: jest.fn(),
      maybeSingle: jest.fn(),
    };

    (Object.values(chain) as jest.Mock[]).forEach(fn => {
      if (fn !== chain.single && fn !== chain.maybeSingle) {
        fn.mockReturnValue(chain);
      }
    });

    chain.single.mockResolvedValue(result);
    chain.maybeSingle.mockResolvedValue(result);

    return chain;
  };

  const mockVenueVertical = (
    vertical: "sports" | "staycation",
    commissionPercentage = 5,
    gatewayPercentage = 2,
  ) => {
    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === "venues") {
        return createChainMock({
          data: { vertical },
          error: null,
        });
      }

      if (table === "sports_grounds") {
        return createChainMock({
          data: {
            commission_percentage: commissionPercentage,
            gateway_percentage: gatewayPercentage,
          },
          error: null,
        });
      }

      if (table === "staycation_venues") {
        return createChainMock({
          data: {
            commission_percentage: commissionPercentage,
            gateway_percentage: gatewayPercentage,
          },
          error: null,
        });
      }

      return createChainMock();
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockVenueVertical("sports", 3.5, 2);
  });

  it("should accurately calculate Turf Full Payment payout", async () => {
    const mockRawData = [
      {
        id: "b1",
        paid_amount: 800,
        subtotal: 800,
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
    const mockRawData = [
      {
        id: "b3",
        paid_amount: 300,
        subtotal: 200,
        total_amount: 1000,
        discount_amount: 100,
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
    expect(breakdown.totalPaid).toBe(200);
    expect(breakdown.commission).toBe(35);
    expect(breakdown.finalPayout).toBe(161);
  });

  it("should calculate Staycation payout using configured commission and gateway rates", async () => {
    mockVenueVertical("staycation", 5, 2);

    const mockRawData = [
      {
        id: "s1",
        paid_amount: 9900,
        subtotal: 9900,
        total_amount: 10100,
        discount_amount: 200,
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
