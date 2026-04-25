// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Alert } from "react-native";

export interface OfferRecord {
  id: string;
  type: "coupon" | "discount";
  code?: string;
  description: string;
  discountType: "flat" | "percentage";
  discountValue: number;
  minOrderValue: number;
  maxDiscount?: number;
  usageLimit: string;
  totalUsagePerUser: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  status: "active" | "pending" | "expired" | "rejected";
}

export const useStaycationOffers = (venueId: string) => {
  const [onGoingOffers, setOnGoingOffers] = useState<OfferRecord[]>([]);
  const [pastOffers, setPastOffers] = useState<OfferRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOffers = useCallback(
    async (isInitialLoad = false) => {
      if (!venueId) {
        setLoading(false);
        return;
      }
      if (isInitialLoad) setLoading(true);

      try {
        const { data, error } = await supabase
          .from("promotions")
          .select("*")
          .eq("venue_id", venueId)
          .is("deleted_at", null)
          .order("created_at", { ascending: false });

        if (error) throw error;

        const active: OfferRecord[] = [];
        const past: OfferRecord[] = [];
        const now = new Date().toISOString();

        (data || []).forEach(item => {
          const type = item.code.startsWith("AUTO_") ? "discount" : "coupon";
          const code = item.code.startsWith("AUTO_") ? undefined : item.code;

          let status: "active" | "pending" | "expired" | "rejected" = "active";
          if (item.valid_until < now) {
            status = "expired";
          } else if (!item.is_active) {
            status = "pending";
          }

          const record: OfferRecord = {
            id: item.id,
            type,
            code,
            description: item.description || "",
            discountType: item.discount_type as "flat" | "percentage",
            discountValue: item.discount_value,
            minOrderValue: item.min_booking_amount,
            maxDiscount: item.max_discount_amount,
            usageLimit: item.max_uses > 1000000 ? "Everyone" : "Limited",
            totalUsagePerUser: item.max_uses_per_user,
            validFrom: item.valid_from,
            validUntil: item.valid_until,
            isActive: item.is_active,
            status,
          };

          if (status === "expired") {
            past.push(record);
          } else {
            active.push(record);
          }
        });

        setOnGoingOffers(active);
        setPastOffers(past);
      } catch (err: any) {
        console.error("Error fetching staycation offers:", err.message);
      } finally {
        if (isInitialLoad) setLoading(false);
      }
    },
    [venueId],
  );

  const createOffer = async (record: Omit<OfferRecord, "id" | "isActive" | "status">) => {
    try {
      const finalCode =
        record.code || `AUTO_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      const { error } = await supabase.from("promotions").insert([
        {
          venue_id: venueId,
          code: finalCode,
          description: record.description,
          discount_type: record.discountType,
          discount_value: record.discountValue,
          min_booking_amount: record.minOrderValue,
          max_discount_amount: record.maxDiscount || null,
          max_uses: record.usageLimit === "Everyone" ? 9999999 : 100,
          max_uses_per_user: record.totalUsagePerUser,
          valid_from: record.validFrom,
          valid_until: record.validUntil,
          vertical: "staycation",
          is_active: false,
        },
      ]);

      if (error) throw error;

      await fetchOffers(false);
      return true;
    } catch (err: any) {
      Alert.alert("Error", err.message);
      return false;
    }
  };

  const deleteOffer = async (id: string) => {
    try {
      const { error } = await supabase
        .from("promotions")
        .update({ deleted_at: new Date().toISOString(), is_active: false })
        .eq("id", id);

      if (error) throw error;

      await fetchOffers(false);
      return true;
    } catch (err: any) {
      Alert.alert("Error", err.message);
      return false;
    }
  };

  useEffect(() => {
    fetchOffers(true);
  }, [fetchOffers]);

  return {
    onGoingOffers,
    pastOffers,
    loading,
    createOffer,
    deleteOffer,
    refresh: fetchOffers,
  };
};
