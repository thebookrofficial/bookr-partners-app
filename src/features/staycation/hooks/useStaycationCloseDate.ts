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

      await fetchClosedDates(false);
      return true;
    } catch (err: any) {
      Alert.alert("Error", err.message);
      return false;
    }
  };

  const removeClosedDate = async (id: string) => {
    try {
      const { error } = await supabase.from("venue_closed_dates").delete().eq("id", id);

      if (error) throw error;

      await fetchClosedDates(false);
      return true;
    } catch (err: any) {
      Alert.alert("Error", err.message);
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
