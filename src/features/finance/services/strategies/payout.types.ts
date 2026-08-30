// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

export interface RawBooking {
  id: string;
  paid_amount: number;
  subtotal?: number;
  platform_fee?: number;
  total_amount: number;
  discount_amount?: number;
  unit_count?: number;
  payment_type: "full" | "advance";
  date: string;
  check_out_date?: string;
  start_time?: string;
  end_time?: string;
  user_name?: string;
  user_phone?: string;
  sports_type?: string;
  booking_group_id?: string | null;
  parent_booking_id?: string | null;
  booking_status: string;

  // Database-configured payout rates.
  commission_percentage?: number;
  gateway_percentage?: number;
}

export interface PayoutStrategy {
  getPendingRawData(venueId: string, dates: string[]): Promise<RawBooking[]>;
  getBreakdownRawData(venueId: string, startDate: string, endDate: string): Promise<RawBooking[]>;
  getExportRawData(venueId: string, startDate: string, endDate: string): Promise<RawBooking[]>;
  getRpcName(): string;
  getCommissionRate(): number;
}
