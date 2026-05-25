// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import { supabase } from "@/lib/supabase";
import {
  DBEvent,
  DBEventPass,
  DBEventZone,
  DBEventSeat,
  EventAvailabilityData,
  EventBookingPayload,
} from "../types/event.types";

export const fetchEventBookings = async (
  eventId: string,
  startDate: Date,
  endDate: Date,
): Promise<any[]> => {
  const { data, error } = await supabase
    .from("event_bookings")
    .select("id, guest_name, guest_phone, ticket_count, total_amount, booking_status, created_at")
    .eq("event_id", eventId)
    .gte("created_at", startDate.toISOString())
    .lte("created_at", endDate.toISOString());

  if (error) {
    throw error;
  }

  return data || [];
};

/**
 * Fetches event availability details including passes, zones, and available seats.
 *
 * @param eventId - The unique identifier of the event.
 * @returns A promise resolving to the composite event availability data.
 * @throws Error if the fetch fails or the event is not found.
 */
export const fetchEventAvailability = async (eventId: string): Promise<EventAvailabilityData> => {
  // Fetch Event details
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .single();

  if (eventError || !event) {
    throw new Error(eventError?.message || "Event not found");
  }

  // Fetch active Passes
  const { data: passes, error: passesError } = await supabase
    .from("event_passes")
    .select("*")
    .eq("event_id", eventId)
    .eq("is_active", true);

  if (passesError) throw passesError;

  // Fetch Zones
  const { data: zones, error: zonesError } = await supabase
    .from("event_zones")
    .select("*")
    .eq("event_id", eventId);

  if (zonesError) throw zonesError;

  // Fetch available Seats
  const { data: seats, error: seatsError } = await supabase
    .from("event_seats")
    .select("*")
    .eq("event_id", eventId)
    .eq("status", "available");

  if (seatsError) throw seatsError;

  return {
    event: event as DBEvent,
    passes: (passes || []) as DBEventPass[],
    zones: (zones || []) as DBEventZone[],
    seats: (seats || []) as DBEventSeat[],
  };
};

/**
 * Creates an event booking by calling a Supabase RPC.
 *
 * @param payload - The booking data payload.
 * @param rpcName - The name of the Supabase RPC function to call.
 * @returns A promise resolving to the RPC result.
 */
export const createEventBookingRPC = async (
  payload: EventBookingPayload,
  rpcName: string,
): Promise<{ id: string; status: string }> => {
  const { data, error } = await supabase.rpc(rpcName, payload);

  if (error) {
    throw error;
  }

  return data;
};
