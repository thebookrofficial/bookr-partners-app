// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import { useState } from "react";
import { supabase } from "../../../lib/supabase";
import { useAuthStore } from "../../../store";

interface CreateOfflineBookingPayload {
  venueId: string;
  roomId?: string | null;
  guestName: string;
  guestPhone: string;
  checkInDate: Date;
  checkOutDate: Date;
  guestCount: number;
  totalPayment: number;
  advancePaid: number;
  bookingType: string;
  roomType?: string;
  groupType?: string;
  unitCount?: number;
}

export const useCreateStaycationOfflineBooking = () => {
  const { clientProfile } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatLocalDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const createBooking = async (
    payload: CreateOfflineBookingPayload,
  ): Promise<{ success: boolean; venueName?: string }> => {
    if (!clientProfile?.id) {
      setError("User profile not found.");
      return { success: false };
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data: venueData } = await supabase
        .from("venues")
        .select("name")
        .eq("id", payload.venueId)
        .maybeSingle();
      const venueName = venueData?.name || "our venue";

      let userId: string | null = null;

      const checkInStr = formatLocalDate(payload.checkInDate);
      const checkOutStr = formatLocalDate(payload.checkOutDate);

      const nightsCount = Math.max(
        1,
        Math.round(
          (payload.checkOutDate.getTime() - payload.checkInDate.getTime()) / (1000 * 60 * 60 * 24),
        ),
      );

      const bookingTypeValue = payload.bookingType === "farmhouse" ? "full_property" : "per_room";
      const requiredUnits = payload.unitCount || 1;

      // =========================================================
      // 1. MULTI-UNIT SEQUENCE AUTO-ASSIGNMENT ENGINE
      // =========================================================
      let assignedRoomId = payload.roomId || null;
      let assignedRoomStr = payload.roomType || "-";
      let assignedRoomsToBlock: string[] = [];

      if (bookingTypeValue === "per_room" && !assignedRoomId && payload.roomType) {
        // Fetch all rooms of this type ordered sequentially (PRI-111, PRI-112...)
        const { data: availableRooms, error: roomErr } = await supabase
          .from("staycation_rooms")
          .select("id, room_name, room_number")
          .eq("venue_id", payload.venueId)
          .eq("room_name", payload.roomType)
          .eq("is_active", true)
          .order("room_number", { ascending: true });

        if (roomErr) throw new Error("Could not fetch available rooms. Please try again.");

        if (availableRooms && availableRooms.length > 0) {
          // Fetch overlapping bookings for these specific dates
          const { data: overlaps, error: overlapErr } = await supabase
            .from("staycation_bookings")
            .select("room_id, unit_count")
            .eq("venue_id", payload.venueId)
            .neq("booking_status", "cancelled")
            .lt("check_in_date", checkOutStr)
            .gt("check_out_date", checkInStr);

          if (overlapErr) throw new Error("Could not verify room availability. Please try again.");

          const occupiedIds = new Set(overlaps?.map(o => o.room_id));

          // Filter out occupied rooms and grab the required number of units
          const freeRooms = availableRooms.filter(r => !occupiedIds.has(r.id));

          if (freeRooms.length < requiredUnits) {
            throw new Error(`Not enough units of this type available for the selected dates.`);
          }

          const selectedUnits = freeRooms.slice(0, requiredUnits);
          assignedRoomId = selectedUnits[0].id; // Primary room for the booking row
          assignedRoomsToBlock = selectedUnits.map(r => r.id);
          assignedRoomStr = selectedUnits.map(r => `${r.room_name} (${r.room_number})`).join(", ");
        } else {
          throw new Error(`The selected room type is currently unavailable.`);
        }
      }

      const safeGuestCount = Math.max(1, payload.guestCount || 1);
      const safeTotalPayment = Math.max(0, payload.totalPayment || 0);
      const safeAdvancePaid = Math.max(0, payload.advancePaid || 0);

      const { error: insertError } = await supabase.from("staycation_bookings").insert({
        user_id: userId,
        venue_id: payload.venueId,
        room_id: assignedRoomId,
        unit_count: requiredUnits,
        booking_type: bookingTypeValue,
        check_in_date: checkInStr,
        check_out_date: checkOutStr,
        nights_count: nightsCount,
        guest_count: safeGuestCount,
        subtotal: safeTotalPayment,
        discount_amount: 0,
        platform_fee: 0,
        gateway_fee: 0,
        total_amount: safeTotalPayment,
        vendor_payout: safeTotalPayment,
        booking_status: safeTotalPayment > 0 ? "confirmed" : "pending",
        paid_amount: safeAdvancePaid,
        guest_name: payload.guestName || "Guest",
        guest_phone: payload.guestPhone || "N/A",
        special_requests: `Booking For: ${payload.bookingType}, Type: ${assignedRoomStr}, Group: ${
          payload.groupType || "-"
        }`,
      });

      if (insertError) {
        console.error("Supabase Insertion Error:", JSON.stringify(insertError, null, 2));
        throw new Error("Could not save your booking at this time.");
      }

      // =========================================================
      // 2. AVAILABILITY CALENDAR BLOCKING (BLOCKS ALL UNITS)
      // =========================================================
      try {
        const targetDates: string[] = [];
        let currentDate = new Date(payload.checkInDate);
        const endDate = new Date(payload.checkOutDate);

        while (currentDate < endDate) {
          targetDates.push(formatLocalDate(currentDate));
          currentDate.setDate(currentDate.getDate() + 1);
        }

        if (targetDates.length > 0) {
          let targetRoomIds: (string | null)[] = [null];

          if (bookingTypeValue === "per_room") {
            targetRoomIds = assignedRoomsToBlock;
          }

          const upsertData = [];
          for (const roomId of targetRoomIds) {
            for (const date of targetDates) {
              upsertData.push({
                venue_id: payload.venueId,
                room_id: roomId,
                date: date,
                is_available: false,
                is_blocked: true,
              });
            }
          }

          if (upsertData.length > 0) {
            const { error: upsertErr } = await supabase
              .from("staycation_availability")
              .upsert(upsertData, {
                onConflict: "venue_id, room_id, date",
              });

            if (upsertErr) console.error("Upsert Availability Error:", upsertErr);
          }
        }
      } catch (avErr) {
        console.warn("Availability update failed:", avErr);
      }

      return { success: true, venueName };
    } catch (err: any) {
      setError(
        err.message ||
          "An unexpected error occurred while creating your booking. Please try again.",
      );
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  return { createBooking, isLoading, error };
};
