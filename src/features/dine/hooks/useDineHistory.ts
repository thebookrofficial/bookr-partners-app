// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import { useState, useEffect, useCallback, useMemo } from "react";
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
  created_at: string;
  reservation_date: string | null;
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
  const [rawHistory, setRawHistory] = useState<DineHistoryItem[]>([]);

  const fetchHistory = useCallback(async () => {
    if (!serviceId) return;
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
          party_size,
          table_id,
          guest_name,
          guest_phone,
          booking_status,
          bill_amount,
          reservation_amount,
          profiles (
            full_name,
            phone
          )
        `,
        )
        .eq("venue_id", serviceId)
        .gt("bill_amount", 0)
        .order("created_at", { ascending: false });

      const { data, error } = await query;
      if (error) throw error;

      // Group by date
      const formatted: DineHistoryItem[] = (data || [])
        .filter((b: any) => {
          // Helper to safely get ISO date string (YYYY-MM-DD)
          const getSafeDateString = (dateVal: any) => {
            if (!dateVal) return null;
            const d = new Date(dateVal);
            return isNaN(d.getTime()) ? null : d.toISOString().split("T")[0];
          };

          const resDate = b.reservation_date;
          const createdDate = getSafeDateString(b.created_at);

          if (filter === "3_months") {
            const d = new Date();
            d.setMonth(d.getMonth() - 3);
            const cutoff = d.toISOString().split("T")[0];
            return (resDate && resDate >= cutoff) || (createdDate && createdDate >= cutoff);
          } else if (filter === "9_months") {
            const d = new Date();
            d.setMonth(d.getMonth() - 9);
            const cutoff = d.toISOString().split("T")[0];
            return (resDate && resDate >= cutoff) || (createdDate && createdDate >= cutoff);
          } else if (filter === "custom" && customRange) {
            const start = getSafeDateString(customRange.start);
            const end = getSafeDateString(customRange.end);
            if (!start || !end) return true;
            return (
              (resDate && resDate >= start && resDate <= end) ||
              (createdDate && createdDate >= start && createdDate <= end)
            );
          }
          return true; // "all"
        })
        .map((b: any) => {
          const profiles = Array.isArray(b.profiles) ? b.profiles[0] : b.profiles;
          const isOffline = Boolean(b.guest_name && b.guest_name.trim() !== "");
          const name = isOffline ? b.guest_name : profiles?.full_name || "Guest User";
          const phone = isOffline ? b.guest_phone : profiles?.phone || "";

          const formatTime = (timeStr: string, createdAt: string) => {
            let targetTime = timeStr;
            // If it's a Pay Bill or timeStr is missing, always fallback to created_at time
            if (!targetTime || targetTime === "00:00:00" || targetTime === "00:00") {
              if (createdAt) {
                const d = new Date(createdAt);
                if (!isNaN(d.getTime())) {
                  // Format as HH:MM
                  const h = d.getHours().toString().padStart(2, "0");
                  const m = d.getMinutes().toString().padStart(2, "0");
                  targetTime = `${h}:${m}`;
                }
              }
            }

            if (!targetTime) return "N/A";
            const parts = targetTime.split(":");
            if (parts.length < 2) return "N/A";
            const h = parseInt(parts[0], 10);
            const m = parts[1];
            const ampm = h >= 12 ? "PM" : "AM";
            const displayHour = h % 12 || 12;
            const displayMins = m === "00" ? "" : `:${m}`;
            return `${displayHour}${displayMins} ${ampm}`;
          };

          // Robust Multi-Signal Logic for Type Differentiation:
          const createdDateOnly = b.created_at
            ? new Date(b.created_at).toISOString().split("T")[0]
            : null;

          const isTableBooking =
            // 1. Any active (not completed) record is a Table Booking
            b.booking_status !== "completed" ||
            // 2. Any record with a specific table assigned is a Table Booking
            Boolean(b.table_id) ||
            // 3. If it was booked for a date after it was created, it's a reservation
            (b.reservation_date && createdDateOnly && b.reservation_date > createdDateOnly) ||
            // 4. Offline records are bookings, unless labeled as direct pay
            (isOffline &&
              !name.toLowerCase().includes("direct pay") &&
              !name.toLowerCase().includes("pay bill"));

          return {
            id: b.id,
            name,
            phone,
            amount: `₹${b.paid_amount || 0}`,
            type: isTableBooking ? "Table Booking" : "Pay Bill",
            typeColor: isTableBooking ? "#63A1FD" : "#7300FF",
            amountColor: "#000000",
            time: formatTime(b.reservation_time, b.created_at),
            status: isOffline ? "Offline" : "Online",
            created_at: b.created_at,
            reservation_date: b.reservation_date,
          };
        });
      setRawHistory(formatted);
    } catch (error) {
      console.error("Error fetching dine history:", error);
    } finally {
      setLoading(false);
    }
  }, [serviceId, filter, customRange]);

  // Optimized Search and Grouping
  const historyGroups = useMemo(() => {
    let filtered = rawHistory;

    if (searchQuery.trim() !== "") {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = rawHistory.filter(
        item =>
          item.name.toLowerCase().includes(lowerQuery) ||
          item.phone.includes(lowerQuery) ||
          item.id.toLowerCase().includes(lowerQuery),
      );
    }

    const grouped: Record<string, DineHistoryItem[]> = {};
    const settlementTotals: Record<string, number> = {};

    filtered.forEach(item => {
      // Use reservation_date if available, otherwise created_at
      const dateSource = item.reservation_date || item.created_at;
      const dateObj = new Date(dateSource);
      const dateStr = dateObj.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

      if (!grouped[dateStr]) {
        grouped[dateStr] = [];
        settlementTotals[dateStr] = 0;
      }

      grouped[dateStr].push(item);
      // Strip currency symbol to sum amount
      const amt = Number(item.amount.replace("₹", "")) || 0;
      settlementTotals[dateStr] += amt;
    });

    return Object.keys(grouped).map(date => ({
      date,
      settlement: `₹${settlementTotals[date]}`,
      data: grouped[date],
    }));
  }, [rawHistory, searchQuery]);

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
