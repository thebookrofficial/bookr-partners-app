// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Alert } from "react-native";

export interface ClosedDateRecord {
  id: string;
  startDate: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  isFullDay: boolean;
}

const getDatesBetween = (startDate: string, endDate: string) => {
  const dates = [];
  let currentDate = new Date(startDate);
  const end = new Date(endDate);
  while (currentDate <= end) {
    dates.push(currentDate.toISOString().split("T")[0]);
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dates;
};

export const useStaycationCloseDate = (venueId: string) => {
  const [upcomingClosedDates, setUpcomingClosedDates] = useState<ClosedDateRecord[]>([]);
  const [pastClosedDates, setPastClosedDates] = useState<ClosedDateRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClosedDates = useCallback(
    async (isInitialLoad = false) => {
      if (!venueId) {
        setLoading(false);
        return;
      }
      if (isInitialLoad) setLoading(true);

      try {
        const { data, error } = await supabase
          .from("venue_closed_dates")
          .select("*")
          .eq("venue_id", venueId)
          .order("start_date", { ascending: true });

        if (error) throw error;

        const active: ClosedDateRecord[] = [];
        const past: ClosedDateRecord[] = [];
        const todayStr = new Date().toISOString().split("T")[0];

        (data || []).forEach(item => {
          const record: ClosedDateRecord = {
            id: item.id,
            startDate: item.start_date,
            endDate: item.end_date,
            startTime: item.start_time,
            endTime: item.end_time,
            isFullDay: item.is_full_day,
          };

          const recordEndDateStr = item.end_date || item.start_date;
          if (recordEndDateStr >= todayStr) {
            active.push(record);
          } else {
            past.push(record);
          }
        });

        setUpcomingClosedDates(active);
        setPastClosedDates(past);
      } catch (err: any) {
        console.error("Error fetching staycation closed dates:", err.message);
      } finally {
        if (isInitialLoad) setLoading(false);
      }
    },
    [venueId],
  );

  const setClosedDate = async (record: Omit<ClosedDateRecord, "id">) => {
    try {
      const { error } = await supabase.from("venue_closed_dates").insert([
        {
          venue_id: venueId,
          start_date: record.startDate,
          end_date: record.endDate || null,
          start_time: record.startTime || null,
          end_time: record.endTime || null,
          is_full_day: record.isFullDay,
        },
      ]);

      if (error) throw error;

      const targetDates = record.endDate
        ? getDatesBetween(record.startDate, record.endDate)
        : [record.startDate];

      const { data: rooms } = await supabase
        .from("staycation_rooms")
        .select("id")
        .eq("venue_id", venueId);

      if (rooms && rooms.length > 0) {
        const roomIds = rooms.map(r => r.id);

        const { data: existingAvail } = await supabase
          .from("staycation_availability")
          .select("id, room_id, date")
          .in("room_id", roomIds)
          .in("date", targetDates);

        const existingMap = new Set(existingAvail?.map(ea => `${ea.room_id}_${ea.date}`) || []);

        const toInsert = [];
        for (const roomId of roomIds) {
          for (const date of targetDates) {
            if (!existingMap.has(`${roomId}_${date}`)) {
              toInsert.push({
                venue_id: venueId,
                room_id: roomId,
                date: date,
                is_available: false,
                is_blocked: true,
              });
            }
          }
        }

        if (toInsert.length > 0) {
          await supabase.from("staycation_availability").insert(toInsert);
        }

        if (existingAvail && existingAvail.length > 0) {
          const existingIds = existingAvail.map(ea => ea.id);
          await supabase
            .from("staycation_availability")
            .update({ is_blocked: true, is_available: false })
            .in("id", existingIds);
        }
      }

      await fetchClosedDates(false);
      return true;
    } catch (err: any) {
      Alert.alert("Error", "Could not block the selected dates. Please try again.");
      return false;
    }
  };

  const removeClosedDate = async (id: string) => {
    try {
      const { data: recordData } = await supabase
        .from("venue_closed_dates")
        .select("start_date, end_date")
        .eq("id", id)
        .single();

      const { error } = await supabase.from("venue_closed_dates").delete().eq("id", id);

      if (error) throw error;

      if (recordData) {
        const targetDates = recordData.end_date
          ? getDatesBetween(recordData.start_date, recordData.end_date)
          : [recordData.start_date];

        const { data: rooms } = await supabase
          .from("staycation_rooms")
          .select("id")
          .eq("venue_id", venueId);

        if (rooms && rooms.length > 0) {
          const roomIds = rooms.map(r => r.id);
          const { data: existingAvail } = await supabase
            .from("staycation_availability")
            .select("id")
            .in("room_id", roomIds)
            .in("date", targetDates);

          if (existingAvail && existingAvail.length > 0) {
            const existingIds = existingAvail.map(ea => ea.id);
            await supabase
              .from("staycation_availability")
              .update({ is_blocked: false, is_available: true })
              .in("id", existingIds);
          }
        }
      }

      await fetchClosedDates(false);
      return true;
    } catch (err: any) {
      Alert.alert("Error", "Could not unblock the selected dates. Please try again.");
      return false;
    }
  };

  useEffect(() => {
    fetchClosedDates(true);
  }, [fetchClosedDates]);

  return {
    upcomingClosedDates,
    pastClosedDates,
    loading,
    setClosedDate,
    removeClosedDate,
    refresh: fetchClosedDates,
  };
};
