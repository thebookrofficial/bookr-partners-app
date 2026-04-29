// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import { useState } from "react";
import { supabase } from "../../../lib/supabase";
import { useAuthStore } from "../../../store";

interface CreateOfflineBookingPayload {
  venueId: string;
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
}

/**
 * Custom hook to handle offline booking creation for Staycations (Farmhouse / Rooms).
 * Handles Supabase insertion logic entirely separated from UI.
 */
export const useCreateStaycationOfflineBooking = () => {
  const { clientProfile } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Helper to format dates avoiding timezone shifts
   */
  const formatLocalDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  /**
   * Creates an offline booking record in Supabase
   * @param payload The structured booking data from the UI sheet
   */
  const createBooking = async (payload: CreateOfflineBookingPayload): Promise<boolean> => {
    if (!clientProfile?.id) {
      setError("User profile not found.");
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Clean phone number for lookup
      const cleanMobile = payload.guestPhone.replace(/[^\d]/g, "");

      // 1. Try to resolve an existing Bookr profile by phone number (Optional)
      let userId: string | null = null;
      if (cleanMobile.length >= 10) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("phone", cleanMobile)
          .maybeSingle();
        if (profile?.id) {
          userId = profile.id;
        }
      }

      // Format dates safely
      const checkInStr = formatLocalDate(payload.checkInDate);
      const checkOutStr = formatLocalDate(payload.checkOutDate);

      // Calculate nights count
      const nightsCount = Math.max(
        1,
        Math.round(
          (payload.checkOutDate.getTime() - payload.checkInDate.getTime()) / (1000 * 60 * 60 * 24),
        ),
      );

      const bookingTypeValue = payload.bookingType === "farmhouse" ? "full_property" : "per_room";

      // Insert directly into staycation_bookings based on schema.
      // We pass user_id as null if no Bookr user matches the phone number, allowing the guest_name and guest_phone to represent the offline user.
      const { error: insertError } = await supabase.from("staycation_bookings").insert({
        user_id: userId,
        venue_id: payload.venueId,
        booking_type: bookingTypeValue,
        check_in_date: checkInStr,
        check_out_date: checkOutStr,
        nights_count: nightsCount,
        guest_count: payload.guestCount,
        subtotal: payload.totalPayment,
        discount_amount: 0,
        platform_fee: 0,
        gateway_fee: 0,
        total_amount: payload.totalPayment,
        vendor_payout: payload.totalPayment,
        booking_status: payload.advancePaid > 0 ? "confirmed" : "pending",
        paid_amount: payload.advancePaid,
        guest_name: payload.guestName,
        guest_phone: payload.guestPhone,
        special_requests: `Booking For: ${payload.bookingType}, Type: ${
          payload.roomType || "-"
        }, Group: ${payload.groupType || "-"}`,
      });

      if (insertError) {
        console.error("Supabase Insertion Error:", insertError);
        throw new Error(insertError.message);
      }

      // Manually block dates in staycation_availability
      try {
        const targetDates: string[] = [];
        let currentDate = new Date(payload.checkInDate);
        const endDate = new Date(payload.checkOutDate);

        while (currentDate < endDate) {
          targetDates.push(formatLocalDate(currentDate));
          currentDate.setDate(currentDate.getDate() + 1);
        }

        if (targetDates.length > 0) {
          // 1. Fetch rooms for the venue (if any)
          const { data: rooms } = await supabase
            .from("staycation_rooms")
            .select("id")
            .eq("venue_id", payload.venueId);

          const roomIds = rooms && rooms.length > 0 ? rooms.map(r => r.id) : [null];

          // 2. Identify existing records to avoid duplicates
          const { data: existingAvail } = await supabase
            .from("staycation_availability")
            .select("id, room_id, date")
            .eq("venue_id", payload.venueId)
            .in("date", targetDates);

          const existingMap = new Set(
            existingAvail?.map(ea => `${ea.room_id || "null"}_${ea.date}`) || [],
          );

          const toInsert = [];
          for (const roomId of roomIds) {
            for (const date of targetDates) {
              if (!existingMap.has(`${roomId || "null"}_${date}`)) {
                toInsert.push({
                  venue_id: payload.venueId,
                  room_id: roomId,
                  date: date,
                  is_available: false,
                  is_blocked: true,
                });
              }
            }
          }

          // 3. Insert new records
          if (toInsert.length > 0) {
            const { error: availInsertError } = await supabase
              .from("staycation_availability")
              .insert(toInsert);
            if (availInsertError) console.warn("Failed to insert availability:", availInsertError);
          }

          // 4. Update existing records
          if (existingAvail && existingAvail.length > 0) {
            const existingIds = existingAvail.map(ea => ea.id);
            const { error: updateError } = await supabase
              .from("staycation_availability")
              .update({ is_blocked: true, is_available: false })
              .in("id", existingIds);
            if (updateError) console.warn("Failed to update availability:", updateError);
          }
        }
      } catch (avErr) {
        console.warn("Availability update failed:", avErr);
      }

      return true;
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred while creating booking.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { createBooking, isLoading, error };
};
