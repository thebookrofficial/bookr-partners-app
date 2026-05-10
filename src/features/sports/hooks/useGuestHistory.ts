// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export interface HistoryBooking {
  id: string;
  vertical: "sports" | "staycation";
  venue_name: string;
  raw_date: string;
  display_date: string;
  display_time: string;
  total_amount: number;
  status: string;
  booking_status: "past" | "upcoming" | "cancelled";
}

// Helpers for unified formatting
const formatDisplayDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (timeStr: string) => {
  const [h] = timeStr.split(":");
  const hourInt = parseInt(h, 10);
  return `${hourInt % 12 || 12} ${hourInt >= 12 ? "Pm" : "Am"}`;
};

export const useGuestHistory = (identifier: string) => {
  const [history, setHistory] = useState<HistoryBooking[]>([]);
  const [stats, setStats] = useState({ past: 0, upcoming: 0, cancelled: 0 });
  const [guestName, setGuestName] = useState<string>("Guest User");
  const [guestPhone, setGuestPhone] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    if (!identifier) return;
    setLoading(true);
    try {
      let phone = identifier;
      let profileId = "00000000-0000-0000-0000-000000000000";

      // 1. Resolve UUID back to phone/user_id
      if (identifier.length === 36 && identifier.includes("-")) {
        const { data: sportsBooking } = await supabase
          .from("sports_bookings")
          .select("guest_phone, user_id, profiles(phone)")
          .eq("id", identifier)
          .maybeSingle();

        if (sportsBooking) {
          const pPhone = Array.isArray(sportsBooking.profiles)
            ? sportsBooking.profiles[0]?.phone
            : (sportsBooking.profiles as any)?.phone;
          phone = sportsBooking.guest_phone || pPhone || identifier;
          profileId = sportsBooking.user_id || profileId;
        } else {
          const { data: stayBooking } = await supabase
            .from("staycation_bookings")
            .select("guest_phone, user_id, profiles(phone)")
            .eq("id", identifier)
            .maybeSingle();

          if (stayBooking) {
            const pPhone = Array.isArray(stayBooking.profiles)
              ? stayBooking.profiles[0]?.phone
              : (stayBooking.profiles as any)?.phone;
            phone = stayBooking.guest_phone || pPhone || identifier;
            profileId = stayBooking.user_id || profileId;
          }
        }
      }

      setGuestPhone(phone);

      // 2. Resolve Profile Data
      let finalProfileId = profileId;
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("phone", phone)
        .maybeSingle();

      if (profileData) {
        finalProfileId = profileData.id;
        setGuestName(profileData.full_name);
      }

      // 3. Fetch BOTH Verticals in Parallel
      const [sportsRes, staycationRes] = await Promise.all([
        supabase
          .from("sports_bookings")
          .select(
            `
            id, guest_name, total_amount, platform_fee, gateway_fee, booking_status,
            sports_slots!inner ( slot_date, start_time, end_time, sports_grounds ( name ) )
          `,
          )
          .or(`guest_phone.eq.${phone},user_id.eq.${finalProfileId}`),

        supabase
          .from("staycation_bookings")
          .select(
            `
            id, guest_name, total_amount, platform_fee, gateway_fee, booking_status, check_in_date, check_out_date,
            venues ( name )
          `,
          )
          .or(`guest_phone.eq.${phone},user_id.eq.${finalProfileId}`),
      ]);

      const now = new Date();
      let pastCount = 0,
        upcomingCount = 0,
        cancelledCount = 0;
      const allBookings: HistoryBooking[] = [];

      // Process Sports Bookings
      (sportsRes.data || []).forEach((b: any) => {
        if (!profileData?.full_name && b.guest_name) setGuestName(b.guest_name);

        const slotDate = new Date(b.sports_slots.slot_date);
        const isOffline = b.platform_fee === 0 && b.gateway_fee === 0;
        const isCancelled = b.booking_status?.toLowerCase() === "cancelled";

        let type: "past" | "upcoming" | "cancelled" = "past";
        if (isCancelled) {
          type = "cancelled";
          cancelledCount++;
        } else if (slotDate > now) {
          type = "upcoming";
          upcomingCount++;
        } else {
          pastCount++;
        }

        allBookings.push({
          id: b.id,
          vertical: "sports",
          venue_name: b.sports_slots.sports_grounds?.name || "Sports Ground",
          raw_date: b.sports_slots.slot_date,
          display_date: formatDisplayDate(b.sports_slots.slot_date),
          display_time: `${formatTime(b.sports_slots.start_time)} - ${formatTime(
            b.sports_slots.end_time,
          )}`,
          total_amount: b.total_amount,
          status: isOffline ? "Offline" : "Online",
          booking_status: type,
        });
      });

      // Process Staycation Bookings
      (staycationRes.data || []).forEach((b: any) => {
        if (!profileData?.full_name && b.guest_name) setGuestName(b.guest_name);

        const slotDate = new Date(b.check_in_date);
        const isOnline = (parseFloat(b.platform_fee) || 0) > 0;
        const isCancelled = b.booking_status?.toLowerCase() === "cancelled";

        let type: "past" | "upcoming" | "cancelled" = "past";
        if (isCancelled) {
          type = "cancelled";
          cancelledCount++;
        } else if (slotDate > now) {
          type = "upcoming";
          upcomingCount++;
        } else {
          pastCount++;
        }

        const venueObj = Array.isArray(b.venues) ? b.venues[0] : b.venues;

        allBookings.push({
          id: b.id,
          vertical: "staycation",
          venue_name: venueObj?.name || "Staycation Venue",
          raw_date: b.check_in_date,
          display_date: `${formatDisplayDate(b.check_in_date)} - ${formatDisplayDate(
            b.check_out_date,
          )}`,
          display_time: `Staycation`,
          total_amount: b.total_amount,
          status: isOnline ? "Online" : "Offline",
          booking_status: type,
        });
      });

      // Sort heavily by date descending
      allBookings.sort((a, b) => new Date(b.raw_date).getTime() - new Date(a.raw_date).getTime());

      setHistory(allBookings);
      setStats({ past: pastCount, upcoming: upcomingCount, cancelled: cancelledCount });
    } catch (err) {
      console.error("History fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [identifier]);

  useEffect(() => {
    if (identifier) fetchHistory();
  }, [identifier, fetchHistory]);

  return { history, stats, guestName, guestPhone, loading, refresh: fetchHistory };
};
