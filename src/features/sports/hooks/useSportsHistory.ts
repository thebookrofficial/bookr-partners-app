// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export interface MonthGroup {
  month: string;
  rawMonth: number;
  totalSettlement: number;
  days: DailyGroup[];
}
export interface DailyGroup {
  date: string;
  rawDate: number;
  settlement: number;
  bookings: AggregatedBooking[];
}
export interface AggregatedBooking {
  id: string;
  name: string;
  phone: string;
  timeRanges: string;
  price: number;
  status: "Full" | "Advance" | "Offline";
}

export const useSportsHistory = (
  initialVenueId: string,
  category: string,
  searchQuery: string,
  dateFilter: "all" | "3_months" | "6_months" | "9_months" | "custom" = "all",
  customRange?: { start: Date; end: Date },
) => {
  const [currentVenueId, setCurrentVenueId] = useState<string>(initialVenueId);
  const [historyGroups, setHistoryGroups] = useState<MonthGroup[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Resolve Category to actual Venue ID
  const resolveVenue = useCallback(async () => {
    setLoading(true);
    try {
      const CATEGORY_DB_MAP: Record<string, string> = {
        Football: "football",
        "Box Cricket": "box_cricket",
        Pickleball: "pickleball",
      };
      const dbSportType = CATEGORY_DB_MAP[category] || category;

      const { data: initialVenue } = await supabase
        .from("venues")
        .select("owner_id")
        .eq("id", initialVenueId)
        .single();
      if (!initialVenue) throw new Error("Owner not found");

      const { data: matchedVenue } = await supabase
        .from("venues")
        .select("id, sports_venues!inner(sports_type)")
        .eq("owner_id", initialVenue.owner_id)
        .eq("sports_venues.sports_type", dbSportType)
        .limit(1)
        .maybeSingle();

      setCurrentVenueId(matchedVenue ? matchedVenue.id : "");
    } catch (error) {
      console.error("Venue resolution error:", error);
    }
  }, [initialVenueId, category]);

  // 2. Fetch History using resolved ID
  const fetchHistory = useCallback(async () => {
    if (!currentVenueId) {
      setHistoryGroups([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data: bookings, error } = await supabase
        .from("sports_bookings")
        .select(
          `
          id, guest_name, guest_phone, total_amount, paid_amount,
          profiles(full_name, phone),
          sports_slots!inner(slot_date, start_time, end_time)
        `,
        )
        .eq("venue_id", currentVenueId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const groupedByMonth: Record<string, any> = {};

      (bookings || []).forEach((b: any) => {
        const slotDate = b.sports_slots.slot_date;
        const dateObj = new Date(slotDate);
        const monthStr = dateObj.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
        const rawMonth = new Date(dateObj.getFullYear(), dateObj.getMonth(), 1).getTime();
        const dateStr = dateObj.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
        const rawDate = dateObj.getTime();

        const name = b.guest_name || b.profiles?.full_name || "Guest";
        const phone = b.profiles?.phone || b.guest_phone || "N/A";
        const userKey = `${name}-${phone}`;

        if (!groupedByMonth[monthStr])
          groupedByMonth[monthStr] = { rawMonth, totalSettlement: 0, days: {} };
        if (!groupedByMonth[monthStr].days[dateStr])
          groupedByMonth[monthStr].days[dateStr] = { rawDate, settlement: 0, users: {} };

        const paidAmt = Number(b.paid_amount || 0);
        groupedByMonth[monthStr].totalSettlement += paidAmt;
        groupedByMonth[monthStr].days[dateStr].settlement += paidAmt;

        if (!groupedByMonth[monthStr].days[dateStr].users[userKey]) {
          groupedByMonth[monthStr].days[dateStr].users[userKey] = {
            id: b.id,
            name,
            phone,
            totalCost: 0,
            totalPaid: 0,
            slots: [],
          };
        }

        groupedByMonth[monthStr].days[dateStr].users[userKey].totalCost += Number(
          b.total_amount || 0,
        );
        groupedByMonth[monthStr].days[dateStr].users[userKey].totalPaid += paidAmt;
        groupedByMonth[monthStr].days[dateStr].users[userKey].slots.push(b.sports_slots);
      });

      const formatTime = (t: string) => {
        const [h, m] = t.split(":");
        const hour = parseInt(h, 10);
        const ampm = hour >= 12 ? "Pm" : "Am";
        const displayHour = hour % 12 || 12;
        const displayMins = m === "00" ? "" : `:${m}`;
        return `${displayHour}${displayMins} ${ampm}`;
      };

      let finalGroups: MonthGroup[] = Object.keys(groupedByMonth).map(monthStr => {
        const monthData = groupedByMonth[monthStr];
        const dailyGroups: DailyGroup[] = Object.keys(monthData.days).map(dateStr => {
          const dayData = monthData.days[dateStr];
          const aggregatedBookings = Object.values(dayData.users).map((u: any) => {
            const sortedSlots = u.slots.sort((a: any, b: any) =>
              a.start_time.localeCompare(b.start_time),
            );
            const timeRanges = sortedSlots
              .map((s: any) => `${formatTime(s.start_time)} - ${formatTime(s.end_time)}`)
              .join("  |  ");
            let status: "Full" | "Advance" | "Offline" = "Offline";
            if (u.totalPaid >= u.totalCost && u.totalCost > 0) status = "Full";
            else if (u.totalPaid > 0) status = "Advance";
            return {
              id: u.id,
              name: u.name,
              phone: u.phone,
              timeRanges,
              price: u.totalPaid,
              status,
            };
          });
          return {
            date: dateStr,
            rawDate: dayData.rawDate,
            settlement: dayData.settlement,
            bookings: aggregatedBookings,
          };
        });
        dailyGroups.sort((a, b) => b.rawDate - a.rawDate);
        return {
          month: monthStr,
          rawMonth: monthData.rawMonth,
          totalSettlement: monthData.totalSettlement,
          days: dailyGroups,
        };
      });

      if (dateFilter !== "all") {
        const now = new Date().getTime();
        let cutoff = 0;
        if (dateFilter === "3_months") cutoff = now - 90 * 24 * 60 * 60 * 1000;
        else if (dateFilter === "6_months") cutoff = now - 180 * 24 * 60 * 60 * 1000;
        else if (dateFilter === "9_months") cutoff = now - 270 * 24 * 60 * 60 * 1000;

        finalGroups = finalGroups
          .map(monthGroup => {
            const filteredDays = monthGroup.days.filter(dayGroup => {
              if (dateFilter === "custom" && customRange) {
                const start = customRange.start.getTime();
                const end = new Date(customRange.end).setHours(23, 59, 59, 999);
                return dayGroup.rawDate >= start && dayGroup.rawDate <= end;
              }
              return dayGroup.rawDate >= cutoff;
            });
            const newSettlement = filteredDays.reduce((sum, d) => sum + d.settlement, 0);
            return { ...monthGroup, days: filteredDays, totalSettlement: newSettlement };
          })
          .filter(monthGroup => monthGroup.days.length > 0);
      }

      finalGroups.sort((a, b) => b.rawMonth - a.rawMonth);

      if (searchQuery.trim() !== "") {
        const lowerQuery = searchQuery.toLowerCase();
        finalGroups = finalGroups
          .map(monthGroup => {
            const filteredDays = monthGroup.days
              .map(dayGroup => {
                const filteredBookings = dayGroup.bookings.filter(
                  b =>
                    b.name.toLowerCase().includes(lowerQuery) ||
                    b.phone.includes(lowerQuery) ||
                    dayGroup.date.toLowerCase().includes(lowerQuery),
                );
                return { ...dayGroup, bookings: filteredBookings };
              })
              .filter(dayGroup => dayGroup.bookings.length > 0);
            const newSettlement = filteredDays.reduce((sum, d) => sum + d.settlement, 0);
            return { ...monthGroup, days: filteredDays, totalSettlement: newSettlement };
          })
          .filter(monthGroup => monthGroup.days.length > 0);
      }

      setHistoryGroups(finalGroups);
    } catch (err) {
      console.error("History fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [currentVenueId, searchQuery, dateFilter, customRange]);

  useEffect(() => {
    resolveVenue();
  }, [resolveVenue]);
  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return { currentVenueId, historyGroups, loading, refetch: fetchHistory };
};
