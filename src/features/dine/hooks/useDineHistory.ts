// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { DineDateFilterOption } from "../components/DineFilterBottomSheet";

export interface DineHistoryItem {
  id: string;
  name: string;
  phone: string;
  amount: string;
  type: string;
  typeColor: string;
  amountColor: string;
  time: string;
  status: "Online" | "Offline";
}

export interface DineHistoryGroup {
  date: string;
  settlement: string;
  data: DineHistoryItem[];
}

export const useDineHistory = (serviceId: string) => {
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<DineDateFilterOption>("all");
  const [customRange, setCustomRange] = useState<{ start: Date; end: Date } | undefined>(undefined);
  const [historyGroups, setHistoryGroups] = useState<DineHistoryGroup[]>([]);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("dining_bookings")
        .select(
          `
          id,
          reservation_date,
          reservation_time,
          paid_amount,
          guest_name,
          guest_phone,
          profiles (
            full_name,
            phone
          )
        `,
        )
        .eq("venue_id", serviceId)
        .order("reservation_date", { ascending: false });

      // Apply Date Filters
      if (filter === "3_months") {
        const d = new Date();
        d.setMonth(d.getMonth() - 3);
        query = query.gte("reservation_date", d.toISOString().split("T")[0]);
      } else if (filter === "9_months") {
        const d = new Date();
        d.setMonth(d.getMonth() - 9);
        query = query.gte("reservation_date", d.toISOString().split("T")[0]);
      } else if (filter === "custom" && customRange) {
        query = query
          .gte("reservation_date", customRange.start.toISOString().split("T")[0])
          .lte("reservation_date", customRange.end.toISOString().split("T")[0]);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Group by date
      const grouped: Record<string, DineHistoryItem[]> = {};
      const settlementTotals: Record<string, number> = {};

      (data || []).forEach((b: any) => {
        const resDate = new Date(b.reservation_date);
        const dateStr = resDate.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });

        const profiles = Array.isArray(b.profiles) ? b.profiles[0] : b.profiles;
        const isOffline = Boolean(b.guest_name && b.guest_name.trim() !== "");
        const name = isOffline ? b.guest_name : profiles?.full_name || "Guest User";
        const phone = isOffline ? b.guest_phone : profiles?.phone || "";

        // Search filter (Local)
        if (searchQuery.trim() !== "") {
          const lowerQuery = searchQuery.toLowerCase();
          if (!name.toLowerCase().includes(lowerQuery) && !phone.includes(lowerQuery)) {
            return;
          }
        }

        if (!grouped[dateStr]) {
          grouped[dateStr] = [];
          settlementTotals[dateStr] = 0;
        }

        const formatTime = (timeStr: string) => {
          if (!timeStr) return "N/A";
          const [h] = timeStr.split(":");
          const hourInt = parseInt(h, 10);
          const ampm = hourInt >= 12 ? "Pm" : "Am";
          const displayHour = hourInt % 12 || 12;
          return `${displayHour} ${ampm}`;
        };

        grouped[dateStr].push({
          id: b.id,
          name,
          phone,
          amount: `₹${b.paid_amount || 0}`,
          type: "Table Booking",
          typeColor: "#63A1FD",
          amountColor: "#000000",
          time: formatTime(b.reservation_time),
          status: isOffline ? "Offline" : "Online",
        });

        settlementTotals[dateStr] += Number(b.paid_amount || 0);
      });

      const formattedGroups: DineHistoryGroup[] = Object.keys(grouped).map(date => ({
        date,
        settlement: `₹${settlementTotals[date]}`,
        data: grouped[date],
      }));

      setHistoryGroups(formattedGroups);
    } catch (error) {
      console.error("Error fetching dine history:", error);
    } finally {
      setLoading(false);
    }
  }, [serviceId, filter, customRange, searchQuery]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return {
    loading,
    searchQuery,
    setSearchQuery,
    filter,
    setFilter,
    customRange,
    setCustomRange,
    historyGroups,
    refresh: fetchHistory,
  };
};
