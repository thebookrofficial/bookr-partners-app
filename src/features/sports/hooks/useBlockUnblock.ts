// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Alert } from "react-native";

export interface BlockedEntry {
  id: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  isAllDay: boolean;
  slotIds: string[];
}

export const useBlockUnblock = (venueId: string, groundId: string) => {
  const [activeBlocks, setActiveBlocks] = useState<BlockedEntry[]>([]);
  const [pastBlocks, setPastBlocks] = useState<BlockedEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false); // FIXED: Added missing state

  const fetchBlocks = useCallback(
    async (isInitialLoad = false) => {
      if (!venueId || !groundId) {
        setLoading(false);
        return;
      }
      if (isInitialLoad) setLoading(true);

      try {
        const { data, error } = await supabase
          .from("sports_slots")
          .select("id, slot_date, start_time, end_time")
          .eq("venue_id", venueId)
          .eq("ground_id", groundId)
          .eq("status", "blocked")
          .order("slot_date", { ascending: true })
          .order("start_time", { ascending: true });

        if (error) throw error;

        const dailyGroups: Record<string, BlockedEntry[]> = {};

        (data || []).forEach(slot => {
          if (!dailyGroups[slot.slot_date]) {
            dailyGroups[slot.slot_date] = [];
          }

          const dayBlocks = dailyGroups[slot.slot_date];
          const lastBlock = dayBlocks.length > 0 ? dayBlocks[dayBlocks.length - 1] : null;

          if (lastBlock && lastBlock.endTime === slot.start_time) {
            lastBlock.endTime = slot.end_time;
            lastBlock.slotIds.push(slot.id);
          } else {
            dayBlocks.push({
              id: slot.id,
              startDate: slot.slot_date,
              endDate: slot.slot_date,
              startTime: slot.start_time,
              endTime: slot.end_time,
              isAllDay: false,
              slotIds: [slot.id],
            });
          }
        });

        const flattenedDailyBlocks: BlockedEntry[] = [];
        Object.keys(dailyGroups)
          .sort()
          .forEach(date => {
            flattenedDailyBlocks.push(...dailyGroups[date]);
          });

        const finalBlocks: BlockedEntry[] = [];
        let currentRangeBlock: BlockedEntry | null = null;

        flattenedDailyBlocks.forEach(block => {
          if (!currentRangeBlock) {
            currentRangeBlock = block;
          } else {
            const isSameTime =
              currentRangeBlock.startTime === block.startTime &&
              currentRangeBlock.endTime === block.endTime;

            const prevDateObj = new Date(currentRangeBlock.endDate);
            const currDateObj = new Date(block.startDate);
            const diffTime = Math.abs(currDateObj.getTime() - prevDateObj.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (isSameTime && diffDays === 1) {
              currentRangeBlock.endDate = block.startDate;
              currentRangeBlock.slotIds.push(...block.slotIds);
            } else {
              finalBlocks.push(currentRangeBlock);
              currentRangeBlock = block;
            }
          }
        });

        if (currentRangeBlock) {
          finalBlocks.push(currentRangeBlock);
        }

        const active: BlockedEntry[] = [];
        const past: BlockedEntry[] = [];
        const todayDateObj = new Date();
        todayDateObj.setHours(0, 0, 0, 0);

        finalBlocks.forEach(group => {
          const groupEndDateObj = new Date(group.endDate);
          groupEndDateObj.setHours(0, 0, 0, 0);

          if (groupEndDateObj >= todayDateObj) {
            active.push(group);
          } else {
            past.push(group);
          }
        });

        setActiveBlocks(active);
        setPastBlocks(past);
      } catch (err) {
        console.error("Error fetching blocks:", err);
      } finally {
        if (isInitialLoad) setLoading(false);
      }
    },
    [venueId, groundId],
  );

  const blockSlots = async (
    dates: string[],
    fromTime: string | null,
    toTime: string | null,
    isAllDay: boolean,
  ) => {
    try {
      setIsSubmitting(true);

      // Simple direct update on existing rows
      let query = supabase
        .from("sports_slots")
        .update({ status: "blocked", blocked_reason: "Manual Block" })
        .eq("venue_id", venueId)
        .eq("ground_id", groundId)
        .in("slot_date", dates); // Handles all selected dates at once

      if (!isAllDay && fromTime && toTime) {
        query = query.gte("start_time", fromTime).lt("start_time", toTime);
      }

      const { error } = await query;
      if (error) throw error;

      Alert.alert("Success", "Slots blocked.");
      await fetchBlocks(false);
      return true;
    } catch (err: any) {
      Alert.alert("Error", err.message);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const unblockSlots = async (slotIds: string[]) => {
    try {
      const { error } = await supabase
        .from("sports_slots")
        .update({ status: "available", blocked_reason: null })
        .in("id", slotIds);

      if (error) throw error;
      await fetchBlocks(false);
      return true;
    } catch (err: any) {
      Alert.alert("Error", err.message);
      return false;
    }
  };

  useEffect(() => {
    fetchBlocks(true);
  }, [fetchBlocks]);

  return {
    activeBlocks,
    pastBlocks,
    loading,
    isSubmitting,
    blockSlots,
    unblockSlots,
    refresh: fetchBlocks,
  };
};
