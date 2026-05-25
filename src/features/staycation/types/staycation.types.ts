// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

export interface StaycationBooking {
  id: string; // The UI unique ID (e.g., "uuid-unit-1")
  dbId?: string; // The real database UUID for fetching/cancelling
  name: string;
  phone: string;
  avatarUrl?: string;
  amount: string;
  paidAmount?: number;
  totalAmount?: number;
  status: "Offline" | "Complete" | "Remaining" | "Online" | "Cancelled";
  checkIn: string;
  checkOut: string;
  guestCount: number;
  roomName?: string;
  roomType?: string;
  bookingType?: "full_property" | "per_room";
}

export interface StaycationVenue {
  id: string;
  venueId?: string; // Reference to the parent venue
  name: string;
  cover_image_url: string | null;
  property_type: string;
  booking_type: "full_property" | "per_room";
  tabLabel?: string;
  base_price_per_night?: number;
  extra_guest_charge?: number;
  max_occupancy?: number;
}

export interface StaycationRoom {
  id: string;
  venue_id: string;
  room_name: string;
  room_number: string;
  price_per_night: number;
  max_occupancy: number;
  is_active: boolean;
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
