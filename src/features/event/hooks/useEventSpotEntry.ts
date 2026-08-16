// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import { useState, useEffect, useCallback } from "react";
import { Alert } from "react-native";
import { supabase } from "@/lib/supabase";

export interface SpotEntryDetails {
  guestName: string;
  mobileNo: string;
  passType: string;
  quantity: string;
  ticketAmount: string;
  paidAmount: string;
}

export interface PassCategory {
  id: string;
  name: string;
  price: number;
  isZone: boolean;
}

export const useEventSpotEntry = (venueId: string) => {
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [eventId, setEventId] = useState("");
  const [eventTitle, setEventTitle] = useState("");
  const [eventImage, setEventImage] = useState<string | null>(null);
  const [passCategories, setPassCategories] = useState<PassCategory[]>([]);

  const fetchEventContext = useCallback(async () => {
    if (!venueId) {
      setLoading(false);
      return;
    }

    try {
      const { data: event, error } = await supabase
        .from("events")
        .select("id, title, seating_type, cover_image_url")
        .eq("venue_id", venueId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (event) {
        setEventId(event.id);
        setEventTitle(event.title);
        setEventImage(event.cover_image_url);

        if (event.seating_type === "open") {
          const { data: passes } = await supabase
            .from("event_passes")
            .select("id, name, price")
            .eq("event_id", event.id);

          setPassCategories(
            passes?.map(p => ({ id: p.id, name: p.name, price: p.price, isZone: false })) || [],
          );
        } else {
          const { data: seats } = await supabase
            .from("event_zones") // Use event_zones for assigned seating sections
            .select("id, zone_name, price")
            .eq("event_id", event.id);

          setPassCategories(
            seats?.map(s => ({ id: s.id, name: s.zone_name, price: s.price, isZone: true })) || [],
          );
        }
      }
    } catch (err: any) {
      console.error("Error fetching event context:", err.message);
    } finally {
      setLoading(false);
    }
  }, [venueId]);

  useEffect(() => {
    fetchEventContext();
  }, [fetchEventContext]);

  const createSpotEntry = async (details: SpotEntryDetails) => {
    if (!eventId) return false;

    setIsSubmitting(true);
    try {
      const qty = parseInt(details.quantity, 10) || 1;
      // ticketAmount is now the TOTAL amount
      const tAmount = parseFloat(details.ticketAmount) || 0;
      const pAmount = parseFloat(details.paidAmount) || 0;

      const subtotal = tAmount;

      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;

      if (!userId) {
        throw new Error("Must be logged in to create spot entry");
      }

      // Find the pass/zone ID
      const selectedPass = passCategories.find(p => p.name === details.passType);
      const passId = selectedPass && !selectedPass.isZone ? selectedPass.id : null;
      const zoneId = selectedPass && selectedPass.isZone ? selectedPass.id : null;

      const { error } = await supabase.from("event_bookings").insert({
        user_id: userId,
        event_id: eventId,
        pass_id: passId,
        zone_id: zoneId,
        ticket_count: qty,
        booking_status: "confirmed",
        subtotal: subtotal,
        discount_amount: 0,
        platform_fee: 0,
        gateway_fee: 0,
        total_amount: subtotal,
        vendor_payout: subtotal, // 100% goes to vendor for cash
        paid_amount: pAmount,
        guest_name: details.guestName,
        guest_phone: details.mobileNo,
        booking_source: "offline",
        payment_type: "full",
        commission_fee: 0,
        is_spot_entry: true, // Note: This column must be added to the DB!
      });

      if (error) {
        console.error("DB Insert Error:", error);
        Alert.alert("Error", error.message || "Failed to create spot entry");
        throw error;
      }

      return true;
    } catch (err: any) {
      console.error("Error creating spot entry:", err);
      Alert.alert("Error", err.message || "An unknown error occurred");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    loading,
    isSubmitting,
    eventTitle,
    eventImage,
    passCategories,
    createSpotEntry,
    refresh: () => {
      fetchEventContext();
    },
  };
};
