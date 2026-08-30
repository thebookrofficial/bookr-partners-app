// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import { useState, useEffect, useCallback, useRef } from "react";
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
  parent_ground_id?: string | null;
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
  slotDateRaw?: string;
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

export const getShortGroundName = (groundName: string, category: string) => {
  if (!groundName || !category) return groundName;
  const lowerCat = category.replace(/_/g, " ").toLowerCase();
  const lowerGround = groundName.toLowerCase();

  if (lowerGround.startsWith(lowerCat + " ")) {
    const stripped = groundName.substring(lowerCat.length + 1).trim();
    return stripped.charAt(0).toUpperCase() + stripped.slice(1);
  }
  return groundName;
};

// Helper to format raw database sports_type into beautiful display names
const formatCategoryName = (dbName: string | null | undefined) => {
  if (!dbName) return "";
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

export const useSportsHome = (
  initialVenueId: string,
  category: string,
  selectedView: string = "Today Bookings",
) => {
  const [currentVenueId, setCurrentVenueId] = useState<string>(initialVenueId);
  const [venue, setVenue] = useState<VenueData | null>(null);
  const [grounds, setGrounds] = useState<GroundData[]>([]);
  const [activeGroundId, setActiveGroundId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [slots, setSlots] = useState<SlotData[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);

  // Reset state when venue or category changes to avoid stale data leakage
  useEffect(() => {
    setLoading(true);
    setVenue(null);
    setGrounds([]);
    setActiveGroundId("");
    setSlots([]);
    setBookings([]);
    setSlotsLoading(true);
    setBookingsLoading(true);
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

      // 1. FIRE INSTANTLY, IN PARALLEL (Do NOT wait for venueDetails to get grounds)
      const venuePromise = SportsService.getVenueDetails(initialVenueId, dbSportType);
      const groundsPromise = SportsService.getGrounds(initialVenueId);

      // 2. Wait for grounds first (fast) so we can fire slots & bookings ASAP!
      const groundsData = await groundsPromise;
      let firstGroundId = "";

      if (groundsData && groundsData.length > 0) {
        // Derive available categories directly from the registered grounds
        const uniqueCatStrings = Array.from(
          new Set(groundsData.map((g: any) => g.sports_type).filter(Boolean)),
        ) as string[];
        setAvailableCategories(uniqueCatStrings.map(formatCategoryName));

        // Filter grounds by the active category and format names
        const filteredGrounds = groundsData
          .filter((g: any) => {
            // Inherit sports_type from parent if null
            let groundType = g.sports_type;
            if (!groundType && g.parent_ground_id) {
              const parent = groundsData.find((p: any) => p.id === g.parent_ground_id);
              if (parent) groundType = parent.sports_type;
            }
            return groundType === dbSportType;
          })
          .map((g: any) => ({
            ...g,
            original_name: g.name,
            name: getShortGroundName(g.name, dbSportType),
          }));

        if (filteredGrounds.length > 0) {
          firstGroundId = filteredGrounds[0].id;
          setGrounds(filteredGrounds);
          setActiveGroundId(firstGroundId);

          // BOOM! Fire slots and bookings IMMEDIATELY after grounds load
          // This completely bypasses the venueDetails and categories waterfall!
          fetchSlots(firstGroundId, initialVenueId);
          fetchBookings(firstGroundId, initialVenueId);
        } else {
          setGrounds([]);
          setActiveGroundId("");
          setSlots([]);
          setBookings([]);
        }
      } else {
        setGrounds([]);
        setActiveGroundId("");
        setSlots([]);
        setBookings([]);
      }

      // 3. Now wait for venue details
      const { matchedVenue } = await venuePromise;

      if (matchedVenue) {
        setCurrentVenueId(matchedVenue.id);
        setVenue({
          id: matchedVenue.id,
          name: matchedVenue.name,
          vertical: matchedVenue.vertical,
          cover_image_url: matchedVenue.cover_image_url,
        });
      } else {
        setVenue(null);
      }
    } catch (error) {
      console.error("Error fetching sports home data:", error);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialVenueId, category]);

  const fetchSlots = useCallback(
    async (overrideGroundId?: string, overrideVenueId?: string) => {
      const gId = overrideGroundId || activeGroundId;
      const vId = overrideVenueId || currentVenueId;
      if (!gId || !vId) return;
      setSlotsLoading(true);
      try {
        const localDateString = getLocalDateString(selectedDate);
        const allSlotsData = await SportsService.getAllVenueSlots(vId, localDateString);

        const rawSlots = allSlotsData || [];
        const currentGroundSlots = rawSlots.filter(s => s.ground_id === gId);

        const parentId = grounds.find(g => g.id === gId)?.parent_ground_id;
        const childIds = grounds.filter(g => g.parent_ground_id === gId).map(g => g.id);
        const parentSlots = parentId ? rawSlots.filter(s => s.ground_id === parentId) : [];
        const childrenSlots =
          childIds.length > 0 ? rawSlots.filter(s => childIds.includes(s.ground_id)) : [];

        const formattedSlots: SlotData[] = currentGroundSlots.map((slot: any) => {
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

          let isOnline = validBooking
            ? validBooking.booking_source === "online" ||
              (validBooking.platform_fee && parseFloat(validBooking.platform_fee) > 0)
            : false;

          let isManual = validBooking ? !isOnline : false;

          const startH = parseInt(startHStr, 10);
          const startM = parseInt(startMStr, 10);
          const [endH, endM] = slot.end_time.split(":").map(Number);
          let durationMins = endH * 60 + endM - (startH * 60 + startM);
          if (durationMins < 0) durationMins += 24 * 60;

          let slotStatus = slot.status;
          if (slotStatus === "available") {
            let derivedBooking = null;

            // Check Parent Slots overlapping this time
            if (parentId) {
              const matchingParentSlot = parentSlots.find(
                (ps: any) => ps.start_time <= slot.start_time && ps.end_time > slot.start_time,
              );
              if (matchingParentSlot && matchingParentSlot.status !== "available") {
                slotStatus = matchingParentSlot.status; // Derived status
                derivedBooking = matchingParentSlot.sports_bookings?.find((b: any) => {
                  const bStatus = (b.booking_status || "").toLowerCase().trim();
                  return bStatus !== "cancelled" && bStatus !== "refunded";
                });
              }
            }

            // Check Child Slots overlapping this time
            if (childIds.length > 0 && slotStatus === "available") {
              const matchingChildSlots = childrenSlots.filter(
                (cs: any) => cs.start_time <= slot.start_time && cs.end_time > slot.start_time,
              );
              const blockedChild = matchingChildSlots.find((cs: any) => cs.status !== "available");
              if (blockedChild) {
                slotStatus = blockedChild.status; // Derived status
                derivedBooking = blockedChild.sports_bookings?.find((b: any) => {
                  const bStatus = (b.booking_status || "").toLowerCase().trim();
                  return bStatus !== "cancelled" && bStatus !== "refunded";
                });
              }
            }

            if (derivedBooking) {
              isOnline =
                derivedBooking.booking_source === "online" ||
                (derivedBooking.platform_fee && parseFloat(derivedBooking.platform_fee) > 0);
              isManual = !isOnline;
            }
          }

          return {
            id: slot.id,
            time: `${displayHour}${displayMins} ${ampm}`,
            status: slotStatus,
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
    },
    [activeGroundId, currentVenueId, selectedDate, grounds],
  );

  const fetchBookings = useCallback(
    async (overrideGroundId?: string, overrideVenueId?: string) => {
      const gId = overrideGroundId || activeGroundId;
      const vId = overrideVenueId || currentVenueId;
      if (!gId || !vId) return;
      setBookingsLoading(true);
      try {
        const parentId = grounds.find(g => g.id === gId)?.parent_ground_id;
        const childIds = grounds.filter(g => g.parent_ground_id === gId).map(g => g.id);
        const relevantGroundIds = [gId, ...(parentId ? [parentId] : []), ...childIds];

        let mode: "exact" | "gt" = "exact";
        let targetDate = selectedDate;

        if (selectedView === "Upcoming Bookings") {
          mode = "gt";
          targetDate = new Date(); // fetch > today
        }

        const localDateString = getLocalDateString(targetDate);
        const bookingsData = await SportsService.getBookings(
          vId,
          relevantGroundIds,
          localDateString,
          mode,
        );
        const now = new Date();

        const isHalfHourVenue = (bookingsData || []).some((bk: any) => {
          if (!bk.start_time || !bk.end_time) return false;
          const [sH, sM] = bk.start_time.split(":").map(Number);
          const [eH, eM] = bk.end_time.split(":").map(Number);
          let diff = eH * 60 + eM - (sH * 60 + sM);
          if (diff < 0) diff += 24 * 60;
          return diff === 30;
        });

        const formattedBookings: BookingData[] = (bookingsData || [])
          .filter((b: any) => {
            const bookingStat = b.booking_status?.toLowerCase().trim();
            const oldStat = b.status?.toLowerCase().trim();
            const sltStat = b.slot_status?.toLowerCase().trim();

            const isCancelledOrRefundedOrRescheduled = [bookingStat, oldStat].some(
              val => val === "cancelled" || val === "refunded" || val === "rescheduled",
            );

            if (isCancelledOrRefundedOrRescheduled) {
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

              const displayMins =
                isHalfHourVenue || m !== "00" ? `:${m}` : m === "00" ? "" : `:${m}`;
              return `${displayHour}${displayMins} ${ampm}`;
            };

            let [startH] = b.start_time.split(":").map(Number);
            const displayDateObj = new Date(b.slot_date);
            if (startH < 6) {
              displayDateObj.setDate(displayDateObj.getDate() + 1);
            }

            const formattedDate = displayDateObj.toLocaleDateString("en-GB", {
              weekday: "short",
              day: "numeric",
              month: "short",
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
            if (endH < 6) {
              slotEndTime.setDate(slotEndTime.getDate() + 1);
            }

            const isDisabled = now > slotEndTime;
            const isUnpaid = Number(b.paid_amount || 0) < Number(b.total_amount || 0);

            const finalName = isOffline ? b.guest_name : b.full_name || "Guest User";
            const finalPhone = isOffline ? b.guest_phone || "" : b.phone || "";

            let fetchedGroundName = b.sports_slots?.sports_grounds?.name || "";
            const groundLower = fetchedGroundName.toLowerCase();
            const catName = category.toLowerCase();
            if (catName && groundLower.startsWith(catName)) {
              fetchedGroundName = fetchedGroundName.slice(catName.length).trim();
            }
            if (fetchedGroundName.startsWith("-")) {
              fetchedGroundName = fetchedGroundName.slice(1).trim();
            }

            // For online Pickleball, use subtotal. Otherwise use paid_amount + discount_amount.
            const displayPrice =
              isOnline && isPickleball
                ? Number(b.subtotal || 0)
                : Number(b.paid_amount || 0) + Number(b.discount_amount || 0);

            return {
              id: b.id,
              name: finalName,
              phone: finalPhone,
              subtitle: fetchedGroundName || undefined,
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
              slotDateRaw: b.slot_date,
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

        // Sort chronological by start time and date
        const sortedBookings = [...formattedBookings].sort((a, b) => {
          const dateA = a.slotDateRaw || "";
          const dateB = b.slotDateRaw || "";
          if (dateA !== dateB) {
            return dateA.localeCompare(dateB);
          }
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
            existing.time =
              existing.time.replace(/ - .*/, "") + " - " + current.time.split(" - ")[1];
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
          const dateA = a.slotDateRaw || "";
          const dateB = b.slotDateRaw || "";
          if (dateA !== dateB) {
            return dateA.localeCompare(dateB);
          }
          return (a.startTimeRaw || "").localeCompare(b.startTimeRaw || "");
        });

        setBookings(finalSorted);
      } catch (error) {
        console.error("Error fetching bookings:", error);
      } finally {
        setBookingsLoading(false);
      }
    },
    [activeGroundId, currentVenueId, grounds, selectedDate, selectedView, category],
  );

  useEffect(() => {
    if (initialVenueId) fetchVenueDetails();
  }, [initialVenueId, category, fetchVenueDetails]);

  useEffect(() => {
    fetchSlots();
    fetchBookings();
  }, [fetchSlots, fetchBookings]);

  // Refs to hold the latest fetch callbacks so the Supabase subscription doesn't re-trigger on date/ground changes
  const fetchBookingsRef = useRef(fetchBookings);
  const fetchSlotsRef = useRef(fetchSlots);

  useEffect(() => {
    fetchBookingsRef.current = fetchBookings;
    fetchSlotsRef.current = fetchSlots;
  }, [fetchBookings, fetchSlots]);

  // Real-time listener for BOTH bookings AND slots
  useEffect(() => {
    if (!currentVenueId) return;

    const channelId = `sports_sync_${currentVenueId}_${Date.now()}_${Math.random()
      .toString(36)
      .substring(7)}`;
    const channel = supabase
      .channel(channelId)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "sports_bookings",
          filter: `venue_id=eq.${currentVenueId}`,
        },
        () => {
          fetchBookingsRef.current();
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
          fetchSlotsRef.current();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentVenueId]);

  const handleRefresh = useCallback(async () => {
    await Promise.all([fetchSlots(), fetchBookings()]);
  }, [fetchSlots, fetchBookings]);

  const addOptimisticBooking = useCallback((booking: BookingData) => {
    setBookings(prev => [booking, ...prev]);
  }, []);

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
    addOptimisticBooking,
  };
};
