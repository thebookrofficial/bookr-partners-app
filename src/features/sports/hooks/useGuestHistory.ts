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
  const [h] = timeStr.split(":");
  const hourInt = parseInt(h, 10);
  return `${hourInt % 12 || 12} ${hourInt >= 12 ? "PM" : "AM"}`;
};

export const useGuestHistory = (identifier: string, vertical: string) => {
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
            id, guest_name, total_amount, platform_fee, gateway_fee, booking_status,
            sports_slots!inner ( slot_date, start_time, end_time, sports_grounds ( name ) )
          `);
      } else {
        query = supabase.from("staycation_bookings").select(`
            id, guest_name, total_amount, platform_fee, gateway_fee, booking_status, check_in_date, check_out_date,
            venues ( name )
          `);
      }

      // 4. Execute Main Fetch
      let results;
      if (userId) {
        const { data } = await query.or(`guest_phone.eq.${resolvedPhone},user_id.eq.${userId}`);
        results = data;
      } else {
        const { data } = await query.eq("guest_phone", resolvedPhone);
        results = data;
      }

      const now = new Date();
      let pastCount = 0,
        upcomingCount = 0,
        cancelledCount = 0;
      const filteredBookings: HistoryBooking[] = [];

      (results || []).forEach((b: any) => {
        const isCancelled = b.booking_status?.toLowerCase() === "cancelled";
        let rawDate, displayDate, displayTime, vName, isOnline;

        if (vertical === "sports") {
          rawDate = b.sports_slots.slot_date;
          displayDate = formatDisplayDate(rawDate);
          displayTime = `${formatTime(b.sports_slots.start_time)} - ${formatTime(
            b.sports_slots.end_time,
          )}`;
          vName = b.sports_slots.sports_grounds?.name || "Sports Ground";
          isOnline = b.platform_fee > 0;
        } else {
          rawDate = b.check_in_date;
          displayDate = `${formatDisplayDate(b.check_in_date)} - ${formatDisplayDate(
            b.check_out_date,
          )}`;
          displayTime = "Staycation";
          vName = b.venues?.name || "Staycation Venue";
          isOnline = parseFloat(b.platform_fee) > 0;
        }

        const bookingDate = new Date(rawDate);
        let type: "past" | "upcoming" | "cancelled" = "past";

        if (isCancelled) {
          type = "cancelled";
          cancelledCount++;
        } else if (bookingDate > now) {
          type = "upcoming";
          upcomingCount++;
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
  }, [identifier, vertical]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return { history, stats, guestName, guestPhone, loading, refresh: fetchHistory };
};
