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
