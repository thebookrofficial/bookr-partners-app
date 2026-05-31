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
  status: "Online" | "Offline";
}

export const useSportsHistory = (
  initialVenueId: string,
  category: string,
  searchQuery: string,
  dateFilter: "all" | "yesterday" | "3_months" | "6_months" | "9_months" | "custom" = "all",
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
        .select("id, owner_id, sports_venues(sports_type)")
        .eq("id", initialVenueId)
        .single();
      if (!initialVenue) throw new Error("Owner not found");

      // Check if the initial venue itself matches the sport type
      const initialSportType = initialVenue.sports_venues?.[0]?.sports_type;
      let finalVenueId = "";

      if (initialSportType === dbSportType) {
        finalVenueId = initialVenue.id;
      } else {
        const { data: matchedVenue } = await supabase
          .from("venues")
          .select("id, sports_venues!inner(sports_type)")
          .eq("owner_id", initialVenue.owner_id)
          .eq("sports_venues.sports_type", dbSportType)
          .limit(1)
          .maybeSingle();

        if (matchedVenue) finalVenueId = matchedVenue.id;
      }

      setCurrentVenueId(finalVenueId);
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
          id, guest_name, guest_phone, total_amount, paid_amount, subtotal, discount_amount, booking_status,
          booking_group_id, parent_booking_id, sports_booking_type, booking_source,
          profiles(full_name, phone),
          sports_slots!inner(slot_date, start_time, end_time)
        `,
        )
        .eq("venue_id", currentVenueId)
        .neq("booking_status", "cancelled")
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
        const transactionKey = b.booking_group_id || b.parent_booking_id || b.id;

        if (!groupedByMonth[monthStr])
          groupedByMonth[monthStr] = { rawMonth, totalSettlement: 0, days: {} };
        if (!groupedByMonth[monthStr].days[dateStr])
          groupedByMonth[monthStr].days[dateStr] = { rawDate, settlement: 0, transactions: {} };

        // CRITICAL FIX: Sum the 'total_amount' instead of 'paid_amount' so the day/month
        // headers reflect the overall cost of all bookings for that period.
        const totalAmt = Number(b.total_amount || 0);
        const paidAmt = Number(b.paid_amount || 0);
        const discountAmt = Number(b.discount_amount || 0);

        groupedByMonth[monthStr].totalSettlement += totalAmt;
        groupedByMonth[monthStr].days[dateStr].settlement += totalAmt;

        if (!groupedByMonth[monthStr].days[dateStr].transactions[transactionKey]) {
          groupedByMonth[monthStr].days[dateStr].transactions[transactionKey] = {
            id: b.id,
            name,
            phone,
            totalCost: 0,
            totalPaid: 0,
            totalDiscount: 0,
            totalSubtotal: 0,
            slots: [],
            rawBookingType: b.sports_booking_type,
            rawBookingSource: b.booking_source,
          };
        }

        groupedByMonth[monthStr].days[dateStr].transactions[transactionKey].totalCost += totalAmt;
        groupedByMonth[monthStr].days[dateStr].transactions[transactionKey].totalPaid += paidAmt;
        groupedByMonth[monthStr].days[dateStr].transactions[transactionKey].totalDiscount +=
          discountAmt;
        groupedByMonth[monthStr].days[dateStr].transactions[transactionKey].totalSubtotal += Number(
          b.subtotal || 0,
        );
        groupedByMonth[monthStr].days[dateStr].transactions[transactionKey].slots.push(
          b.sports_slots,
        );
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
          const aggregatedBookings = Object.values(dayData.transactions).map((u: any) => {
            const sortedSlots = u.slots.sort((a: any, b: any) =>
              a.start_time.localeCompare(b.start_time),
            );

            // LOGIC: Merge consecutive slots into single blocks
            let timeRanges = "";
            if (sortedSlots.length > 0) {
              let currentStart = sortedSlots[0].start_time;
              let currentEnd = sortedSlots[0].end_time;
              const blocks = [];

              for (let i = 1; i < sortedSlots.length; i++) {
                if (sortedSlots[i].start_time === currentEnd) {
                  currentEnd = sortedSlots[i].end_time;
                } else {
                  blocks.push(`${formatTime(currentStart)} - ${formatTime(currentEnd)}`);
                  currentStart = sortedSlots[i].start_time;
                  currentEnd = sortedSlots[i].end_time;
                }
              }
              blocks.push(`${formatTime(currentStart)} - ${formatTime(currentEnd)}`);
              timeRanges = blocks.join("  |  ");
            }

            let status: "Online" | "Offline" = "Offline";
            if (u.rawBookingSource === "online") {
              status = "Online";
            }

            // Show Gross Paid (Paid + Discount) for the card price
            const displayPrice = u.totalPaid + u.totalDiscount;

            return {
              id: u.id,
              name: u.name,
              phone: u.phone,
              timeRanges,
              price: displayPrice,
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
        let maxCutoff = Infinity;

        if (dateFilter === "3_months") cutoff = now - 90 * 24 * 60 * 60 * 1000;
        else if (dateFilter === "6_months") cutoff = now - 180 * 24 * 60 * 60 * 1000;
        else if (dateFilter === "9_months") cutoff = now - 270 * 24 * 60 * 60 * 1000;
        else if (dateFilter === "yesterday") {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          cutoff = yesterday.setHours(0, 0, 0, 0);
          maxCutoff = yesterday.setHours(23, 59, 59, 999);
        }

        finalGroups = finalGroups
          .map(monthGroup => {
            const filteredDays = monthGroup.days.filter(dayGroup => {
              if (dateFilter === "custom" && customRange) {
                const start = customRange.start.getTime();
                const end = new Date(customRange.end).setHours(23, 59, 59, 999);
                return dayGroup.rawDate >= start && dayGroup.rawDate <= end;
              }
              if (dateFilter === "yesterday") {
                return dayGroup.rawDate >= cutoff && dayGroup.rawDate <= maxCutoff;
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
