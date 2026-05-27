// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import { useState, useEffect, useCallback } from "react";
import { FinanceService } from "../services/finance.service";

interface PayoutBreakdown {
  count: number;
  totalPaid: number;
  full: {
    count: number;
    total: number;
  };
  advance: {
    count: number;
    total: number;
  };
  commission: number;
  gateway: number;
  finalPayout: number;
  commissionRate: string;
}

/**
 * Hook to manage payout details state and data fetching.
 */
export const usePayoutDetails = (venueId: string, startDate: string, endDate: string) => {
  const [breakdown, setBreakdown] = useState<PayoutBreakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBreakdown = useCallback(async () => {
    if (!venueId || !startDate || !endDate) return;

    setLoading(true);
    setError(null);

    try {
      const data = await FinanceService.getPayoutDetailsBreakdown(venueId, startDate, endDate);
      setBreakdown(data);
    } catch (err: any) {
      console.error("Payout breakdown fetch error:", err);
      setError(err.message || "Failed to fetch payout breakdown");
    } finally {
      setLoading(false);
    }
  }, [venueId, startDate, endDate]);

  useEffect(() => {
    fetchBreakdown();
  }, [fetchBreakdown]);

  return { breakdown, loading, error, refetch: fetchBreakdown };
};
