// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { SportsService } from "../services/sports.service";

interface VenueData {
  id: string;
  name: string;
  vertical: string;
  cover_image_url: string | null;
}

interface GroundData {
  id: string;
  name: string;
}

export interface SlotData {
  id: string;
  time: string;
  status: "available" | "booked" | "blocked" | "maintenance";
  raw_start_time: string;
  duration_minutes?: number;
  isManualBooking?: boolean;
}

export interface BookingData {
  id: string;
  name: string;
  phone: string;
  date: string;
  time: string;
  price: string;
  status: "Online" | "Offline" | "Settlement";
  avatarUrl?: string;
  isOfflineRecord: boolean;
  isDisabled?: boolean;
  isPaymentPending?: boolean;
  startTimeRaw?: string;
  endTimeRaw?: string;
  notes?: string;
  idChain: string[];
  parent_booking_id?: string | null;
  booking_group_id?: string | null;
  sports_booking_type?: string;
  sequence_number?: number;
  rawSubtotal?: number;
  rawPaidAmount?: number;
  rawDiscountAmount?: number;
  isOnline?: boolean;
  isPickleball?: boolean;
}

const getLocalDateString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Helper to format raw database sports_type into beautiful display names
const formatCategoryName = (dbName: string) => {
  const MAP: Record<string, string> = {
    football: "Football",
    box_cricket: "Box Cricket",
    pickleball: "Pickleball",
    cricket: "Cricket",
  };
  if (MAP[dbName]) return MAP[dbName];
  // Fallback: replaces underscores with spaces and capitalizes each word
  return dbName
    .split("_")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export const useSportsHome = (initialVenueId: string, category: string) => {
  const [currentVenueId, setCurrentVenueId] = useState<string>(initialVenueId);
  const [venue, setVenue] = useState<VenueData | null>(null);
  const [grounds, setGrounds] = useState<GroundData[]>([]);
  const [activeGroundId, setActiveGroundId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [slots, setSlots] = useState<SlotData[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  // Reset state when venue or category changes to avoid stale data leakage
  useEffect(() => {
    setLoading(true);
    setVenue(null);
    setGrounds([]);
    setActiveGroundId("");
    setSlots([]);
    setBookings([]);
  }, [initialVenueId, category]);

  // Auto-select the first available category if the current one isn't valid for this vendor
  useEffect(() => {
    if (availableCategories.length > 0 && !availableCategories.includes(category)) {
      // NOTE: Handled in the UI layer now
    }
  }, [availableCategories, category, initialVenueId]);

  const fetchVenueDetails = useCallback(async () => {
    setLoading(true);
    try {
      const dbSportType = category.toLowerCase().replace(" ", "_");

      const { initialVenue, matchedVenue } = await SportsService.getVenueDetails(
        initialVenueId,
        dbSportType,
      );

      const allSportsData = await SportsService.getAllVendorSportsCategories(initialVenue.owner_id);
      if (allSportsData) {
        const uniqueTypes = new Set<string>();
        allSportsData.forEach((v: any) => {
          const sv = v.sports_venues;
          if (Array.isArray(sv)) sv.forEach((s: any) => uniqueTypes.add(s.sports_type));
          else if (sv) uniqueTypes.add(sv.sports_type);
        });
        setAvailableCategories(Array.from(uniqueTypes).map(formatCategoryName));
      }

      if (matchedVenue) {
        setCurrentVenueId(matchedVenue.id);
        setVenue({
          id: matchedVenue.id,
          name: matchedVenue.name,
          vertical: matchedVenue.vertical,
          cover_image_url: matchedVenue.cover_image_url,
        });

        const groundsData = await SportsService.getGrounds(matchedVenue.id);
        if (groundsData && groundsData.length > 0) {
          setGrounds(groundsData);
          setActiveGroundId(groundsData[0].id);
        } else {
          setGrounds([]);
          setActiveGroundId("");
        }
      } else {
        setVenue(null);
        setGrounds([]);
        setActiveGroundId("");
        setSlots([]);
        setBookings([]);
      }
    } catch (error) {
      console.error("Error fetching sports home data:", error);
    } finally {
      setLoading(false);
    }
  }, [initialVenueId, category]);

  const fetchSlots = useCallback(async () => {
    if (!activeGroundId || !currentVenueId) return;
    setSlotsLoading(true);
    try {
      const localDateString = getLocalDateString(selectedDate);
      const slotsData = await SportsService.getSlots(
        currentVenueId,
        activeGroundId,
        localDateString,
      );

      const formattedSlots: SlotData[] = (slotsData || []).map((slot: any) => {
        const [startHStr, startMStr] = slot.start_time.split(":");
        const hourInt = parseInt(startHStr, 10);
        const ampm = hourInt >= 12 ? "PM" : "AM";
        const displayHour = hourInt % 12 || 12;
        const displayMins = startMStr === "00" ? "" : `:${startMStr}`;

        // Ensure we don't mark slot as manual if the ONLY booking inside it is cancelled
        const validBooking = slot.sports_bookings?.find((b: any) => {
          const bStatus = (b.booking_status || "").toLowerCase().trim();
          return bStatus !== "cancelled" && bStatus !== "refunded";
        });

        const isManual = validBooking
          ? !validBooking.user_id || validBooking.sports_booking_type === "multi_slot"
          : false;

        const startH = parseInt(startHStr, 10);
        const startM = parseInt(startMStr, 10);
        const [endH, endM] = slot.end_time.split(":").map(Number);
        let durationMins = endH * 60 + endM - (startH * 60 + startM);
        if (durationMins < 0) durationMins += 24 * 60;

        return {
          id: slot.id,
          time: `${displayHour}${displayMins} ${ampm}`,
          status: slot.status,
          raw_start_time: slot.start_time,
          duration_minutes: durationMins,
          isManualBooking: isManual,
        };
      });
      setSlots(formattedSlots);
    } catch (error) {
      console.error("Error fetching slots:", error);
    } finally {
      setSlotsLoading(false);
    }
  }, [currentVenueId, activeGroundId, selectedDate]);

  const fetchBookings = useCallback(async () => {
    if (!activeGroundId || !currentVenueId) return;
    setBookingsLoading(true);
    try {
      const localDateString = getLocalDateString(selectedDate);
      const bookingsData = await SportsService.getBookings(
        currentVenueId,
        activeGroundId,
        localDateString,
      );
      const now = new Date();

      const formattedBookings: BookingData[] = (bookingsData || [])
        .filter((b: any) => {
          const bookingStat = b.booking_status?.toLowerCase().trim();
          const oldStat = b.status?.toLowerCase().trim();
          const sltStat = b.slot_status?.toLowerCase().trim();

          const isCancelledOrRefunded = [bookingStat, oldStat].some(
            val => val === "cancelled" || val === "refunded",
          );

          if (isCancelledOrRefunded) {
            return false;
          }

          if (sltStat === "available") {
            return false;
          }

          return true;
        })
        .map((b: any) => {
          const formatTime = (timeStr: string) => {
            if (!timeStr) return "";
            const [h, m] = timeStr.split(":");
            const hourInt = parseInt(h, 10);
            const ampm = hourInt >= 12 ? "PM" : "AM";
            const displayHour = hourInt % 12 || 12;
            const displayMins = m === "00" ? "" : `:${m}`;
            return `${displayHour}${displayMins} ${ampm}`;
          };

          const formattedDate = new Date(b.slot_date).toLocaleDateString("en-GB", {
            weekday: "short",
            day: "numeric",
            month: "short",
            year: "numeric",
          });

          // DETERMINING OFFLINE VS ONLINE
          const isOnline = b.booking_source === "online";
          const isOffline = !isOnline;
          const isPickleball = category.toLowerCase() === "pickleball";

          // TIME CALCULATIONS (WITH MIDNIGHT FIX)
          let [endH, endM] = b.end_time.split(":").map(Number);

          // FIX: Treat 00:00:00 as 24:00 for the end of the day bound so it doesn't immediately gray out
          if (endH === 0 && endM === 0) {
            endH = 24;
          }

          const slotEndTime = new Date(b.slot_date);
          slotEndTime.setHours(endH, endM, 0, 0);

          const isDisabled = now > slotEndTime;
          const isUnpaid = Number(b.paid_amount || 0) < Number(b.total_amount || 0);

          const finalName = isOffline ? b.guest_name : b.full_name || "Guest User";
          const finalPhone = isOffline ? b.guest_phone || "" : b.phone || "";

          // For online Pickleball, use subtotal. Otherwise use paid_amount + discount_amount.
          const displayPrice =
            isOnline && isPickleball
              ? Number(b.subtotal || 0)
              : Number(b.paid_amount || 0) + Number(b.discount_amount || 0);

          return {
            id: b.id,
            name: finalName,
            phone: finalPhone,
            date: formattedDate,
            time: `${formatTime(b.start_time)} - ${formatTime(b.end_time)}`,
            price: `₹${displayPrice}`,
            status: isOnline ? "Online" : "Offline",
            avatarUrl: b.avatar_url,
            isOfflineRecord: isOffline,
            isDisabled,
            isPaymentPending: isDisabled && isUnpaid,
            startTimeRaw: b.start_time,
            endTimeRaw: b.end_time,
            notes: b.notes,
            idChain: [b.id],
            parent_booking_id: b.parent_booking_id,
            booking_group_id: b.booking_group_id,
            sports_booking_type: b.sports_booking_type,
            sequence_number: b.sequence_number,
            rawSubtotal: Number(b.subtotal || 0), // Keep raw values for merged calculation
            rawPaidAmount: Number(b.paid_amount || 0),
            rawDiscountAmount: Number(b.discount_amount || 0),
            isOnline,
            isPickleball,
          };
        });

      // Sort chronological by start time
      const sortedBookings = [...formattedBookings].sort((a, b) => {
        return (a.startTimeRaw || "").localeCompare(b.startTimeRaw || "");
      });

      // Refined Merge: Use database-backed grouping IDs
      const merged = sortedBookings.reduce((acc, current) => {
        const existing = acc.find(b => {
          // 1. Group by booking_group_id (User multi-slot)
          if (
            current.booking_group_id &&
            b.booking_group_id === current.booking_group_id &&
            b.date === current.date
          ) {
            return true;
          }

          // 2. Group by parent_booking_id (Vendor extension)
          const existingParentId = b.parent_booking_id || b.id;
          if (
            current.parent_booking_id &&
            existingParentId === current.parent_booking_id &&
            b.date === current.date
          ) {
            return true;
          }

          return false;
        });

        if (existing) {
          // Merge the time and price
          // We assume sortedBookings is chronological, so we just update the end time
          existing.time = existing.time.replace(/ - .*/, "") + " - " + current.time.split(" - ")[1];
          existing.endTimeRaw = current.endTimeRaw;

          const isOnlinePickleball = existing.isOnline && existing.isPickleball;

          // Recalculate summed amounts
          const newSumSubtotal = (existing.rawSubtotal || 0) + (current.rawSubtotal || 0);
          const newSumPaid = (existing.rawPaidAmount || 0) + (current.rawPaidAmount || 0);
          const newSumDiscount =
            (existing.rawDiscountAmount || 0) + (current.rawDiscountAmount || 0);

          existing.rawSubtotal = newSumSubtotal;
          existing.rawPaidAmount = newSumPaid;
          existing.rawDiscountAmount = newSumDiscount;

          // Update display price based on logic
          const finalDisplayPrice = isOnlinePickleball
            ? newSumSubtotal
            : newSumPaid + newSumDiscount;
          existing.price = `₹${finalDisplayPrice}`;

          existing.idChain.push(current.id);
        } else {
          acc.push(current);
        }
        return acc;
      }, [] as BookingData[]);

      // Finally, sort by status (upcoming first)
      const finalSorted = [...merged].sort((a, b) => {
        if (a.isDisabled !== b.isDisabled) {
          return a.isDisabled ? 1 : -1;
        }
        return (a.startTimeRaw || "").localeCompare(b.startTimeRaw || "");
      });

      setBookings(finalSorted);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setBookingsLoading(false);
    }
  }, [currentVenueId, activeGroundId, selectedDate, category]);

  useEffect(() => {
    if (initialVenueId) fetchVenueDetails();
  }, [initialVenueId, category, fetchVenueDetails]);

  useEffect(() => {
    fetchSlots();
    fetchBookings();
  }, [fetchSlots, fetchBookings]);

  // Real-time listener for BOTH bookings AND slots
  useEffect(() => {
    if (!currentVenueId) return;

    const channel = supabase
      .channel(`sports_sync_${currentVenueId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "sports_bookings",
          filter: `venue_id=eq.${currentVenueId}`,
        },
        () => {
          fetchBookings();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "sports_slots",
          filter: `venue_id=eq.${currentVenueId}`,
        },
        () => {
          fetchSlots();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentVenueId, fetchSlots, fetchBookings]);

  const handleRefresh = useCallback(async () => {
    await Promise.all([fetchSlots(), fetchBookings()]);
  }, [fetchSlots, fetchBookings]);

  return {
    venue,
    grounds,
    activeGroundId,
    setActiveGroundId,
    selectedDate,
    setSelectedDate,
    slots,
    slotsLoading,
    bookings,
    bookingsLoading,
    loading,
    availableCategories,
    refresh: handleRefresh,
  };
};
