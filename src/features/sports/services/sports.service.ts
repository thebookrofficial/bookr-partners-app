// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import { supabase } from "@/lib/supabase";

export const SportsService = {
  // --- HOME SCREEN FETCHES ---
  async getVenueDetails(initialVenueId: string, _dbSportType: string) {
    const { data: venue, error } = await supabase
      .from("venues")
      .select(`id, name, vertical, cover_image_url, owner_id, sports_venues ( sports_type )`)
      .eq("id", initialVenueId)
      .single();

    if (error || !venue) throw error || new Error("Venue not found");

    return { initialVenue: venue, matchedVenue: venue };
  },

  async getAllVendorSportsCategories(ownerId: string) {
    const { data } = await supabase
      .from("venues")
      .select(`sports_venues!inner ( sports_type )`)
      .eq("owner_id", ownerId);
    return data;
  },

  async getGrounds(venueId: string) {
    const { data, error } = await supabase
      .from("sports_grounds")
      .select("id, name")
      .eq("venue_id", venueId)
      .order("display_order", { ascending: true });
    if (error) throw error;
    return data;
  },

  async getSlots(venueId: string, groundId: string, dateStr: string) {
    const { data, error } = await supabase
      .from("sports_slots")
      .select(
        `id, start_time, end_time, status, sports_bookings ( platform_fee, gateway_fee, user_id, booking_status, sports_booking_type, booking_source )`,
      )
      .eq("venue_id", venueId)
      .eq("ground_id", groundId)
      .eq("slot_date", dateStr)
      .order("start_time", { ascending: true });
    if (error) throw error;
    return data;
  },

  async getBookings(
    venueId: string,
    groundId: string,
    dateStr: string,
    mode: "exact" | "gt" = "exact",
  ) {
    let query = supabase
      .from("sports_bookings")
      .select(
        `
        id, user_id, venue_id, slot_id, booking_status, subtotal, discount_amount, platform_fee, gateway_fee, total_amount, vendor_payout, paid_amount, guest_name, guest_phone, notes, created_at,
        parent_booking_id, booking_group_id, sports_booking_type, sequence_number, booking_source,
        profiles ( full_name, phone, avatar_url ),
        sports_slots!inner ( id, start_time, end_time, slot_date, status, ground_id )
      `,
      )
      .eq("venue_id", venueId)
      .eq("sports_slots.ground_id", groundId);

    if (mode === "exact") {
      query = query.eq("sports_slots.slot_date", dateStr);
    } else {
      query = query.gt("sports_slots.slot_date", dateStr);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data || [])
      .filter((b: any) => {
        const bookingStatus = (b.booking_status || "").toLowerCase().trim();
        const slot = Array.isArray(b.sports_slots) ? b.sports_slots[0] : b.sports_slots;
        const slotStatus = (slot?.status || "").toLowerCase().trim();

        if (
          bookingStatus === "cancelled" ||
          bookingStatus === "refunded" ||
          bookingStatus === "rescheduled"
        )
          return false;
        if (slotStatus === "available") return false;

        return true;
      })
      .map((b: any) => {
        const profile = Array.isArray(b.profiles) ? b.profiles[0] : b.profiles;
        const slot = Array.isArray(b.sports_slots) ? b.sports_slots[0] : b.sports_slots;

        return {
          ...b,
          full_name: profile?.full_name,
          phone: profile?.phone,
          avatar_url: profile?.avatar_url,
          start_time: slot?.start_time,
          end_time: slot?.end_time,
          slot_date: slot?.slot_date,
          slot_status: slot?.status,
        };
      });
  },

  // --- OFFLINE BOOKING FETCHES & MUTATIONS ---
  async getUnavailableSlotsForDate(groundId: string, dateStr: string) {
    const { data, error } = await supabase
      .from("sports_slots")
      .select("start_time")
      .eq("ground_id", groundId)
      .eq("slot_date", dateStr)
      .neq("status", "available");
    if (error) throw error;
    return data;
  },

  async getVenuePricing(venueId: string) {
    const { data, error } = await supabase
      .from("sports_venues")
      .select("price_per_slot, weekend_price_per_slot, slot_duration_minutes")
      .eq("venue_id", venueId)
      .single();

    if (error) throw error;

    return {
      price_per_hour: data.price_per_slot,
      day_price: data.price_per_slot,
      night_price: data.price_per_slot,
      min_advance_amount: 0,
      slot_duration_minutes: data.slot_duration_minutes || 60,
    };
  },

  async lookupGuestProfile(cleanMobile: string) {
    const tenDigitNumber = cleanMobile.length >= 10 ? cleanMobile.slice(-10) : cleanMobile;

    const phoneVariants = [
      tenDigitNumber,
      `+91${tenDigitNumber}`,
      `+91 ${tenDigitNumber}`,
      `91${tenDigitNumber}`,
    ];

    try {
      const [profileResult, manualBookingResult] = await Promise.all([
        supabase.rpc("lookup_user_by_phone", { search_phones: phoneVariants }).maybeSingle(),
        supabase
          .from("sports_bookings")
          .select("guest_name, guest_phone, user_id")
          .in("guest_phone", phoneVariants)
          .not("guest_name", "is", null)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      const profile = profileResult.data as { id: string; full_name: string; phone: string } | null;
      const manualBooking = manualBookingResult.data as {
        guest_name: string;
        guest_phone: string;
        user_id: string;
      } | null;

      let foundName = profile?.full_name || manualBooking?.guest_name || "";
      let historyCount = 0;

      if (profile?.id) {
        const { count } = await supabase
          .from("sports_bookings")
          .select("id", { count: "exact", head: true })
          .eq("user_id", profile.id);
        historyCount += count || 0;
      }

      const { count: guestCount } = await supabase
        .from("sports_bookings")
        .select("id", { count: "exact", head: true })
        .in("guest_phone", phoneVariants);

      historyCount += guestCount || 0;

      return { profile, foundName, hasHistory: historyCount > 0 };
    } catch (err) {
      console.error("Critical Lookup Failure:", err);
      return { profile: null, foundName: "", hasHistory: false };
    }
  },

  async createOfflineBooking(params: {
    venueId: string;
    groundId: string;
    dateStr: string;
    startTime24: string;
    endTime24: string;
    numericTotal: number;
    advancePaid: number;
    basePaidAmount?: number;
    paymentMethod?: string;
    guestName: string;
    guestPhone: string;
    bookingSource: string;
    sportsBookingType: string;
    slotDurationMinutes?: number;
    notesOverride?: string;
    bookingGroupIdOverride?: string | null;
    isRescheduled?: boolean;
    originalBookingId?: string | null;
  }) {
    const [startH, startM] = params.startTime24.split(":").map(Number);
    const [endH, endM] = params.endTime24.split(":").map(Number);
    const startTotalM = startH * 60 + startM;
    const endTotalM = endH * 60 + endM;
    const durationM = endTotalM - startTotalM;
    const slotDuration = params.slotDurationMinutes || 60;
    const totalSlots = durationM / slotDuration;

    if (durationM <= 0) throw new Error("Invalid time range selected.");

    const isMultiSlot = totalSlots > 1;
    const finalBookingType = isMultiSlot ? "multi_slot" : "standard";
    const hourlyPrice = params.numericTotal / totalSlots;

    const isLoggingPayment = params.advancePaid > 0 && params.paymentMethod;
    const amountToDistribute =
      (params.basePaidAmount || 0) + (isLoggingPayment ? 0 : params.advancePaid);
    const hourlyPaid = amountToDistribute / totalSlots;

    const generateUUID = () => {
      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
        /* eslint-disable no-bitwise */
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        /* eslint-enable no-bitwise */
        return v.toString(16);
      });
    };

    const bookingGroupId = isMultiSlot ? generateUUID() : null;
    const firstBookingId = generateUUID();
    const slotPromises = Array.from({ length: totalSlots }).map(async (_, i) => {
      const currentStartM = startTotalM + i * slotDuration;
      const currentEndM = currentStartM + slotDuration;

      const sh = Math.floor(currentStartM / 60);
      const sm = currentStartM % 60;
      const currentStart = `${sh.toString().padStart(2, "0")}:${sm.toString().padStart(2, "0")}:00`;

      const eh = Math.floor(currentEndM / 60);
      const em = currentEndM % 60;
      const currentEnd =
        eh === 24
          ? "23:59:59"
          : `${eh.toString().padStart(2, "0")}:${em.toString().padStart(2, "0")}:00`;

      const { data: newSlot, error: insertError } = await supabase
        .from("sports_slots")
        .insert({
          venue_id: params.venueId,
          ground_id: params.groundId,
          slot_date: params.dateStr,
          start_time: currentStart,
          end_time: currentEnd,
          price: hourlyPrice,
          status: "booked",
        })
        .select("id")
        .maybeSingle();

      let slotId = newSlot?.id;

      if (insertError || !slotId) {
        const { data: foundSlot } = await supabase
          .from("sports_slots")
          .select("id, status")
          .eq("venue_id", params.venueId)
          .eq("ground_id", params.groundId)
          .eq("slot_date", params.dateStr)
          .eq("start_time", currentStart)
          // .eq("end_time", currentEnd)
          .single();

        if (foundSlot && foundSlot.status !== "available") {
          const format12H = (t: string) => {
            const [hStr, mStr] = t.split(":");
            const h = parseInt(hStr, 10);
            const m = parseInt(mStr, 10);
            const ampm = h >= 12 ? "PM" : "AM";
            const displayH = h % 12 || 12;
            const displayM = m === 0 ? "" : `:${m.toString().padStart(2, "0")}`;
            return `${displayH}${displayM} ${ampm}`;
          };
          throw new Error(
            `The time slot from ${format12H(currentStart)} to ${format12H(
              currentEnd,
            )} is already booked.`,
          );
        }
        slotId = foundSlot?.id;

        // CRITICAL FIX: Update the existing slot's status to booked and enforce the exact end_time selected!
        if (slotId) {
          await supabase
            .from("sports_slots")
            .update({
              status: "booked",
              end_time: currentEnd,
            })
            .eq("id", slotId);
        }
      }

      if (!slotId) throw new Error(`Could not resolve slot for ${currentStart}`);

      return { slotId, i };
    });

    // Run all slot inserts/updates concurrently to drastically reduce loading time
    const resolvedSlots = await Promise.all(slotPromises);

    const bookingsToInsert = resolvedSlots.map(({ slotId, i }) => ({
      id: i === 0 ? firstBookingId : generateUUID(),
      user_id: null,
      guest_name: params.guestName,
      guest_phone: params.guestPhone,
      venue_id: params.venueId,
      slot_id: slotId,
      booking_status: "confirmed",
      subtotal: hourlyPrice,
      discount_amount: 0,
      platform_fee: 0,
      gateway_fee: 0,
      total_amount: hourlyPrice,
      vendor_payout: hourlyPrice,
      paid_amount: hourlyPaid,
      booking_source: params.bookingSource,
      sports_booking_type: finalBookingType,
      booking_group_id:
        params.bookingGroupIdOverride !== undefined
          ? params.bookingGroupIdOverride
          : bookingGroupId,
      parent_booking_id: i === 0 ? null : firstBookingId,
      sequence_number: i + 1,
      notes:
        params.notesOverride ||
        `Manual Offline Booking ${isMultiSlot ? `(Slot ${i + 1}/${totalSlots})` : ""}`,
      is_rescheduled: params.isRescheduled || false,
      original_booking_id: params.originalBookingId || null,
    }));

    const { error: bookingError } = await supabase.from("sports_bookings").insert(bookingsToInsert);

    if (bookingError) throw bookingError;

    // Update all historical bookings for this phone number at this venue to reflect the new/updated name
    try {
      if (params.guestPhone) {
        await supabase
          .from("sports_bookings")
          .update({ guest_name: params.guestName })
          .eq("venue_id", params.venueId)
          .eq("guest_phone", params.guestPhone);
      }
    } catch (err) {
      console.error("Failed to update historical guest names:", err);
    }

    if (params.advancePaid > 0 && params.paymentMethod) {
      try {
        // Use the exact enum values: cash, gpay, phonepe, paytm, etc.
        const backendMethod = [
          "gpay",
          "phonepe",
          "paytm",
          "cash",
          "card",
          "bank_transfer",
          "other",
        ].includes(params.paymentMethod)
          ? params.paymentMethod
          : "upi";

        let noteText = "CASH";
        if (params.paymentMethod === "gpay") noteText = "GPAY";
        if (params.paymentMethod === "phonepe") noteText = "PHONEPE";
        if (params.paymentMethod === "paytm") noteText = "PAYTM";

        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData?.session?.user?.id;

        const { error: insertError } = await supabase.from("offline_payment_logs").insert({
          booking_id: firstBookingId,
          booking_vertical: "sports",
          amount: params.advancePaid,
          payment_mode: backendMethod,
          note: noteText,
          logged_by: userId,
        });

        if (insertError) {
          console.error("Direct insert error logging payment:", insertError);
        }
      } catch (err) {
        console.error("Failed to log initial offline payment:", err);
      }
    }

    return firstBookingId;
  },

  async rescheduleBooking(bookingId: string, newSlotId: string) {
    try {
      const { error } = await supabase.rpc("reschedule_sports_booking", {
        p_booking_id: bookingId,
        p_new_slot_id: newSlotId,
      });

      if (error) {
        console.error("Reschedule RPC Error:", error);
        throw new Error(error.message || "Failed to reschedule booking");
      }

      return true;
    } catch (err: any) {
      console.error("rescheduleBooking Error:", err);
      throw err;
    }
  },

  async rescheduleBookingWithRange(params: {
    bookingId: string;
    venueId: string;
    groundId: string;
    dateStr: string;
    fromTime: string;
    toTime: string;
    totalPrice: number;
    addAmount: number;
    paymentMethod?: string;
    slotDurationMinutes?: number;
  }) {
    try {
      // 1. Fetch the old booking to get guest info and booking group
      const { data: oldBooking, error: oldBookingError } = await supabase
        .from("sports_bookings")
        .select("*")
        .eq("id", params.bookingId)
        .single();

      if (oldBookingError || !oldBooking) {
        throw new Error("Could not find the original booking to reschedule.");
      }

      // 2. Find all related bookings if it was a multi-slot booking
      const query = supabase.from("sports_bookings").select("id, slot_id, paid_amount");
      if (oldBooking.booking_group_id) {
        query.eq("booking_group_id", oldBooking.booking_group_id);
      } else {
        query.eq("id", params.bookingId);
      }

      const { data: oldBookings, error: oldBookingsError } = await query;
      if (oldBookingsError) {
        throw new Error("Failed to fetch related bookings for rescheduling.");
      }

      let totalPreviousPaid = 0;
      const oldBookingIds: string[] = [];
      const oldSlotIds: string[] = [];

      if (oldBookings && oldBookings.length > 0) {
        for (const b of oldBookings) {
          oldBookingIds.push(b.id);
          oldSlotIds.push(b.slot_id);
          totalPreviousPaid += Number(b.paid_amount || 0);
        }
      }

      // 3. Pre-check slot availability before cancelling the old ones!
      const parseTime = (timeStr: string) => {
        const timeMatch = timeStr.match(/^(\d+)(?::(\d+))?\s*(AM|PM)?/i);
        if (!timeMatch) return "00:00";
        let h = parseInt(timeMatch[1], 10);
        const m = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
        const ampm = timeMatch[3]?.toUpperCase();
        if (ampm === "PM" && h !== 12) h += 12;
        if (ampm === "AM" && h === 12) h = 0;
        return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
      };

      const startTime24 = parseTime(params.fromTime);
      const endTime24 = parseTime(params.toTime);

      const [startH, startM] = startTime24.split(":").map(Number);
      const [endH, endM] = endTime24.split(":").map(Number);
      const startTotalM = startH * 60 + startM;
      const endTotalM = endH * 60 + endM;
      const slotDuration = params.slotDurationMinutes || 60;
      const totalSlots = (endTotalM - startTotalM) / slotDuration;

      const newStartTimes = Array.from({ length: totalSlots }).map((_, i) => {
        const currentM = startTotalM + i * slotDuration;
        const sh = Math.floor(currentM / 60);
        const sm = currentM % 60;
        return `${sh.toString().padStart(2, "0")}:${sm.toString().padStart(2, "0")}:00`;
      });

      const { data: existingSlots } = await supabase
        .from("sports_slots")
        .select("id, start_time, status")
        .eq("venue_id", params.venueId)
        .eq("ground_id", params.groundId)
        .eq("slot_date", params.dateStr)
        .in("start_time", newStartTimes);

      if (existingSlots) {
        for (const slot of existingSlots) {
          if (slot.status !== "available" && !oldSlotIds.includes(slot.id)) {
            const format12H = (t: string) => {
              const [hStr, mStr] = t.split(":");
              const h = parseInt(hStr, 10);
              const m = parseInt(mStr, 10);
              const ampm = h >= 12 ? "PM" : "AM";
              const displayH = h % 12 || 12;
              const displayM = m === 0 ? "" : `:${m.toString().padStart(2, "0")}`;
              return `${displayH}${displayM} ${ampm}`;
            };
            const cm =
              parseInt(slot.start_time.split(":")[0], 10) * 60 +
              parseInt(slot.start_time.split(":")[1], 10);
            const em = cm + slotDuration;
            const endHStr = Math.floor(em / 60)
              .toString()
              .padStart(2, "0");
            const endMStr = (em % 60).toString().padStart(2, "0");
            throw new Error(
              `The time slot from ${format12H(slot.start_time)} to ${format12H(
                `${endHStr}:${endMStr}:00`,
              )} is already booked.`,
            );
          }
        }
      }

      if (oldBookings && oldBookings.length > 0) {
        // 4. Mark old bookings and free up slots concurrently
        await Promise.all([
          supabase
            .from("sports_bookings")
            .update({ booking_status: "rescheduled" })
            .in("id", oldBookingIds),
          supabase.from("sports_slots").update({ status: "available" }).in("id", oldSlotIds),
        ]);
      }

      // 6. Create the new booking using the exact same flow as offline bookings
      await this.createOfflineBooking({
        venueId: params.venueId,
        groundId: params.groundId,
        dateStr: params.dateStr,
        startTime24,
        endTime24,
        numericTotal:
          params.totalPrice > 0 ? params.totalPrice : Number(oldBooking.total_amount || 0),
        advancePaid: params.addAmount > 0 ? params.addAmount : 0,
        basePaidAmount: totalPreviousPaid,
        paymentMethod: params.addAmount > 0 ? params.paymentMethod : undefined,
        guestName: oldBooking.guest_name || "Guest",
        guestPhone: oldBooking.guest_phone || "",
        bookingSource: oldBooking.booking_source || "vendor_app",
        sportsBookingType: oldBooking.sports_booking_type || "standard",
        slotDurationMinutes: params.slotDurationMinutes,
        bookingGroupIdOverride: oldBooking.booking_group_id || oldBooking.id,
        notesOverride: `Rescheduled from Booking ID: ${oldBooking.id}`,
        isRescheduled: true,
        originalBookingId: oldBooking.id,
      });

      return true;
    } catch (err: any) {
      console.error("Reschedule Error:", err);
      throw err;
    }
  },

  async lookupGuestsByName(venueId: string, nameQuery: string) {
    if (!nameQuery || nameQuery.trim().length < 1) return [];

    try {
      const { data, error } = await supabase
        .from("sports_bookings")
        .select("guest_name, guest_phone")
        .eq("venue_id", venueId)
        .ilike("guest_name", `%${nameQuery}%`)
        .not("guest_name", "is", null)
        .order("guest_name", { ascending: true })
        .limit(30);

      if (error) throw error;

      const uniqueResults: { name: string; phone: string }[] = [];
      const seen = new Set<string>();

      (data || []).forEach((item: any) => {
        const name = item.guest_name?.trim();
        const phone = item.guest_phone?.trim();
        if (name && phone) {
          const key = `${name.toLowerCase()}_${phone}`;
          if (!seen.has(key)) {
            seen.add(key);
            uniqueResults.push({ name, phone });
          }
        }
      });

      return uniqueResults;
    } catch (err) {
      console.error("Error looking up guests by name:", err);
      return [];
    }
  },
};
