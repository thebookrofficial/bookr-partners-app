// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

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

export const useGuestHistory = (phone: string) => {
  const [history, setHistory] = useState<HistoryBooking[]>([]);
  const [stats, setStats] = useState({ past: 0, upcoming: 0, cancelled: 0 });
  const [guestName, setGuestName] = useState<string>("Guest User");
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      // 1. First, find if a profile exists for this phone
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("phone", phone)
        .maybeSingle(); // Use maybeSingle to avoid errors if not found

      // 2. Build the query for bookings
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
        if (b.status === "cancelled") {
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
  }, [phone]);

  useEffect(() => {
    if (phone) fetchHistory();
  }, [phone, fetchHistory]);

  return { history, stats, guestName, loading, refresh: fetchHistory };
};
