// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Alert } from "react-native";

interface BulkBookingParams {
  ownerId: string | undefined; // Added to securely identify the vendor
  venueId: string;
  groundId: string;
  category: string; // Added to find the right sports venue
  mobile: string;
  name: string;
  fromDate: Date;
  toDate: Date;
  fromTime: string;
  toTime: string;
  totalAmountPerSlot: number;
  initialPayments: { mode: "cash" | "upi"; amount: number }[];
}

const HOURS = [
  "6 AM",
  "7 AM",
  "8 AM",
  "9 AM",
  "10 AM",
  "11 AM",
  "12 PM",
  "1 PM",
  "2 PM",
  "3 PM",
  "4 PM",
  "5 PM",
  "6 PM",
  "7 PM",
  "8 PM",
  "9 PM",
  "10 PM",
  "11 PM",
  "12 AM",
];

export const useBulkBooking = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const parseTimeTo24 = (time12h: string) => {
    if (!time12h || time12h === "12 AM") return "00:00:00";
    const [time, modifier] = time12h.split(" ");
    let hours = parseInt(time, 10);
    if (hours === 12 && modifier === "AM") hours = 0;
    if (hours < 12 && modifier === "PM") hours += 12;
    return `${hours.toString().padStart(2, "0")}:00:00`;
  };

  const confirmBulkBooking = async (params: BulkBookingParams) => {
    setIsSubmitting(true);
    try {
      if (!params.ownerId) throw new Error("Authentication error: Could not identify vendor.");

      const { venueId, groundId } = params;

      if (!venueId || !groundId) throw new Error("Could not resolve Venue or Ground ID.");

      const cleanMobile = params.mobile.replace(/[^\d]/g, "");
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("phone", cleanMobile)
        .maybeSingle();

      const dates: string[] = [];
      let curr = new Date(params.fromDate);
      curr.setHours(0, 0, 0, 0);
      let end = new Date(params.toDate);
      end.setHours(0, 0, 0, 0);

      while (curr <= end) {
        const year = curr.getFullYear();
        const month = String(curr.getMonth() + 1).padStart(2, "0");
        const day = String(curr.getDate()).padStart(2, "0");
        dates.push(`${year}-${month}-${day}`);
        curr.setDate(curr.getDate() + 1);
      }

      const startIdx = HOURS.indexOf(params.fromTime);
      const endIdx = HOURS.indexOf(params.toTime);
      if (startIdx === -1 || endIdx === -1 || startIdx >= endIdx)
        throw new Error("Invalid time range.");
      const hourlySlots = HOURS.slice(startIdx, endIdx);

      let bookingsCreated = 0;
      let firstBookingId: string | null = null;

      for (const d of dates) {
        for (const hour of hourlySlots) {
          const startTime24 = parseTimeTo24(hour);
          const nextHour = HOURS[HOURS.indexOf(hour) + 1] || "12 AM";
          const endTime24 = parseTimeTo24(nextHour);

          // 1. Explicitly check if slot exists first to avoid ghost-slot errors
          const { data: existingSlot } = await supabase
            .from("sports_slots")
            .select("id, status")
            .eq("venue_id", venueId)
            .eq("ground_id", groundId)
            .eq("slot_date", d)
            .eq("start_time", startTime24)
            .maybeSingle();

          let slotId = existingSlot?.id;

          if (existingSlot) {
            if (existingSlot.status !== "available") {
              continue;
            }
            await supabase.from("sports_slots").update({ status: "booked" }).eq("id", slotId);
          } else {
            const { data: newSlot, error: insErr } = await supabase
              .from("sports_slots")
              .insert({
                venue_id: venueId,
                ground_id: groundId,
                slot_date: d,
                start_time: startTime24,
                end_time: endTime24,
                price: params.totalAmountPerSlot,
                status: "booked",
              })
              .select("id")
              .single();

            if (insErr) {
              console.error("Slot Insert Error:", insErr);
              throw new Error(`Database rejected slot creation: ${insErr.message}`);
            }
            slotId = newSlot.id;
          }

          const totalHours = HOURS.slice(startIdx, endIdx).length; // Ensure this is the length of your slice
          const isBulk = dates.length > 1 || totalHours > 1;
          const finalBookingType = isBulk ? "multi_slot" : "standard";

          // 2. Create Booking Record with ALL missing financial columns
          const { data: booking, error: bookingError } = await supabase
            .from("sports_bookings")
            .insert({
              user_id: profile?.id || null,
              guest_name: params.name,
              guest_phone: cleanMobile,
              venue_id: venueId,
              slot_id: slotId,
              booking_status: "confirmed",

              subtotal: params.totalAmountPerSlot,
              discount_amount: 0,
              total_amount: params.totalAmountPerSlot,
              vendor_payout: params.totalAmountPerSlot,
              platform_fee: 0,
              gateway_fee: 0,
              paid_amount: 0,
              booking_source: "offline", // ADDED: Set booking source to offline
              sports_booking_type: finalBookingType,
              notes: "Bulk Booking Record",
            })
            .select("id")
            .single();

          if (bookingError) {
            console.error("Booking Insert Error:", bookingError);
            throw new Error(`Database rejected booking record: ${bookingError.message}`);
          }

          bookingsCreated++;
          if (!firstBookingId) firstBookingId = booking.id;
        }
      }

      if (bookingsCreated === 0) {
        throw new Error("No slots could be booked. The selected times may already be taken.");
      }

      // 3. Log Initial Payments
      // 3. Log Initial Payments
      if (firstBookingId && params.initialPayments.length > 0) {
        for (const p of params.initialPayments) {
          const { error: payErr } = await supabase.from("offline_payment_logs").insert({
            booking_id: firstBookingId,
            booking_vertical: "sports", // <-- CRITICAL FIX: Tells the DB which table to update
            amount: p.amount,
            payment_mode: p.mode, // Safety fallback for enum
            note: "Bulk booking initial payment",
            logged_by: params.ownerId,
          });

          if (payErr) {
            console.error("Payment Log Insert Error:", payErr);
            throw new Error(`Booking succeeded, but payment failed to log: ${payErr.message}`);
          }
        }
      }

      Alert.alert("Success", `Bulk booking successfully created for ${bookingsCreated} slots!`);
      return true;
    } catch (e: any) {
      Alert.alert("Booking Failed", e.message);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { confirmBulkBooking, isSubmitting };
};
