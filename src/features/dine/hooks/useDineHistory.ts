// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import { useState, useEffect } from "react";
import { DineDateFilterOption } from "../components/DineFilterBottomSheet";

const MOCK_HISTORY = [
  {
    date: "01 Apr 2026",
    settlement: "₹5000",
    data: [
      {
        id: "h1",
        name: "Chirag Patil",
        phone: "+91 89346 93456",
        amount: "₹1600",
        type: "Table Booking",
        typeColor: "#63A1FD",
        amountColor: "#000000",
        time: "8 Pm",
      },
      {
        id: "h2",
        name: "Yash Jadhav",
        phone: "+91 89346 93456",
        amount: "₹100",
        type: "Pay Bill",
        typeColor: "#7300FF",
        amountColor: "#000000",
        time: "8 Pm",
      },
      {
        id: "h3",
        name: "Rohit Sharma",
        phone: "+91 89346 93456",
        amount: "₹2400",
        type: "Pay Bill",
        typeColor: "#7300FF",
        amountColor: "#000000",
        time: "8 Pm",
      },
      {
        id: "h4",
        name: "Virat kohli",
        phone: "+91 89346 93456",
        amount: "₹800",
        type: "Table Booking",
        typeColor: "#63A1FD",
        amountColor: "#000000",
        time: "8 Pm",
      },
      {
        id: "h5",
        name: "Sanket Mohite",
        phone: "+91 89346 93456",
        amount: "₹100",
        type: "Table Booking",
        typeColor: "#63A1FD",
        amountColor: "#000000",
        time: "8 Pm",
      },
    ],
  },
  {
    date: "31 Mar 2026",
    settlement: "₹4500",
    data: [
      {
        id: "h6",
        name: "Virat kohli",
        phone: "+91 89346 93456",
        amount: "₹800",
        type: "Table Booking",
        typeColor: "#63A1FD",
        amountColor: "#000000",
        time: "8 Pm",
      },
    ],
  },
];

export const useDineHistory = (serviceId: string) => {
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<DineDateFilterOption>("all");
  const [customRange, setCustomRange] = useState<{ start: Date; end: Date } | undefined>(undefined);
  const [historyGroups, setHistoryGroups] = useState<any[]>([]);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      // In a real app, you'd pass filter/range to the API
      let baseData = MOCK_HISTORY;

      if (searchQuery.trim() !== "") {
        const lowerQuery = searchQuery.toLowerCase();
        baseData = baseData
          .map(group => {
            const filteredData = group.data.filter(
              item =>
                item.name.toLowerCase().includes(lowerQuery) || item.phone.includes(lowerQuery),
            );
            return { ...group, data: filteredData };
          })
          .filter(group => group.data.length > 0);
      }

      setHistoryGroups(baseData);
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [serviceId, searchQuery, filter, customRange]);

  return {
    loading,
    searchQuery,
    setSearchQuery,
    filter,
    setFilter,
    customRange,
    setCustomRange,
    historyGroups,
  };
};
