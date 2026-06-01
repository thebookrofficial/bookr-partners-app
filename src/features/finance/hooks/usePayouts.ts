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
const getLocalISODate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

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
        startDateStr = getLocalISODate(customStartDate);
        endDateStr = getLocalISODate(customEndDate);
        interval = "day";
      } else {
        // Set startDate to May 1st, 2026 to ensure all May bookings are shown
        const startDate = new Date(2026, 4, 1); // Month is 0-indexed, so 4 is May
        startDateStr = getLocalISODate(startDate);

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
        endDateStr = getLocalISODate(endDate);
      }

      let historical = await FinanceService.getAggregatedPayouts({
        venueId,
        startDate: startDateStr,
        endDate: endDateStr,
        interval,
      });

      // 3. Filter out ongoing periods and pending dates based on user requirements
      if (historical?.length > 0) {
        const today = new Date();
        const todayStr = getLocalISODate(today);
        const tab = activeTab.toLowerCase();
        const pendingDates = pending.map(p => p.date);

        if (tab === "day" || tab === "custom") {
          // Hide Today (ongoing) and Pending (shown at top)
          historical = historical.filter((item: PayoutItem) => {
            return item.payout_date !== todayStr && !pendingDates.includes(item.payout_date);
          });
        } else if (tab === "week") {
          // Hide the current week. Only show fully completed previous weeks.
          // Assuming week starts on Monday for business logic.
          const dayOfWeek = today.getDay();
          const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

          const currentWeekStart = new Date(today);
          currentWeekStart.setDate(today.getDate() - daysSinceMonday);
          currentWeekStart.setHours(0, 0, 0, 0);

          historical = historical.filter((item: PayoutItem) => {
            const itemDate = new Date(item.payout_date);
            // Hide if the week's start date is >= the current week's start date
            return itemDate.getTime() < currentWeekStart.getTime();
          });
        } else if (tab === "month") {
          // Hide the current month AND any month that still has pending payouts
          const currentYear = today.getFullYear();
          const currentMonth = today.getMonth();

          historical = historical.filter((item: PayoutItem) => {
            const itemDate = new Date(item.payout_date);
            const itemYear = itemDate.getFullYear();
            const itemMonth = itemDate.getMonth();

            // Check if this month is the current ongoing month
            if (itemYear === currentYear && itemMonth === currentMonth) {
              return false; // Hide current month
            }

            // Check if any of the pending dates fall within this month
            const hasPendingInMonth = pendingDates.some(pDateStr => {
              const pDate = new Date(pDateStr);
              return pDate.getFullYear() === itemYear && pDate.getMonth() === itemMonth;
            });

            if (hasPendingInMonth) {
              return false; // Hide this month because it's not fully settled yet
            }

            return true;
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
