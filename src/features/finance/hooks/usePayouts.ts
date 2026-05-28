// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import { useState, useEffect, useCallback } from "react";
import { FinanceService } from "../services/finance.service";

interface PayoutItem {
  payout_date: string;
  total_amount: number;
  booking_count: number;
  display_label: string;
}

interface PendingPayout {
  date: string;
  amount: number;
  count: number;
  displayDate: string;
}

/**
 * Hook to manage payout state and data fetching for the Payouts screen.
 */
export const usePayouts = (venueId: string) => {
  const [activeTab, setActiveTab] = useState("week");
  const [pendingPayouts, setPendingPayouts] = useState<PendingPayout[]>([]);
  const [historicalPayouts, setHistoricalPayouts] = useState<PayoutItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!venueId) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Fetch Pending Payouts (Still uses T-1 and T-2 logic)
      const pending = await FinanceService.getPendingPayouts(venueId);
      setPendingPayouts(pending);

      // 2. Determine Date Range for Historical Payouts
      const now = new Date();
      // Set startDate to May 1st, 2026 to ensure all May bookings are shown
      const startDate = new Date(2026, 4, 1); // Month is 0-indexed, so 4 is May

      // For the current interval (week/month), we want to include all future bookings
      // within that interval so the summary matches the detail breakdown.
      let endDate = new Date(now);
      if (activeTab.toLowerCase() === "week") {
        const day = now.getDay();
        const diff = day === 0 ? 0 : 7 - day;
        endDate.setDate(now.getDate() + diff);
      } else if (activeTab.toLowerCase() === "month") {
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      }

      let interval: "day" | "week" | "month" = "day";

      switch (activeTab.toLowerCase()) {
        case "day":
          interval = "day";
          break;
        case "week":
          interval = "week";
          break;
        case "month":
          interval = "month";
          break;
        case "custom":
          interval = "day";
          break;
      }

      const historical = await FinanceService.getAggregatedPayouts({
        venueId,
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
        interval,
      });

      setHistoricalPayouts(historical || []);
    } catch (err: any) {
      console.error("Payout fetch error:", err);
      setError(err.message || "Failed to fetch payout data");
    } finally {
      setLoading(false);
    }
  }, [venueId, activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    activeTab,
    setActiveTab,
    pendingPayouts,
    historicalPayouts,
    loading,
    error,
    refetch: fetchData,
  };
};
