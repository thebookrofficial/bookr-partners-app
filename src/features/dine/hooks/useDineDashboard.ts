// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export type DashboardTab = "Today" | "Last week" | "This Month" | "This Year" | "Custom";

// Logic Constants: 5% Platform + 2% Gateway + 5% Vendor Discount = 12% total deduction
const PAYOUT_RATE = 0.88;

interface GraphItem {
  label: string;
  subLabel?: string;
  amount: string | null;
  rawAmount: number;
  active: boolean;
  percentage?: number;
}

interface WeekItem {
  id: string;
  label: string;
  dateRange: string;
  amount: string;
  rawAmount: number;
  active: boolean;
  details: any[];
  percentage?: number;
}

export const useDineDashboard = (serviceId: string) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<DashboardTab>("Today");
  const [customRange, setCustomRange] = useState<{ start: Date; end: Date } | null>(null);
  const [revenueData, setRevenueData] = useState<any>(null);
  const [venue, setVenue] = useState<any>(null);

  const getLocalDateString = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const fetchVenueDetails = useCallback(async () => {
    if (!serviceId) return;
    try {
      const { data } = await supabase
        .from("venues")
        .select("name, cover_image_url")
        .eq("id", serviceId)
        .single();
      if (data) setVenue(data);
    } catch (err) {
      console.error("Error fetching venue for dashboard:", err);
    }
  }, [serviceId]);

  const fetchRevenue = useCallback(async () => {
    if (!serviceId) {
      setLoading(false);
      return;
    }
    setLoading(true);

    try {
      const today = new Date();
      const todayStr = getLocalDateString(today);
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

      let query = supabase
        .from("dining_bookings")
        .select("bill_amount, created_at, reservation_date")
        .eq("venue_id", serviceId)
        .gt("bill_amount", 0);

      // Determine range
      let fetchStart: Date;
      if (activeTab === "Today") {
        fetchStart = new Date(startOfToday);
        fetchStart.setDate(fetchStart.getDate() - 6);
      } else if (activeTab === "Last week") {
        fetchStart = new Date(startOfToday);
        fetchStart.setDate(fetchStart.getDate() - 7);
      } else if (activeTab === "This Month") {
        fetchStart = new Date(today.getFullYear(), today.getMonth(), 1);
      } else if (activeTab === "This Year") {
        fetchStart = new Date(today.getFullYear(), 0, 1);
      } else if (activeTab === "Custom" && customRange) {
        fetchStart = customRange.start;
        const endDay = new Date(customRange.end);
        endDay.setHours(23, 59, 59, 999);
        query = query.lte("created_at", endDay.toISOString());
      } else {
        fetchStart = new Date(startOfToday);
      }

      query = query.gte("created_at", fetchStart.toISOString());
      const { data, error } = await query;
      if (error) throw error;

      const bookings = data || [];
      let result: any = {
        totalPayout: "+₹0",
        periodLabel: "",
        payoutLabel: "",
        graphTitle: "",
        graphData: [],
      };

      if (activeTab === "Today" || activeTab === "Last week" || activeTab === "Custom") {
        // Daily breakdown logic
        const daysToMap =
          activeTab === "Custom" && customRange
            ? Math.ceil(
                (customRange.end.getTime() - customRange.start.getTime()) / (1000 * 60 * 60 * 24),
              ) + 1
            : 7;

        const baseDate = activeTab === "Custom" && customRange ? customRange.start : startOfToday;

        const graphData: GraphItem[] = Array.from({ length: daysToMap }).map((_, i) => {
          const d = new Date(baseDate);
          if (activeTab === "Custom") d.setDate(d.getDate() + i);
          else d.setDate(d.getDate() - (6 - i));

          const dateStr = getLocalDateString(d);
          const dayBookings = bookings.filter(b => {
            const bDate = b.reservation_date || getLocalDateString(new Date(b.created_at));
            return bDate === dateStr;
          });
          const totalBill = dayBookings.reduce(
            (sum, b) => sum + (parseFloat(b.bill_amount) || 0),
            0,
          );
          const payout = totalBill * PAYOUT_RATE;
          const isToday = dateStr === todayStr;

          return {
            label: d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
            subLabel: isToday ? "Today" : undefined,
            amount: payout > 0 ? `+₹${payout.toFixed(0)}` : null,
            rawAmount: payout,
            active: isToday,
          };
        });

        const maxAmount = Math.max(...graphData.map(d => d.rawAmount), 1);
        graphData.forEach(d => (d.percentage = (d.rawAmount / maxAmount) * 100));

        const totalPeriod =
          activeTab === "Today"
            ? graphData.find(d => d.active)?.rawAmount || 0
            : graphData.reduce((sum, d) => sum + d.rawAmount, 0);

        result = {
          totalPayout: `+₹${totalPeriod.toLocaleString("en-IN")}`,
          periodLabel:
            activeTab === "Today"
              ? `Today, ${today.toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}`
              : `${graphData[0]?.label || ""} - ${graphData[graphData.length - 1]?.label || ""}`,
          payoutLabel: activeTab === "Today" ? "Total Payout Today" : "Total Payout Selection",
          graphTitle: "Revenue graph",
          graphData,
        };
      } else if (activeTab === "This Month") {
        // Weekly breakdown
        const weeks: WeekItem[] = [];
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        for (let i = 0; i < 5; i++) {
          const wStart = new Date(startOfMonth);
          wStart.setDate(1 + i * 7);
          if (wStart.getMonth() !== today.getMonth()) break;
          const wEnd = new Date(wStart);
          wEnd.setDate(wEnd.getDate() + 6);
          if (wEnd.getMonth() !== today.getMonth()) {
            wEnd.setTime(new Date(today.getFullYear(), today.getMonth() + 1, 0).getTime());
          }

          const weekBookings = bookings.filter(b => {
            const bDate = new Date(b.reservation_date || b.created_at);
            return bDate >= wStart && bDate <= wEnd;
          });
          const totalBill = weekBookings.reduce(
            (sum, b) => sum + (parseFloat(b.bill_amount) || 0),
            0,
          );
          const payout = totalBill * PAYOUT_RATE;

          const details = Array.from({ length: 7 })
            .map((_, j) => {
              const d = new Date(wStart);
              d.setDate(d.getDate() + j);
              if (d > wEnd) return null;
              const dStr = getLocalDateString(d);
              const dBookings = weekBookings.filter(
                b => (b.reservation_date || getLocalDateString(new Date(b.created_at))) === dStr,
              );
              const dPayout =
                dBookings.reduce((sum, b) => sum + (parseFloat(b.bill_amount) || 0), 0) *
                PAYOUT_RATE;
              return {
                label: d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
                amount: dPayout > 0 ? `+₹${dPayout.toFixed(0)}` : null,
                rawAmount: dPayout,
              };
            })
            .filter(Boolean);

          const maxD = Math.max(...(details as any[]).map(d => d.rawAmount), 1);
          details.forEach((d: any) => (d.percentage = (d.rawAmount / maxD) * 100));

          weeks.push({
            id: `w${i + 1}`,
            label: `Week ${i + 1}`,
            dateRange: `${wStart.getDate()} - ${wEnd.getDate()} ${wEnd.toLocaleDateString("en-GB", {
              month: "short",
            })}`,
            amount: `+₹${payout.toFixed(0)}`,
            rawAmount: payout,
            active: today >= wStart && today <= wEnd,
            details,
          });
        }
        const maxW = Math.max(...weeks.map(w => w.rawAmount), 1);
        weeks.forEach(w => (w.percentage = (w.rawAmount / maxW) * 100));
        result = {
          totalPayout: `+₹${weeks
            .reduce((sum, w) => sum + w.rawAmount, 0)
            .toLocaleString("en-IN")}`,
          periodLabel: today.toLocaleDateString("en-GB", { month: "long", year: "numeric" }),
          payoutLabel: "Total Payout This month",
          graphTitle: "Revenue Graph This Month",
          weeks,
        };
      } else if (activeTab === "This Year") {
        const months = [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ];
        const graphData: GraphItem[] = months.map((m, i) => {
          const monthBookings = bookings.filter(
            b => new Date(b.reservation_date || b.created_at).getMonth() === i,
          );
          const payout =
            monthBookings.reduce((sum, b) => sum + (parseFloat(b.bill_amount) || 0), 0) *
            PAYOUT_RATE;
          return {
            label: m,
            subLabel: today.getMonth() === i ? "Today" : undefined,
            amount: payout > 0 ? `+₹${(payout / 1000).toFixed(1)}K` : null,
            rawAmount: payout,
            active: today.getMonth() === i,
          };
        });
        const maxM = Math.max(...graphData.map(d => d.rawAmount), 1);
        graphData.forEach(d => (d.percentage = (d.rawAmount / maxM) * 100));
        result = {
          totalPayout: `+₹${graphData
            .reduce((sum, d) => sum + d.rawAmount, 0)
            .toLocaleString("en-IN")}`,
          periodLabel: `Year ${today.getFullYear()}`,
          payoutLabel: "Total Payout This Year",
          graphTitle: "Revenue Graph This Year",
          graphData,
        };
      }
      setRevenueData(result);
    } catch (err) {
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  }, [serviceId, activeTab, customRange]);

  useEffect(() => {
    fetchVenueDetails();
    fetchRevenue();
  }, [fetchRevenue, fetchVenueDetails, serviceId]);

  return {
    loading,
    activeTab,
    setActiveTab,
    revenueData,
    venue,
    setCustomRange,
    refresh: fetchRevenue,
  };
};
