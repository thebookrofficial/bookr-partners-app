// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import { create } from "zustand";
import { supabase } from "@/lib/supabase";

export interface Attendee {
  id: string;
  name: string;
  phone: string;
  time: string;
  ticketType: string;
  categoryName: string;
  avatarUrl?: string;
}

interface AdminEventState {
  ticketCategories: string[];
  attendees: Attendee[];
  loading: boolean;
  fetchTicketCategories: (serviceId: string) => Promise<void>;
  fetchTodayAttendees: (serviceId: string) => Promise<void>;
}

export const useAdminEventStore = create<AdminEventState>(set => ({
  ticketCategories: [],
  attendees: [],
  loading: false,

  fetchTicketCategories: async (serviceId: string) => {
    try {
      const { data: event } = await supabase
        .from("events")
        .select("id, seating_type")
        .eq("venue_id", serviceId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!event) return;

      if (event.seating_type === "open") {
        const { data: passes } = await supabase
          .from("event_passes")
          .select("name")
          .eq("event_id", event.id);
        const cats = passes?.map((p: any) => p.name) || [];
        set({ ticketCategories: cats });
      } else {
        const { data: seats } = await supabase
          .from("event_seats")
          .select("section_name")
          .eq("event_id", event.id);

        const uniqueSections = Array.from(new Set(seats?.map(s => s.section_name).filter(Boolean)));
        set({ ticketCategories: uniqueSections as string[] });
      }
    } catch (err) {
      console.error("Error fetching ticket categories:", err);
    }
  },

  fetchTodayAttendees: async (serviceId: string) => {
    set({ loading: true });
    try {
      const { data: event } = await supabase
        .from("events")
        .select("id, seating_type")
        .eq("venue_id", serviceId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!event) {
        set({ loading: false });
        return;
      }

      // Fetch bookings joined with profiles, and event_passes
      const { data: bookings } = await supabase
        .from("event_bookings")
        .select(
          `
          id,
          ticket_count,
          created_at,
          pass_id,
          seat_ids,
          profiles (full_name, phone, avatar_url),
          event_passes (name)
        `,
        )
        .eq("event_id", event.id)
        .neq("booking_status", "cancelled")
        .order("created_at", { ascending: false });

      if (!bookings) {
        set({ attendees: [], loading: false });
        return;
      }

      // If assigned seating, fetch all seats to map seat_ids to section_name
      let seatMap: Record<string, { label: string; sectionName: string }> = {};
      if (event.seating_type === "assigned") {
        const { data: seats } = await supabase
          .from("event_seats")
          .select("id, row_label, seat_number, section_name")
          .eq("event_id", event.id);

        seats?.forEach(s => {
          seatMap[s.id] = {
            label: `${s.row_label}${s.seat_number}`,
            sectionName: s.section_name,
          };
        });
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const formattedAttendees: Attendee[] = [];

      bookings.forEach((b: any) => {
        const createdAt = new Date(b.created_at);
        if (createdAt < today) return; // Only today's attendees

        const profile = Array.isArray(b.profiles) ? b.profiles[0] : b.profiles;
        let passName = "General";
        let seatLabels: string[] = [];

        if (event.seating_type === "open" && b.event_passes) {
          passName = Array.isArray(b.event_passes) ? b.event_passes[0]?.name : b.event_passes?.name;
        } else if (event.seating_type === "assigned") {
          let parsedSeatIds: string[] = [];
          if (Array.isArray(b.seat_ids)) {
            parsedSeatIds = b.seat_ids;
          } else if (typeof b.seat_ids === "string") {
            parsedSeatIds = b.seat_ids.replace(/^{|}$/g, "").split(",").filter(Boolean);
          }

          if (parsedSeatIds.length > 0) {
            // Find the primary section name from the first valid seat, and collect all labels
            parsedSeatIds.forEach((sid: string) => {
              if (seatMap[sid]) {
                seatLabels.push(seatMap[sid].label);
                if (passName === "General" && seatMap[sid].sectionName) {
                  passName = seatMap[sid].sectionName;
                }
              }
            });
          }
        }

        const timeStr = createdAt
          .toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: true })
          .toUpperCase();

        let passTypeDesc = passName;
        if (seatLabels.length > 0) {
          passTypeDesc = `${passName} | ${seatLabels.join(", ")}`;
        } else {
          passTypeDesc = `${passName} x ${b.ticket_count}`;
        }

        formattedAttendees.push({
          id: b.id,
          name: profile?.full_name || "Guest User",
          phone: profile?.phone || "",
          time: timeStr,
          ticketType: passTypeDesc,
          categoryName: passName,
          avatarUrl: profile?.avatar_url,
        });
      });

      set({ attendees: formattedAttendees, loading: false });
    } catch (err) {
      console.error("Error fetching attendees:", err);
      set({ loading: false });
    }
  },
}));
