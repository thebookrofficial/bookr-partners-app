// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Alert } from "react-native";

export interface GuestInviteRecord {
  id: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  pass_type: string;
  quantity: number;
  status: "pending" | "sent" | "scanned";
  created_at: string;
}

export const useEventInvites = (venueId: string) => {
  const [invites, setInvites] = useState<GuestInviteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [eventId, setEventId] = useState<string | null>(null);
  const [eventTitle, setEventTitle] = useState("");
  const [eventImage, setEventImage] = useState<string | null>(null);
  const [passCategories, setPassCategories] = useState<string[]>([]);

  const fetchEventContext = useCallback(async () => {
    if (!venueId) return;
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
            .select("name")
            .eq("event_id", event.id);
          setPassCategories(passes?.map(p => p.name) || []);
        } else {
          const { data: seats } = await supabase
            .from("event_seats")
            .select("section_name")
            .eq("event_id", event.id);
          const unique = Array.from(new Set(seats?.map(s => s.section_name).filter(Boolean)));
          setPassCategories((unique as string[]) || []);
        }
      }
    } catch (err: any) {
      console.error("Error fetching event context:", err.message);
    }
  }, [venueId]);

  const fetchInvites = useCallback(async () => {
    if (!venueId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("event_guest_invites")
        .select("*")
        .eq("venue_id", venueId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setInvites(data || []);
    } catch (err: any) {
      console.error("Error fetching invites:", err.message);
    } finally {
      setLoading(false);
    }
  }, [venueId]);

  const sendInvite = async (params: {
    guestName: string;
    email: string;
    mobileNo: string;
    passType: string;
    quantity: string;
  }) => {
    if (!eventId) {
      Alert.alert("Error", "No active event found to send invite for.");
      return false;
    }

    setIsSubmitting(true);
    try {
      const { data: _data, error } = await supabase.functions.invoke("send-event-invite", {
        body: {
          ...params,
          venueId,
          eventId,
          eventTitle,
        },
      });

      if (error) throw error;

      await fetchInvites();
      return true;
    } catch (err: any) {
      Alert.alert("Failed to send invite", err.message || "An unknown error occurred.");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteInvite = async (inviteId: string) => {
    try {
      const { error } = await supabase.from("event_guest_invites").delete().eq("id", inviteId);
      if (error) throw error;
      setInvites(prev => prev.filter(i => i.id !== inviteId));
      return true;
    } catch (err: any) {
      Alert.alert("Error", err.message);
      return false;
    }
  };

  useEffect(() => {
    fetchEventContext();
    fetchInvites();
  }, [fetchEventContext, fetchInvites]);

  return {
    invites,
    loading,
    isSubmitting,
    eventTitle,
    eventImage,
    passCategories,
    sendInvite,
    deleteInvite,
    refresh: fetchInvites,
  };
};
