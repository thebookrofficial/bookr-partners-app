// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import { supabase } from "@/lib/supabase";

export const SportsService = {
  // --- HOME SCREEN FETCHES ---
  // --- HOME SCREEN FETCHES ---
  async getVenueDetails(initialVenueId: string, _dbSportType: string) {
    // CRITICAL FIX: We no longer try to "find" a venue based on the category string.
    // We strictly load the exact Venue ID that the user clicked on the dashboard!
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
        `id, start_time, end_time, status, sports_bookings ( platform_fee, gateway_fee, user_id, booking_status )`,
      )
      .eq("venue_id", venueId)
      .eq("ground_id", groundId)
      .eq("slot_date", dateStr)
      .order("start_time", { ascending: true });
    if (error) throw error;
    return data;
  },

  // CRITICAL FIX: Replaced RPC with a robust Supabase relational query
  async getBookings(venueId: string, groundId: string, dateStr: string) {
    const { data, error } = await supabase
      .from("sports_bookings")
      .select(
        `
        id, user_id, venue_id, slot_id, booking_status, subtotal, discount_amount, platform_fee, gateway_fee, total_amount, vendor_payout, paid_amount, guest_name, guest_phone, notes, created_at,
        profiles ( full_name, phone, avatar_url ),
        sports_slots!inner ( id, start_time, end_time, slot_date, status, ground_id )
      `,
      )
      .eq("venue_id", venueId)
      .eq("sports_slots.ground_id", groundId)
      .eq("sports_slots.slot_date", dateStr);

    if (error) throw error;

    return (data || [])
      .filter((b: any) => {
        const bookingStatus = (b.booking_status || "").toLowerCase().trim();
        const slot = Array.isArray(b.sports_slots) ? b.sports_slots[0] : b.sports_slots;
        const slotStatus = (slot?.status || "").toLowerCase().trim();

        // Exclude cancelled/refunded bookings
        if (bookingStatus === "cancelled" || bookingStatus === "refunded") return false;

        // The Magic Bullet: If the slot was released (available), this booking is dead. Remove it.
        if (slotStatus === "available") return false;

        return true;
      })
      .map((b: any) => {
        // Flatten the relationships to match what `useSportsHome.ts` expects
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
      .select("price_per_slot, weekend_price_per_slot")
      .eq("venue_id", venueId)
      .single();

    if (error) throw error;

    return {
      price_per_hour: data.price_per_slot,
      day_price: data.price_per_slot,
      night_price: data.price_per_slot,
      min_advance_amount: 0,
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
    guestName: string;
    guestPhone: string;
  }) {
    const { data: newSlot, error: insertError } = await supabase
      .from("sports_slots")
      .insert({
        venue_id: params.venueId,
        ground_id: params.groundId,
        slot_date: params.dateStr,
        start_time: params.startTime24,
        end_time: params.endTime24,
        price: params.numericTotal,
        status: "booked",
      })
      .select("id")
      .maybeSingle();

    let slotId = newSlot?.id;

    // If insertion failed (e.g., slot already exists), fetch the existing slot
    if (insertError || !slotId) {
      const { data: foundSlot } = await supabase
        .from("sports_slots")
        .select("id, status")
        .eq("venue_id", params.venueId)
        .eq("ground_id", params.groundId)
        .eq("slot_date", params.dateStr)
        .eq("start_time", params.startTime24)
        .eq("end_time", params.endTime24)
        .single();

      // CRITICAL FIX: Removed the buggy `&& !insertError` check
      if (foundSlot && foundSlot.status !== "available") {
        throw new Error("This slot is already taken or blocked.");
      }
      slotId = foundSlot?.id;
    }

    if (!slotId) throw new Error("Could not resolve Slot ID.");

    const { data: booking, error: bookingError } = await supabase
      .from("sports_bookings")
      .insert({
        user_id: null,
        guest_name: params.guestName,
        guest_phone: params.guestPhone,
        venue_id: params.venueId,
        slot_id: slotId,
        booking_status: "confirmed",
        subtotal: params.numericTotal,
        discount_amount: 0,
        platform_fee: 0,
        gateway_fee: 0,
        total_amount: params.numericTotal,
        vendor_payout: params.numericTotal,
        notes: `Manual Offline Booking`,
        paid_amount: params.advancePaid,
      })
      .select("id")
      .single();

    if (bookingError) throw bookingError;
    return booking.id;
  },
};
