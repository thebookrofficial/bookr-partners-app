// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import { useState } from "react";
import { createEventBookingRPC } from "../services/event.service";
import { EventBookingPayload } from "../types/event.types";

/**
 * Custom hook to manage the creation of an event booking via RPC.
 *
 * @returns An object containing the bookEvent function, loading state, error, and success state.
 */
export const useCreateEventBooking = () => {
  const [isBooking, setIsBooking] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  /**
   * Executes the booking RPC.
   *
   * @param payload - The booking data payload.
   * @param rpcName - The name of the Supabase RPC function.
   * @returns A promise resolving to the booking result or null on failure.
   */
  const bookEvent = async (payload: EventBookingPayload, rpcName: string) => {
    setIsBooking(true);
    setError(null);
    setIsSuccess(false);

    try {
      const result = await createEventBookingRPC(payload, rpcName);
      setIsSuccess(true);
      return result;
    } catch (err: any) {
      setError(err.message || "An error occurred while creating the booking");
      return null;
    } finally {
      setIsBooking(false);
    }
  };

  return {
    bookEvent,
    isBooking,
    error,
    isSuccess,
    reset: () => {
      setError(null);
      setIsSuccess(false);
    },
  };
};
