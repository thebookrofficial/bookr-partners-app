// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

export interface StaycationBooking {
  id: string;
  name: string;
  phone: string;
  avatarUrl?: string;
  amount: string;
  status: "Advance" | "Full" | "Offline" | "Complete" | "Remaining" | "Online";
  checkIn: string;
  checkOut: string;
  guestCount: number;
}

export interface StaycationDashboardData {
  totalBookings: number;
  onlineBookings: number;
  offlineBookings: number;
  totalRevenue: string;
  onlineRevenue: string;
  offlineRevenue: string;
  weeklyRevenue: {
    week: string;
    dates: string;
    amount: string;
    percentage: number;
  }[];
}
