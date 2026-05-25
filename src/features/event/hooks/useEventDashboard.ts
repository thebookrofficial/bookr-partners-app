// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export interface CategoryData {
  label: string;
  entries: number;
  revenue: number;
  color: string;
}

export interface DayData {
  date: string; // e.g. "20 Apr"
  dayName: string; // e.g. "Mon"
  totalEntries: number;
  totalRevenue: number;
  categories: CategoryData[];
}

export interface DashboardData {
  Overall: DayData;
  [key: string]: DayData;
}

const COLORS_ARRAY = ["#00B562", "#3B82F6", "#FFB800", "#EF4444", "#8B5CF6"];

export const useEventDashboard = (serviceId: string) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [eventTitle, setEventTitle] = useState("");
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(
    async (actionType: "initial" | "refresh" | "silent" = "initial") => {
      if (!serviceId) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (actionType === "initial") setLoading(true);
      if (actionType === "refresh") setRefreshing(true);
      setError(null);

      try {
        // 1. Fetch Event - Try searching by venue_id first, then by ID directly
        let { data: event, error: eventError } = await supabase
          .from("events")
          .select("id, title, seating_type")
          .eq("venue_id", serviceId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        // Fallback: If not found by venue_id, maybe serviceId IS the event_id
        if (!event && !eventError) {
          const { data: directEvent } = await supabase
            .from("events")
            .select("id, title, seating_type")
            .eq("id", serviceId)
            .maybeSingle();
          event = directEvent;
        }

        if (eventError) throw eventError;

        if (!event) {
          console.warn("EventDashboard: No event found for ID:", serviceId);
          setDashboardData(null);
          setLoading(false);
          setRefreshing(false);
          return;
        }

        setEventTitle(event.title);

        // 2. Map Categories (Passes or Seats)
        let seatToSectionMap: Record<string, string> = {};
        let baseCategories: CategoryData[] = [];

        if (event.seating_type === "open") {
          const { data: passes } = await supabase
            .from("event_passes")
            .select("id, name")
            .eq("event_id", event.id);

          passes?.forEach((p, i) => {
            baseCategories.push({
              label: p.name,
              entries: 0,
              revenue: 0,
              color: COLORS_ARRAY[i % COLORS_ARRAY.length],
            });
          });
        } else {
          const { data: seats } = await supabase
            .from("event_seats")
            .select("id, section_name")
            .eq("event_id", event.id);

          seats?.forEach(s => {
            if (s.section_name) seatToSectionMap[s.id] = s.section_name;
          });

          const uniqueSections = Array.from(
            new Set(seats?.map(s => s.section_name).filter(Boolean)),
          );
          uniqueSections.forEach((sectionName, i) => {
            baseCategories.push({
              label: sectionName as string,
              entries: 0,
              revenue: 0,
              color: COLORS_ARRAY[i % COLORS_ARRAY.length],
            });
          });
        }

        // 3. Fetch all bookings
        const { data: bookingsData, error: bookingsError } = await supabase
          .from("event_bookings")
          .select(
            `
            id, ticket_count, total_amount, vendor_payout, created_at, pass_id, seat_ids, zone_id,
            event_passes (name),
            event_zones (zone_name)
          `,
          )
          .eq("event_id", event.id)
          .neq("booking_status", "cancelled")
          .order("created_at", { ascending: true });

        if (bookingsError) throw bookingsError;

        // 4. Initialize Data Structure
        const resultData: DashboardData = {
          Overall: {
            date: "Overall",
            dayName: "All Time",
            totalEntries: 0,
            totalRevenue: 0,
            categories: JSON.parse(
              JSON.stringify(
                baseCategories.length > 0
                  ? baseCategories
                  : [{ label: "General", entries: 0, revenue: 0, color: "#6B7280" }],
              ),
            ),
          },
        };

        const dayMap: Record<string, string> = {};
        let dayCounter = 1;

        bookingsData?.forEach((b: any) => {
          const createdAt = new Date(b.created_at);
          const dateKey = createdAt.toISOString().split("T")[0];

          if (!dayMap[dateKey]) {
            dayMap[dateKey] = `Day ${dayCounter++}`;
            resultData[dayMap[dateKey]] = {
              date: createdAt.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
              dayName: createdAt.toLocaleDateString("en-GB", { weekday: "short" }),
              totalEntries: 0,
              totalRevenue: 0,
              categories: JSON.parse(JSON.stringify(resultData.Overall.categories)),
            };
          }

          const dayLabel = dayMap[dateKey];
          let catName = "General";

          if (event.seating_type === "open") {
            const passJoin = Array.isArray(b.event_passes) ? b.event_passes[0] : b.event_passes;
            catName = passJoin?.name || "General";
          } else {
            // Priority 1: Check seat sections
            let parsedSeatIds: string[] = Array.isArray(b.seat_ids)
              ? b.seat_ids
              : typeof b.seat_ids === "string"
              ? b.seat_ids.replace(/^{|}$/g, "").split(",").filter(Boolean)
              : [];

            if (parsedSeatIds.length > 0 && seatToSectionMap[parsedSeatIds[0]]) {
              catName = seatToSectionMap[parsedSeatIds[0]];
            } else {
              // Priority 2: Fallback to zone name if no specific seat mapping exists
              const zoneJoin = Array.isArray(b.event_zones) ? b.event_zones[0] : b.event_zones;
              catName = zoneJoin?.zone_name || "General";
            }
          }

          // Aggregate into both Overall and specific Day buckets
          [resultData.Overall, resultData[dayLabel]].forEach(bucket => {
            bucket.totalEntries += b.ticket_count;
            bucket.totalRevenue += Number(b.vendor_payout || 0);

            let cat = bucket.categories.find(c => c.label === catName);
            if (!cat) cat = bucket.categories.find(c => c.label === "General");

            if (cat) {
              cat.entries += b.ticket_count;
              cat.revenue += Number(b.vendor_payout || 0);
            }
          });
        });

        setDashboardData(resultData);
      } catch (err: any) {
        console.error("Dashboard Fetch Error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [serviceId],
  );

  useEffect(() => {
    fetchDashboardData("initial");
  }, [fetchDashboardData]);

  return {
    loading,
    refreshing,
    eventTitle,
    dashboardData,
    error,
    refresh: () => fetchDashboardData("refresh"),
  };
};
