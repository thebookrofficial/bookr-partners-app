// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import { supabase } from "@/lib/supabase";

export const SportsService = {
  // --- HOME SCREEN FETCHES ---
  async getVenueDetails(initialVenueId: string, dbSportType: string) {
    const { data: initialVenue, error: initialError } = await supabase
      .from("venues")
      .select("owner_id")
      .eq("id", initialVenueId)
      .single();

    if (initialError || !initialVenue) throw initialError || new Error("Owner not found");

    const { data: matchedVenue, error: matchedError } = await supabase
      .from("venues")
      .select(`id, name, vertical, cover_image_url, sports_venues!inner ( sports_type )`)
      .eq("owner_id", initialVenue.owner_id)
      .eq("sports_venues.sports_type", dbSportType)
      .limit(1)
      .maybeSingle();

    if (matchedError) throw matchedError;
    return { initialVenue, matchedVenue };
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
        `id, start_time, end_time, status, sports_bookings ( platform_fee, gateway_fee, user_id )`,
      )
      .eq("venue_id", venueId)
      .eq("ground_id", groundId)
      .eq("slot_date", dateStr)
      .order("start_time", { ascending: true });
    if (error) throw error;
    return data;
  },

  // Inside getBookings function
  async getBookings(venueId: string, groundId: string, dateStr: string) {
    const { data, error } = await supabase.rpc("fetch_venue_bookings_with_profiles", {
      p_venue_id: venueId,
      p_ground_id: groundId,
      p_date: dateStr,
    });

    if (error) throw error;
    return data || [];
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
      // 1. Parallel Lookup
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

      // TYPE FIX: Explicitly cast the responses so TypeScript knows what fields exist
      const profile = profileResult.data as { id: string; full_name: string; phone: string } | null;
      const manualBooking = manualBookingResult.data as {
        guest_name: string;
        guest_phone: string;
        user_id: string;
      } | null;

      // Priority: 1. Profiles table, 2. Previous guest_name column
      let foundName = profile?.full_name || manualBooking?.guest_name || "";

      // 2. Comprehensive History Check
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

      return {
        profile,
        foundName,
        hasHistory: historyCount > 0,
      };
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
    // 1. Check/Insert Slot
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

      if (foundSlot?.status !== "available" && !insertError) {
        throw new Error("This slot is already taken.");
      }
      slotId = foundSlot?.id;
    }

    if (!slotId) throw new Error("Could not resolve Slot ID.");

    // 2. Insert Booking - CRITICAL FIX: user_id is now explicitly null for manual bookings
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
