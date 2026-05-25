// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

export type PassType = "All" | "Regular" | "Premium" | "VIP" | "Guest";

export interface EventGuest {
  id: string;
  name: string;
  phone: string;
  time: string;
  passType: PassType;
  quantity: number;
  isOffline?: boolean;
  avatarUrl?: string;
}

export interface EventDetails {
  id: string;
  title: string;
  date: string;
  dayLabel: string;
  guestCounts: Record<PassType, number>;
}

export interface StatBreakdownItem {
  label: string;
  value: string | number;
  color?: string;
}

export interface StatSummaryData {
  title: string;
  highlightValue: string | number;
  highlightLabel: string;
  highlightColor?: string;
  breakdown: StatBreakdownItem[];
}

export interface RevenueGraphItem {
  label: string;
  value: string;
  rawValue: number;
}

export interface BookingGraphItem {
  day: string;
  date: string;
  value: number;
  color: string;
}

export interface PassCategoryGraphItem {
  day: string;
  date: string;
  regular: number;
  premium: number;
  vip: number;
}

/**
 * Database representation of an Event
 */
export interface DBEvent {
  id: string;
  venue_id: string;
  owner_id: string;
  title: string;
  slug: string;
  description: string | null;
  ticket_type: string;
  seating_type: string;
  event_status: string;
  age_restriction: string | null;
  start_datetime: string;
  end_datetime: string;
  total_capacity: number;
  available_capacity: number;
  base_price: number;
  cover_image_url: string | null;
  event_language: string;
  has_parking: boolean;
}

/**
 * Database representation of an Event Pass
 */
export interface DBEventPass {
  id: string;
  event_id: string;
  name: string;
  description: string | null;
  price: number;
  total_quantity: number;
  available_quantity: number;
  sale_starts_at: string | null;
  sale_ends_at: string | null;
  is_active: boolean;
}

/**
 * Database representation of an Event Zone
 */
export interface DBEventZone {
  id: string;
  event_id: string;
  zone_name: string;
  description: string | null;
  capacity: number;
  available: number;
  price: number;
  color_hex: string | null;
}

/**
 * Database representation of an Event Seat
 */
export interface DBEventSeat {
  id: string;
  event_id: string;
  zone_id: string | null;
  row_label: string;
  seat_number: string;
  price: number;
  status: string;
  section_name: string | null;
}

/**
 * Composite data for event availability
 */
export interface EventAvailabilityData {
  event: DBEvent;
  passes: DBEventPass[];
  zones: DBEventZone[];
  seats: DBEventSeat[];
}

/**
 * Payload for creating an event booking via RPC
 */
export interface EventBookingPayload {
  user_id: string;
  event_id: string;
  pass_id?: string;
  seat_ids?: string[];
  zone_id?: string;
  ticket_count: number;
  subtotal: number;
  discount_amount: number;
  platform_fee: number;
  gateway_fee: number;
  total_amount: number;
  vendor_payout: number;
  promotion_id?: string;
  guest_name?: string;
  guest_phone?: string;
}
