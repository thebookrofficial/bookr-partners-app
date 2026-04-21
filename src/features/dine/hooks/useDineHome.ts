// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import { useState, useEffect } from "react";

// Mock data for initial development
const MOCK_VENUE = {
  id: "venue-1",
  name: "Hotel tikka lab",
  cover_image_url: null,
};

const MOCK_BOOKINGS = [
  {
    id: "1",
    name: "Chirag Patil",
    phone: "+91 89346 93456",
    date: "Mon, 7 Apr 2026",
    time: "7 Pm",
    guestCount: "12 Guest",
    occasion: "Birthday",
    status: "Online" as const,
    avatarUrl: undefined,
  },
  {
    id: "2",
    name: "Yash Jadhav",
    phone: "+91 89346 93456",
    date: "Mon, 7 Apr 2026",
    time: "8 Pm",
    guestCount: "12 Guest",
    occasion: "",
    status: "Offline" as const,
    avatarUrl: undefined,
  },
  {
    id: "3",
    name: "Yash Jadhav",
    phone: "+91 89346 93456",
    date: "Mon, 7 Apr 2026",
    time: "8 Pm",
    guestCount: "9 Guest",
    occasion: "",
    status: "Offline" as const,
    avatarUrl: undefined,
  },
  {
    id: "4",
    name: "Yash Jadhav",
    phone: "+91 89346 93456",
    date: "Mon, 7 Apr 2026",
    time: "8 Pm",
    guestCount: "8 Guest",
    occasion: "",
    status: "Offline" as const,
    avatarUrl: undefined,
  },
  {
    id: "5",
    name: "Rohit Sharma",
    phone: "+91 89346 93456",
    date: "Mon, 7 Apr 2026",
    time: "9 Pm",
    guestCount: "12 Guest",
    occasion: "",
    status: "Online" as const,
    avatarUrl: undefined,
  },
];

const MOCK_PAYMENTS = [
  {
    date: "Today 03 Apr 2026",
    data: [
      {
        id: "p1",
        name: "Yash Jadhav",
        phone: "+91 89346 93456",
        amount: "₹1000",
        type: "Pay Bill",
        typeColor: "#7300FF",
        amountColor: "#00B562",
        time: "8:42 Pm",
        avatarUrl: undefined,
      },
      {
        id: "p2",
        name: "Chirag Patil",
        phone: "+91 89346 93456",
        amount: "₹1600",
        type: "Table Booking (8 Pm)",
        typeColor: "#63A1FD",
        amountColor: "#000000",
        time: "9:02 Pm",
        avatarUrl: undefined,
      },
    ],
  },
  {
    date: "02 Apr 2026",
    data: [
      {
        id: "p3",
        name: "Yash Jadhav",
        phone: "+91 89346 93456",
        amount: "₹1000",
        type: "Pay Bill",
        typeColor: "#7300FF",
        amountColor: "#00B562",
        time: "8:42 Pm",
        avatarUrl: undefined,
      },
      {
        id: "p4",
        name: "Chirag Patil",
        phone: "+91 89346 93456",
        amount: "₹1600",
        type: "Table Booking (8 Pm)",
        typeColor: "#63A1FD",
        amountColor: "#000000",
        time: "9:02 Pm",
        avatarUrl: undefined,
      },
    ],
  },
];

export const useDineHome = (serviceId: string) => {
  const [loading, setLoading] = useState(true);
  const [venue, setVenue] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState(new Date(2026, 3, 3)); // April 3, 2026
  const [bookings, setBookings] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("Upcoming");
  const [filter, setFilter] = useState("Today");

  useEffect(() => {
    setLoading(true);
    // Simulate API fetch for the specific selectedDate
    const timer = setTimeout(() => {
      setVenue(MOCK_VENUE);
      setBookings(MOCK_BOOKINGS);
      setPayments(MOCK_PAYMENTS);
      setLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, [serviceId, selectedDate]);

  return {
    loading,
    venue,
    selectedDate,
    setSelectedDate,
    bookings,
    payments,
    activeTab,
    setActiveTab,
    filter,
    setFilter,
  };
};
