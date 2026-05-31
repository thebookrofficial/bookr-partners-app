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
  const [customStartDate, setCustomStartDate] = useState<Date>(new Date());
  const [customEndDate, setCustomEndDate] = useState<Date>(new Date());
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
      let startDateStr = "";
      let endDateStr = "";
      let interval: "day" | "week" | "month" = "day";

      if (activeTab.toLowerCase() === "custom") {
        startDateStr = customStartDate.toISOString().split("T")[0];
        endDateStr = customEndDate.toISOString().split("T")[0];
        interval = "day";
      } else {
        // Set startDate to May 1st, 2026 to ensure all May bookings are shown
        const startDate = new Date(2026, 4, 1); // Month is 0-indexed, so 4 is May
        startDateStr = startDate.toISOString().split("T")[0];

        // For the current interval (week/month), we want to include all future bookings
        // within that interval so the summary matches the detail breakdown.
        let endDate = new Date(now);
        if (activeTab.toLowerCase() === "week") {
          const day = now.getDay();
          const diff = day === 0 ? 0 : 7 - day;
          endDate.setDate(now.getDate() + diff);
          interval = "week";
        } else if (activeTab.toLowerCase() === "month") {
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          interval = "month";
        } else if (activeTab.toLowerCase() === "day") {
          interval = "day";
        }
        endDateStr = endDate.toISOString().split("T")[0];
      }

      let historical = await FinanceService.getAggregatedPayouts({
        venueId,
        startDate: startDateStr,
        endDate: endDateStr,
        interval,
      });

      // 3. Filter out ongoing periods (Day, Week, Month) and Pending dates
      if (historical?.length > 0) {
        const today = new Date();
        const tab = activeTab.toLowerCase();
        const pendingDates = pending.map(p => p.date);
        const todayStr = today.toISOString().split("T")[0];

        if (tab === "day" || tab === "custom") {
          historical = historical.filter((item: PayoutItem) => {
            return item.payout_date !== todayStr && !pendingDates.includes(item.payout_date);
          });
        } else if (tab === "week") {
          const dayOfWeek = today.getDay();
          const currentWeekStart = new Date(today);
          currentWeekStart.setDate(today.getDate() - dayOfWeek);
          currentWeekStart.setHours(0, 0, 0, 0);

          historical = historical.filter((item: PayoutItem) => {
            const itemDate = new Date(item.payout_date);
            return itemDate.getTime() < currentWeekStart.getTime();
          });
        } else if (tab === "month") {
          const currentYear = today.getFullYear();
          const currentMonth = today.getMonth();

          historical = historical.filter((item: PayoutItem) => {
            const itemDate = new Date(item.payout_date);
            const itemYear = itemDate.getFullYear();
            const itemMonth = itemDate.getMonth();

            // Only show months that are strictly before the current year/month
            return itemYear < currentYear || (itemYear === currentYear && itemMonth < currentMonth);
          });
        }
      }

      setHistoricalPayouts(historical || []);
    } catch (err: any) {
      console.error("Payout fetch error:", err);
      setError(err.message || "Failed to fetch payout data");
    } finally {
      setLoading(false);
    }
  }, [venueId, activeTab, customStartDate, customEndDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    activeTab,
    setActiveTab,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    pendingPayouts,
    historicalPayouts,
    loading,
    error,
    refetch: fetchData,
  };
};
