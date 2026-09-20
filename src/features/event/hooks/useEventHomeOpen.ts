// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { COLORS } from "@/constants/theme";

export interface BookingListItem {
  id: string;
  name: string;
  passType: string;
  time: string;
  date: string;
  rawDate: string; // ISO string for robust filtering
  shortFilterDate?: string;
  filterTime?: string;
  avatarUrl?: string;
  isSpot?: boolean;
  phone?: string;
  price?: number;
}

export interface EventSummaryCategory {
  label: string;
  value: number;
  trend: number;
}

export interface EventChartCategory {
  label: string;
  color: string;
}

export interface EventChartData {
  date: string;
  day: string;
  bookings: number;
}

export const useEventHomeOpen = (eventId: string) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [eventData, setEventData] = useState<any>(null);
  const [bookings, setBookings] = useState<BookingListItem[]>([]);

  const [totalBookings, setTotalBookings] = useState({ value: 0, trend: 0 });
  const [summaryCategories, setSummaryCategories] = useState<EventSummaryCategory[]>([]);
  const [chartCategories, setChartCategories] = useState<EventChartCategory[]>([]);
  const [chartData, setChartData] = useState<EventChartData[]>([]);
  const [sessionDateOptions, setSessionDateOptions] = useState<string[]>([]);
  const [sessionTimeOptions, setSessionTimeOptions] = useState<string[]>([]);

  const [activeTab, setActiveTab] = useState("All");

  const fetchEventData = useCallback(
    async (actionType: "initial" | "refresh" | "silent" = "initial") => {
      if (!eventId) {
        setLoading(false);
        setRefreshing(false);
        return;
      }
      if (actionType === "initial") setLoading(true);
      if (actionType === "refresh") setRefreshing(true);
      try {
        // 1 & 2. Fetch the event AND its nested passes/zones in a single query!
        // This bypasses direct table RLS blocks by querying through the parent event.
        const { data: event, error: eventError } = await supabase
          .from("events")
          .select(
            `
            *,
            event_passes ( id, name ),
            event_zones ( id, zone_name )
          `,
          )
          .eq("id", eventId)
          .maybeSingle();

        if (eventError) {
          console.error("DEBUG: Supabase Event Fetch Error:", eventError);
          throw eventError;
        }

        if (!event) {
          console.warn(`No event found with ID: ${eventId}`);
          setLoading(false);
          setRefreshing(false);
          return;
        }

        setEventData(event);

        const passesData = event.event_passes || [];
        const zonesData = event.event_zones || [];

        // Initialize our tracking map with 0 counts for every registered pass/zone
        const catsMap = new Map<string, { total: number; today: number }>();

        passesData.forEach((p: any) => {
          if (p.name) catsMap.set(p.name, { total: 0, today: 0 });
        });
        zonesData.forEach((z: any) => {
          if (z.zone_name) catsMap.set(z.zone_name, { total: 0, today: 0 });
        });

        // 3. Fetch all active bookings
        const { data: bookingsData, error: bookingsError } = await supabase
          .from("event_bookings")
          .select(
            `
            id,
            ticket_count,
            created_at,
            pass_id,
            is_spot_entry,
            booking_source,
            guest_name,
            guest_phone,
            total_amount,
            event_session_id,
            event_passes ( name ),
            event_zones ( zone_name ),
            profiles ( full_name, avatar_url )
          `,
          )
          .eq("event_id", eventId)
          .neq("booking_status", "cancelled")
          .order("created_at", { ascending: false });

        if (bookingsError) {
          console.error("DEBUG: Bookings Fetch Error:", bookingsError);
          throw bookingsError;
        }

        const formattedBookings: BookingListItem[] = [];
        let totalCount = 0;
        let todayCount = 0;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Prepare empty timeline data for the last 6 days
        const daysData: Record<string, number> = {};
        for (let i = 5; i >= 0; i--) {
          const d = new Date();
          d.setDate(today.getDate() - i);
          const dStr = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
          daysData[dStr] = 0;
        }

        const sessionDateSet = new Set<string>();
        const sessionTimeSet = new Set<string>();
        const sessions = event?.event_sessions || [];

        // 4. Iterate over bookings and tally them up!
        bookingsData?.forEach((b: any) => {
          const profile = Array.isArray(b.profiles) ? b.profiles[0] : b.profiles;
          const createdAt = new Date(b.created_at);

          let dateStr = "";
          let timeStr = "";
          let rawDate = b.created_at;
          let shortFilterDate = "";
          let filterTime = "";

          const fallbackDate = event?.start_datetime ? new Date(event.start_datetime) : createdAt;

          // Resolve session from event_sessions
          let matchedSession = null;
          if (b.event_session_id) {
            matchedSession = sessions.find((s: any) => String(s.id) === String(b.event_session_id));
          }

          const sessionDate = matchedSession?.startDate || matchedSession?.date;
          if (sessionDate) {
            const sd = new Date(sessionDate);
            dateStr = sd.toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            });
            rawDate = sessionDate;
            shortFilterDate = sd.toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
            });
            sessionDateSet.add(shortFilterDate);
          } else {
            dateStr = fallbackDate.toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            });
            rawDate = event?.start_datetime || b.created_at;
            shortFilterDate = fallbackDate.toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
            });
            sessionDateSet.add(shortFilterDate);
          }

          if (matchedSession?.startTime) {
            const [hours, minutes] = matchedSession.startTime.split(":");
            const stDate = new Date();
            stDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0);
            timeStr = stDate
              .toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: true })
              .toUpperCase();
            filterTime = timeStr;
            sessionTimeSet.add(filterTime);
          } else {
            timeStr = fallbackDate
              .toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: true })
              .toUpperCase();
            filterTime = timeStr;
            sessionTimeSet.add(filterTime);
          }

          const shortDate = createdAt.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
          });

          // Determine the category name
          const passJoin = Array.isArray(b.event_passes) ? b.event_passes[0] : b.event_passes;
          const zoneJoin = Array.isArray(b.event_zones) ? b.event_zones[0] : b.event_zones;
          let catName = passJoin?.name || zoneJoin?.zone_name;

          if (!catName) {
            if (passesData.length > 0) {
              catName = passesData[0].name;
            } else if (zonesData.length > 0) {
              catName = zonesData[0].zone_name;
            } else {
              catName = "Regular";
            }
          }
          const passTypeDesc = `${catName} x ${b.ticket_count}`;

          // If a booking has a category we didn't pre-fetch, add it dynamically
          if (!catsMap.has(catName)) {
            catsMap.set(catName, { total: 0, today: 0 });
          }

          const catData = catsMap.get(catName)!;

          const isSpotBooking = b.is_spot_entry || b.booking_source === "offline";

          formattedBookings.push({
            id: b.id,
            name: isSpotBooking && b.guest_name ? b.guest_name : profile?.full_name || "Guest User",
            passType: passTypeDesc,
            date: dateStr,
            rawDate: rawDate,
            shortFilterDate: shortFilterDate,
            filterTime: filterTime,
            time: timeStr,
            avatarUrl: isSpotBooking ? undefined : profile?.avatar_url,
            isSpot: isSpotBooking,
            phone: isSpotBooking ? b.guest_phone : undefined,
            price: isSpotBooking ? b.total_amount : undefined,
          });

          // Increment Counts
          totalCount += b.ticket_count;
          catData.total += b.ticket_count;

          const isToday = createdAt >= today;
          if (isToday) {
            todayCount += b.ticket_count;
            catData.today += b.ticket_count;
          }

          if (daysData[shortDate] !== undefined) {
            daysData[shortDate] += b.ticket_count;
          }
        });

        setBookings(formattedBookings);
        setTotalBookings({ value: totalCount, trend: todayCount });

        // 5. Convert Map to UI format
        const colors = [COLORS.primary, COLORS.warning, COLORS.danger, "#8B5CF6", "#10B981"];
        let colorIdx = 0;
        const finalSumCats: EventSummaryCategory[] = [];
        const finalChartCats: EventChartCategory[] = [];

        catsMap.forEach((stats, name) => {
          finalSumCats.push({
            label: name,
            value: stats.total,
            trend: stats.today,
          });
          finalChartCats.push({
            label: name,
            color: colors[colorIdx % colors.length],
          });
          colorIdx++;
        });

        setSummaryCategories(finalSumCats);
        setChartCategories(finalChartCats);

        // 6. Convert Days Data to UI Chart Array
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

        const sortedDates = Array.from(sessionDateSet).sort((a, b) => {
          const timeA = new Date(a + " 2026").getTime();
          const timeB = new Date(b + " 2026").getTime();
          return (isNaN(timeA) ? 0 : timeA) - (isNaN(timeB) ? 0 : timeB);
        });
        const sortedTimes = Array.from(sessionTimeSet).sort();

        setSessionDateOptions(sortedDates);
        setSessionTimeOptions(sortedTimes);
      } catch (error) {
        console.error("Error fetching open event data:", error);
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
      .channel(`open_event_${eventId}_${Date.now()}`)
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
    sessionDateOptions,
    sessionTimeOptions,
    activeTab,
    setActiveTab,
    refresh: () => fetchEventData("refresh"),
  };
};
