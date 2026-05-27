// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

export interface RawBooking {
  id: string;
  paid_amount: number;
  discount_amount?: number;
  payment_type: "full" | "advance";
  date: string; // Unified date string (YYYY-MM-DD)
}

export interface PayoutStrategy {
  getPendingRawData(venueId: string, dates: string[]): Promise<RawBooking[]>;
  getBreakdownRawData(venueId: string, startDate: string, endDate: string): Promise<RawBooking[]>;
  getRpcName(): string;
  getCommissionRate(): number;
}
