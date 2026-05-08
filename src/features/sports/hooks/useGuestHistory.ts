// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { SportsService } from "../services/sports.service";

export interface HistoryBooking {
  id: string;
  ground_name: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  total_amount: number;
  status: "Online" | "Offline";
  booking_status: "past" | "upcoming" | "cancelled";
}

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
      let resolvedGuestName = "";

      // 1. If identifier looks like a UUID, it's likely a bookingId
      // We need to resolve the guest phone and name from the booking first
      if (identifier.length === 36 && identifier.includes("-")) {
        const { data: bookingData } = await supabase
          .from("sports_bookings")
          .select(
            "guest_name, guest_phone, user_id, venue_id, profiles(phone), sports_slots(ground_id, slot_date)",
          )
          .eq("id", identifier)
          .single();

        if (bookingData) {
          // profiles might be returned as an object or an array depending on schema inference
          let profilePhone = Array.isArray(bookingData.profiles)
            ? bookingData.profiles[0]?.phone
            : (bookingData.profiles as any)?.phone;

          // SECURE FALLBACK: If join failed for an online booking, resolve via RPC
          if (!profilePhone && bookingData.user_id) {
            try {
              const rpcBookings = await SportsService.getBookings(
                bookingData.venue_id,
                (bookingData.sports_slots as any).ground_id,
                (bookingData.sports_slots as any).slot_date,
              );
              const matched = rpcBookings.find((b: any) => b.id === identifier);
              if (matched) {
                profilePhone = matched.phone;
                resolvedGuestName = matched.full_name;
              }
            } catch (rpcErr) {
              console.warn("History UUID fallback failed:", rpcErr);
            }
          }

          phone = bookingData.guest_phone || profilePhone || identifier;
          resolvedGuestName = resolvedGuestName || bookingData.guest_name || "";
        }
      }

      setGuestPhone(phone);

      // 2. Find if a profile exists for this phone
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("phone", phone)
        .maybeSingle();

      // 3. Build the query for bookings
      const { data, error } = await supabase
        .from("sports_bookings")
        .select(
          `
          id, guest_name, guest_phone, total_amount, platform_fee, 
          gateway_fee, booking_status,
          sports_slots!inner (
            slot_date, start_time, end_time,
            sports_grounds ( name )
          )
        `,
        )
        .or(
          `guest_phone.eq.${phone},user_id.eq.${
            profileData?.id || "00000000-0000-0000-0000-000000000000"
          }`,
        )
        .order("sports_slots(slot_date)", { ascending: false });

      if (error) throw error;

      // 3. Resolve Global Guest Name for Header
      if (profileData?.full_name) {
        setGuestName(profileData.full_name);
      } else if (resolvedGuestName) {
        setGuestName(resolvedGuestName);
      } else if (data && data.length > 0) {
        // FALLBACK: Use the guest_name from the most recent booking
        const manualName = data.find(b => b.guest_name)?.guest_name;
        if (manualName) setGuestName(manualName);
      }

      const now = new Date();
      let pastCount = 0,
        upcomingCount = 0,
        cancelledCount = 0;

      const formatted: HistoryBooking[] = (data || []).map((b: any) => {
        const slotDate = new Date(b.sports_slots.slot_date);
        const isOffline = b.platform_fee === 0 && b.gateway_fee === 0;
        const displayName = profileData?.full_name || b.guest_name || "Guest User";

        let type: "past" | "upcoming" | "cancelled" = "past";
        const isCancelled =
          b.booking_status?.toLowerCase() === "cancelled" ||
          b.status?.toLowerCase() === "cancelled";

        if (isCancelled) {
          type = "cancelled";
          cancelledCount++;
        } else if (slotDate > now) {
          type = "upcoming";
          upcomingCount++;
        } else {
          pastCount++;
        }

        return {
          id: b.id,
          display_name: displayName,
          display_phone: b.profiles?.phone || b.guest_phone || phone,
          ground_name: b.sports_slots.sports_grounds?.name || "Ground",
          slot_date: b.sports_slots.slot_date,
          start_time: b.sports_slots.start_time,
          end_time: b.sports_slots.end_time,
          total_amount: b.total_amount,
          status: isOffline ? "Offline" : "Online",
          booking_status: type,
        };
      });

      setHistory(formatted);
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
