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

  // UPDATED: Now returns the venueName alongside success status
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

      // Fetch the Venue Name so we can use it in the WhatsApp message
      const { data: venueData } = await supabase
        .from("venues")
        .select("name")
        .eq("id", payload.venueId)
        .maybeSingle();
      const venueName = venueData?.name || "our venue";

      const cleanMobile = payload.guestPhone.replace(/[^\d]/g, "");

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

      const checkInStr = formatLocalDate(payload.checkInDate);
      const checkOutStr = formatLocalDate(payload.checkOutDate);

      const nightsCount = Math.max(
        1,
        Math.round(
          (payload.checkOutDate.getTime() - payload.checkInDate.getTime()) / (1000 * 60 * 60 * 24),
        ),
      );

      const bookingTypeValue = payload.bookingType === "farmhouse" ? "full_property" : "per_room";

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

      // Manually block dates
      try {
        const targetDates: string[] = [];
        let currentDate = new Date(payload.checkInDate);
        const endDate = new Date(payload.checkOutDate);

        while (currentDate < endDate) {
          targetDates.push(formatLocalDate(currentDate));
          currentDate.setDate(currentDate.getDate() + 1);
        }

        if (targetDates.length > 0) {
          // Determine if we should block specific rooms or the whole property
          let targetRoomIds: (string | null)[] = [null];

          if (bookingTypeValue === "per_room") {
            const { data: rooms } = await supabase
              .from("staycation_rooms")
              .select("id")
              .eq("venue_id", payload.venueId);
            if (rooms && rooms.length > 0) {
              targetRoomIds = rooms.map(r => r.id);
            }
          }

          // Use an UPSERT to handle both inserting new blocks and updating existing availability
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
      setError(err.message || "An unexpected error occurred while creating booking.");
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  return { createBooking, isLoading, error };
};
