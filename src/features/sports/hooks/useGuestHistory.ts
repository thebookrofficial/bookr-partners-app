// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export interface HistoryBooking {
  id: string;
  vertical: "sports" | "staycation" | "dining" | "events";
  venue_name: string;
  raw_date: string;
  display_date: string;
  display_time: string;
  total_amount: number;
  status: string;
  booking_status: "past" | "upcoming" | "cancelled";
}

const formatDisplayDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (timeStr: string) => {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":");
  const hourInt = parseInt(h, 10);
  const ampm = hourInt >= 12 && hourInt < 24 ? "PM" : "AM";
  const displayHour = hourInt % 12 || 12;
  return m && m !== "00" ? `${displayHour}:${m} ${ampm}` : `${displayHour} ${ampm}`;
};

export const useGuestHistory = (identifier: string, vertical: string, currentVenueId?: string) => {
  const [history, setHistory] = useState<HistoryBooking[]>([]);
  const [stats, setStats] = useState({ past: 0, upcoming: 0, cancelled: 0 });
  const [guestName, setGuestName] = useState<string>("Guest User");
  const [guestPhone, setGuestPhone] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    if (!identifier || !vertical) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      let resolvedPhone = identifier;
      let userId = "";

      // 1. Resolve UUID
      if (identifier.length === 36 && identifier.includes("-")) {
        const table = vertical === "staycation" ? "staycation_bookings" : "sports_bookings";
        const { data: booking } = await supabase
          .from(table)
          .select("guest_phone, user_id, profiles(phone, full_name)")
          .eq("id", identifier)
          .maybeSingle();

        if (booking) {
          const profile = Array.isArray(booking.profiles) ? booking.profiles[0] : booking.profiles;
          resolvedPhone = booking.guest_phone || profile?.phone || identifier;
          userId = booking.user_id || "";
          if (profile?.full_name) setGuestName(profile.full_name);
        }
      }

      setGuestPhone(resolvedPhone);

      // 2. Resolve Profile Name
      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("phone", resolvedPhone)
        .maybeSingle();

      if (profileData?.full_name) {
        setGuestName(profileData.full_name);
      }

      // 3. Prepare Base Query
      let query;
      if (vertical === "sports") {
        query = supabase.from("sports_bookings").select(`
      id, guest_name, guest_phone, total_amount, platform_fee, gateway_fee, booking_status,
      sports_slots!inner ( slot_date, start_time, end_time, sports_grounds ( name ) )
    `);
      } else {
        query = supabase.from("sports_bookings").select(`
      id, guest_name, guest_phone, total_amount, platform_fee, gateway_fee, booking_status,
      sports_slots!inner ( slot_date, start_time, end_time, sports_grounds ( name ) )
    `);
      }

      // NEW: Filter strictly by Venue ID to stop sports from mixing
      if (currentVenueId) {
        query = query.eq("venue_id", currentVenueId);
      }

      // 4. Execute Main Fetch
      const cleanPhone = resolvedPhone.replace(/[^\d]/g, "");
      const tenDigit = cleanPhone.length >= 10 ? cleanPhone.slice(-10) : cleanPhone;
      const phoneVariants = [tenDigit, `+91${tenDigit}`, `+91 ${tenDigit}`, `91${tenDigit}`];

      let results;
      if (userId) {
        const { data } = await query.or(
          `user_id.eq.${userId},guest_phone.in.(${phoneVariants.map(p => `"${p}"`).join(",")})`,
        );
        results = data;
      } else {
        const { data } = await query.in("guest_phone", phoneVariants);
        results = data;
      }

      let pastCount = 0,
        upcomingCount = 0,
        cancelledCount = 0;
      const filteredBookings: HistoryBooking[] = [];

      (results || []).forEach((b: any) => {
        const isCancelled = b.booking_status?.toLowerCase() === "cancelled";
        let rawDate, displayDate, displayTime, vName, isOnline;

        if (vertical === "sports") {
          const slots = Array.isArray(b.sports_slots)
            ? b.sports_slots
            : [b.sports_slots].filter(Boolean);
          if (slots.length === 0) return;

          slots.sort((s1: any, s2: any) => s1.start_time.localeCompare(s2.start_time));
          const firstSlot = slots[0];
          const lastSlot = slots[slots.length - 1];

          rawDate = firstSlot.slot_date;
          displayDate = formatDisplayDate(rawDate);
          displayTime = `${formatTime(firstSlot.start_time)} - ${formatTime(lastSlot.end_time)}`;
          vName = firstSlot.sports_grounds?.name || "Sports Ground";
          isOnline = b.platform_fee > 0;
        } else {
          rawDate = b.check_in_date;
          displayDate = `${formatDisplayDate(b.check_in_date)} - ${formatDisplayDate(
            b.check_out_date,
          )}`;
          displayTime = "Staycation";
          vName = b.venues?.name || "Staycation Venue";
          isOnline = b.platform_fee && parseFloat(b.platform_fee) > 0;
        }

        const bookingDate = new Date(rawDate);
        bookingDate.setHours(0, 0, 0, 0);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let type: "past" | "upcoming" | "cancelled" = "past";

        if (isCancelled) {
          type = "cancelled";
          cancelledCount++;
        } else if (bookingDate >= today) {
          // If it's today or in the future, and not cancelled, it's upcoming
          // (Unless it's explicitly 'completed', but we mostly rely on date)
          if (bookingDate.getTime() === today.getTime() && b.booking_status === "completed") {
            type = "past";
            pastCount++;
          } else {
            type = "upcoming";
            upcomingCount++;
          }
        } else {
          type = "past";
          pastCount++;
        }

        filteredBookings.push({
          id: b.id,
          vertical: vertical as any,
          venue_name: vName,
          raw_date: rawDate,
          display_date: displayDate,
          display_time: displayTime,
          total_amount: b.total_amount,
          status: isOnline ? "Online" : "Offline",
          booking_status: type,
        });
      });

      filteredBookings.sort(
        (a, b) => new Date(b.raw_date).getTime() - new Date(a.raw_date).getTime(),
      );

      setHistory(filteredBookings);
      setStats({ past: pastCount, upcoming: upcomingCount, cancelled: cancelledCount });
    } catch (err) {
      // Error handling
    } finally {
      setLoading(false);
    }
  }, [currentVenueId, identifier, vertical]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return { history, stats, guestName, guestPhone, loading, refresh: fetchHistory };
};
