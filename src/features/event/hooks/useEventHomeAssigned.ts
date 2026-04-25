// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { COLORS } from "@/constants/theme";
import {
  BookingListItem,
  EventSummaryCategory,
  EventChartCategory,
  EventChartData,
} from "./useEventHomeOpen";

export const useEventHomeAssigned = (eventId: string) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [eventData, setEventData] = useState<any>(null);
  const [bookings, setBookings] = useState<BookingListItem[]>([]);

  const [totalBookings, setTotalBookings] = useState({ value: 0, trend: 0 });
  const [summaryCategories, setSummaryCategories] = useState<EventSummaryCategory[]>([]);
  const [chartCategories, setChartCategories] = useState<EventChartCategory[]>([]);
  const [chartData, setChartData] = useState<EventChartData[]>([]);

  const [activeTab, setActiveTab] = useState("All");

  const fetchEventData = useCallback(
    async (actionType: "initial" | "refresh" | "silent" = "initial") => {
      if (!eventId) return;
      if (actionType === "initial") setLoading(true);
      if (actionType === "refresh") setRefreshing(true);
      try {
        const { data: event, error: eventError } = await supabase
          .from("events")
          .select("*")
          .eq("id", eventId)
          .single();

        if (eventError) throw eventError;
        setEventData(event);

        let categoryMap: Record<string, string> = {};
        const colors = [COLORS.primary, COLORS.warning, COLORS.danger, "#8B5CF6", "#10B981"];
        let chartCats: EventChartCategory[] = [];
        let sumCats: EventSummaryCategory[] = [];

        // Fetch all seats for this event to build categories from section_name and map seat_ids
        const { data: seats } = await supabase
          .from("event_seats")
          .select("id, row_label, seat_number, section_name")
          .eq("event_id", eventId);

        // Build distinct section names from seats
        const uniqueSections = Array.from(new Set(seats?.map(s => s.section_name).filter(Boolean)));
        uniqueSections.forEach((sectionName, i) => {
          categoryMap[sectionName as string] = sectionName as string;
          chartCats.push({ label: sectionName as string, color: colors[i % colors.length] });
          sumCats.push({ label: sectionName as string, value: 0, trend: 0 });
        });
        setChartCategories(chartCats);

        const seatMap: Record<string, { label: string; sectionName: string }> = {};
        seats?.forEach(s => {
          seatMap[s.id] = {
            label: `${s.row_label}${s.seat_number}`,
            sectionName: s.section_name,
          };
        });

        const { data: bookingsData, error: bookingsError } = await supabase
          .from("event_bookings")
          .select(
            `
          id,
          ticket_count,
          created_at,
          seat_ids,
          profiles (
            full_name,
            avatar_url
          )
        `,
          )
          .eq("event_id", eventId)
          .neq("booking_status", "cancelled")
          .order("created_at", { ascending: false });

        if (bookingsError) throw bookingsError;

        const formattedBookings: BookingListItem[] = [];
        let totalCount = 0;
        let todayCount = 0;
        const categoryCounts: Record<string, { total: number; today: number }> = {};
        Object.keys(categoryMap).forEach(k => {
          categoryCounts[k] = { total: 0, today: 0 };
        });

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const daysData: Record<string, number> = {};
        for (let i = 5; i >= 0; i--) {
          const d = new Date();
          d.setDate(today.getDate() - i);
          const dStr = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
          daysData[dStr] = 0;
        }

        bookingsData?.forEach((b: any) => {
          const profile = Array.isArray(b.profiles) ? b.profiles[0] : b.profiles;
          const createdAt = new Date(b.created_at);

          const dateStr = createdAt.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          });
          const timeStr = createdAt
            .toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: true })
            .toUpperCase();
          const shortDate = createdAt.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
          });

          let catId = "";
          let seatLabels: string[] = [];

          let parsedSeatIds: string[] = [];
          if (Array.isArray(b.seat_ids)) {
            parsedSeatIds = b.seat_ids;
          } else if (typeof b.seat_ids === "string") {
            parsedSeatIds = b.seat_ids.replace(/^{|}$/g, "").split(",").filter(Boolean);
          }

          if (parsedSeatIds.length > 0) {
            parsedSeatIds.forEach((sid: string) => {
              if (seatMap[sid]) {
                seatLabels.push(seatMap[sid].label);
                if (!catId) catId = seatMap[sid].sectionName; // Fallback category based on section_name
              }
            });
          }

          const catName = catId && categoryMap[catId] ? categoryMap[catId] : "General";

          let passTypeDesc = catName;
          if (seatLabels.length > 0) {
            passTypeDesc = `${catName} | ${seatLabels.join(", ")}`;
          } else {
            passTypeDesc = `${catName} x ${b.ticket_count}`;
          }

          formattedBookings.push({
            id: b.id,
            name: profile?.full_name || "Guest User",
            passType: passTypeDesc,
            date: dateStr,
            time: timeStr,
            avatarUrl: profile?.avatar_url,
          });

          totalCount += b.ticket_count;
          const isToday = createdAt >= today;

          if (isToday) {
            todayCount += b.ticket_count;
          }

          if (catId && categoryCounts[catId]) {
            categoryCounts[catId].total += b.ticket_count;
            if (isToday) categoryCounts[catId].today += b.ticket_count;
          }

          if (daysData[shortDate] !== undefined) {
            daysData[shortDate] += b.ticket_count;
          }
        });

        setBookings(formattedBookings);
        setTotalBookings({ value: totalCount, trend: todayCount });

        const finalSumCats = Object.keys(categoryMap).map(id => ({
          label: categoryMap[id],
          value: categoryCounts[id].total,
          trend: categoryCounts[id].today,
        }));
        setSummaryCategories(finalSumCats);

        const realChartData: EventChartData[] = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date();
          d.setDate(today.getDate() - i);
          const shortDate = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
          realChartData.push({
            date: shortDate,
            day: d.toLocaleDateString("en-GB", { weekday: "short" }),
            bookings: daysData[shortDate] || 0,
          });
        }
        setChartData(realChartData);
      } catch (error) {
        console.error("Error fetching assigned event data:", error);
      } finally {
        if (actionType === "initial") setLoading(false);
        if (actionType === "refresh") setRefreshing(false);
      }
    },
    [eventId],
  );

  useEffect(() => {
    fetchEventData("initial");
  }, [fetchEventData]);

  useEffect(() => {
    if (!eventId) return;
    const channel = supabase
      .channel(`assigned_event_${eventId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "event_bookings", filter: `event_id=eq.${eventId}` },
        () => {
          fetchEventData("silent");
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId, fetchEventData]);

  return {
    loading,
    refreshing,
    eventData,
    bookings,
    totalBookings,
    summaryCategories,
    chartCategories,
    chartData,
    activeTab,
    setActiveTab,
    refresh: () => fetchEventData("refresh"),
  };
};
