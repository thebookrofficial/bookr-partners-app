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
  status: "active" | "pending" | "expired" | "rejected"; // Internal status for UI
}

export const useEventOffers = (venueId: string) => {
  const [onGoingOffers, setOnGoingOffers] = useState<OfferRecord[]>([]);
  const [pastOffers, setPastOffers] = useState<OfferRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventData, setEventData] = useState<{
    title: string;
    cover_image_url: string | null;
  } | null>(null);

  const fetchEventDetails = useCallback(async () => {
    if (!venueId) return;
    try {
      const { data, error } = await supabase
        .from("events")
        .select("title, cover_image_url")
        .eq("venue_id", venueId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setEventData(data);
    } catch (err: any) {
      console.error("Error fetching event details for offers:", err.message);
    }
  }, [venueId]);

  const fetchOffers = useCallback(
    async (isInitialLoad = false) => {
      if (!venueId) {
        if (isInitialLoad) setLoading(false);
        return;
      }
      if (isInitialLoad) setLoading(true);

      try {
        const { data, error } = await supabase
          .from("promotions")
          .select("*")
          .eq("venue_id", venueId)
          .eq("vertical", "events")
          .is("deleted_at", null)
          .order("created_at", { ascending: false });

        if (error) throw error;

        const active: OfferRecord[] = [];
        const past: OfferRecord[] = [];
        const now = new Date().toISOString();

        (data || []).forEach(item => {
          // If a coupon code starts with AUTO_, it's an automatic discount.
          const type = item.code.startsWith("AUTO_") ? "discount" : "coupon";
          const code = item.code.startsWith("AUTO_") ? undefined : item.code;

          let status: "active" | "pending" | "expired" | "rejected" = "active";
          if (item.valid_until < now) {
            status = "expired";
          } else if (!item.is_active) {
            // Assume inactive means pending review or disabled by admin
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
        console.error("Error fetching event offers:", err.message);
      } finally {
        if (isInitialLoad) setLoading(false);
      }
    },
    [venueId],
  );

  const createOffer = async (record: Omit<OfferRecord, "id" | "isActive" | "status">) => {
    try {
      if (!venueId) throw new Error("Venue ID not found for this event.");

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be logged in to create an offer.");

      // If it's a discount (no code), we generate a hidden internal code
      const finalCode =
        record.code || `AUTO_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // Final validation to avoid NaN
      if (isNaN(record.discountValue) || record.discountValue <= 0) {
        throw new Error("Invalid discount value.");
      }
      if (isNaN(record.minOrderValue)) {
        throw new Error("Invalid minimum order value.");
      }

      const { error } = await supabase.from("promotions").insert([
        {
          venue_id: venueId,
          user_id: user.id,
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
          vertical: "events",
          is_active: false, // Set to false for Admin Review requirement
        },
      ]);

      if (error) throw error;

      await fetchOffers(false);
      return true;
    } catch (err: any) {
      console.error("Error creating offer:", err);
      Alert.alert("Error", err.message || "Failed to create offer.");
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
    fetchEventDetails();
  }, [fetchEventDetails]);

  useEffect(() => {
    if (venueId) {
      fetchOffers(true);
    }
  }, [venueId, fetchOffers]);

  return {
    onGoingOffers,
    pastOffers,
    loading,
    eventData,
    createOffer,
    deleteOffer,
    refresh: fetchOffers,
  };
};
