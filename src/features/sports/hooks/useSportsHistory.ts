// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

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
  category?: string;
  ground?: string;
}

export const useSportsHistory = (
  initialVenueId: string,
  category: string,
  searchQuery: string,
  dateFilter: "all" | "yesterday" | "3_months" | "6_months" | "9_months" | "custom" = "all",
  customRange?: { start: Date; end: Date },
) => {
  // 1. Use the specific venue provided, do not fetch all venues for the owner.
  const venueIds = [initialVenueId];
  const isResolvingVenue = false;

  // Fetch available categories for this venue
  const { data: availableCategories = [] } = useQuery({
    queryKey: ["historyAvailableCategories", venueIds],
    enabled: venueIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("sports_grounds")
        .select("id, sports_type, parent_ground_id")
        .in("venue_id", venueIds);
      if (!data) return [];

      const cats = new Set<string>();
      data.forEach(g => {
        if (g.sports_type) {
          cats.add(g.sports_type.toLowerCase());
        } else if (g.parent_ground_id) {
          const parent = data.find(p => p.id === g.parent_ground_id);
          if (parent?.sports_type) cats.add(parent.sports_type.toLowerCase());
        }
      });
      return Array.from(cats);
    },
  });

  // 2. Fetch History using resolved IDs
  const {
    data: allHistoryGroups = [],
    isLoading: isFetchingHistory,
    refetch,
  } = useQuery({
    queryKey: ["sportsHistory", venueIds],
    enabled: venueIds.length > 0,
    queryFn: async () => {
      const { data: bookings, error } = await supabase
        .from("sports_bookings")
        .select(
          `
          id, guest_name, guest_phone, total_amount, paid_amount, subtotal, discount_amount, platform_fee, booking_status,
          booking_group_id, parent_booking_id, sports_booking_type, booking_source,
          profiles(full_name, phone),
          sports_slots!inner(slot_date, start_time, end_time, sports_grounds(name, sports_type))
        `,
        )
        .in("venue_id", venueIds)
        .neq("booking_status", "cancelled")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const groupedByMonth: Record<string, any> = {};

      (bookings || []).forEach((b: any) => {
        const slotsArray = Array.isArray(b.sports_slots) ? b.sports_slots : [b.sports_slots];
        const slotDate = slotsArray[0]?.slot_date;
        if (!slotDate) return;

        const dateObj = new Date(slotDate);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (dateObj.getTime() >= today.getTime()) return;

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

        const totalAmt = Number(b.total_amount || 0);
        const paidAmt = Number(b.paid_amount || 0);
        const discountAmt = Number(b.discount_amount || 0);
        const platformFeeAmt = Number(b.platform_fee || 0);

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
            totalPlatformFee: 0,
            slots: [],
            rawBookingType: b.sports_booking_type,
            rawBookingSource: b.booking_source,
            category: slotsArray[0]?.sports_grounds?.sports_type || "",
            ground: slotsArray[0]?.sports_grounds?.name || "",
          };
        }

        groupedByMonth[monthStr].days[dateStr].transactions[transactionKey].totalCost += totalAmt;
        groupedByMonth[monthStr].days[dateStr].transactions[transactionKey].totalPaid += paidAmt;
        groupedByMonth[monthStr].days[dateStr].transactions[transactionKey].totalDiscount +=
          discountAmt;
        groupedByMonth[monthStr].days[dateStr].transactions[transactionKey].totalPlatformFee +=
          platformFeeAmt;
        groupedByMonth[monthStr].days[dateStr].transactions[transactionKey].totalSubtotal += Number(
          b.subtotal || 0,
        );
        groupedByMonth[monthStr].days[dateStr].transactions[transactionKey].slots.push(
          ...slotsArray,
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

            const cat = u.category || "";
            let ground = u.ground || "";
            const catLower = cat.toLowerCase();
            const groundLower = ground.toLowerCase();
            if (catLower && groundLower.startsWith(catLower)) {
              ground = ground.slice(catLower.length).trim();
            }

            const isPickleball = catLower.includes("pickleball");
            const displayPrice = isPickleball
              ? u.totalPaid + u.totalDiscount - u.totalPlatformFee
              : u.totalPaid + u.totalDiscount;

            return {
              id: u.id,
              name: u.name,
              phone: u.phone,
              timeRanges,
              price: displayPrice,
              status,
              category: cat,
              ground,
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

      finalGroups.sort((a, b) => b.rawMonth - a.rawMonth);

      return finalGroups;
    },
  });

  const filteredHistoryGroups = useMemo(() => {
    let groups = allHistoryGroups;

    // Apply date filter
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

      groups = groups
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

    // Apply category filter
    if (category && category !== "All") {
      const lowerCat = category.toLowerCase();
      groups = groups
        .map(monthGroup => {
          const filteredDays = monthGroup.days
            .map(dayGroup => {
              const filteredBookings = dayGroup.bookings.filter(
                b => (b.category || "").toLowerCase() === lowerCat,
              );
              return { ...dayGroup, bookings: filteredBookings };
            })
            .filter(dayGroup => dayGroup.bookings.length > 0);
          const newSettlement = filteredDays.reduce((sum, d) => sum + d.settlement, 0);
          return { ...monthGroup, days: filteredDays, totalSettlement: newSettlement };
        })
        .filter(monthGroup => monthGroup.days.length > 0);
    }

    if (searchQuery.trim() !== "") {
      const lowerQuery = searchQuery.toLowerCase();
      groups = groups
        .map(monthGroup => {
          const filteredDays = monthGroup.days
            .map(dayGroup => {
              const filteredBookings = dayGroup.bookings.filter(
                b =>
                  b.name.toLowerCase().includes(lowerQuery) ||
                  b.phone.includes(lowerQuery) ||
                  b.price.toString().includes(lowerQuery) ||
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

    return groups;
  }, [allHistoryGroups, dateFilter, category, searchQuery, customRange]);

  return {
    currentVenueId: initialVenueId,
    historyGroups: filteredHistoryGroups,
    loading: isResolvingVenue || isFetchingHistory,
    availableCategories,
    refetch,
  };
};
