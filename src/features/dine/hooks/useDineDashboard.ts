// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import { useState, useEffect } from "react";

export type DashboardTab = "Today" | "Last week" | "This Month" | "Custom";

export const useDineDashboard = (serviceId: string) => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<DashboardTab>("Today");
  const [revenueData, setRevenueData] = useState<any>(null);

  useEffect(() => {
    setLoading(true);
    // Simulate API fetch
    const timer = setTimeout(() => {
      // Mock data based on tab
      const data: any = {
        Today: {
          totalPayout: "+₹12600",
          periodLabel: "Today, 19 Apr 2026",
          payoutLabel: "Total Payout Today",
          graphTitle: "Revenue graph This Week",
          graphData: [
            { label: "16 Apr", amount: "+₹9100", percentage: 70 },
            { label: "17 Apr", amount: "+₹10400", percentage: 80 },
            { label: "18 Apr", amount: "+₹5600", percentage: 45 },
            { label: "19 Apr", subLabel: "Today", amount: "+₹12600", percentage: 95, active: true },
            { label: "20 Apr", amount: null, percentage: 0 },
            { label: "21 Apr", amount: null, percentage: 0 },
            { label: "22 Apr", amount: null, percentage: 0 },
          ],
        },
        "Last week": {
          totalPayout: "+₹65080",
          periodLabel: "Apr 9 - Apr 15",
          payoutLabel: "Total Payout Last week",
          graphTitle: "Revenue graph This Week",
          graphData: [
            { label: "09 Apr", amount: "+₹9100", percentage: 70 },
            { label: "10 Apr", amount: "+₹10400", percentage: 80 },
            { label: "11 Apr", amount: "+₹5600", percentage: 45 },
            { label: "12 Apr", amount: "+₹12600", percentage: 95 },
            { label: "13 Apr", amount: "+₹7000", percentage: 55 },
            { label: "14 Apr", amount: "+₹8600", percentage: 65 },
            { label: "15 Apr", amount: "+₹5600", percentage: 45 },
          ],
        },
        "This Month": {
          totalPayout: "+₹147844",
          periodLabel: "Apr 2026",
          payoutLabel: "Total Payout This week", // As per Figma Frame 6:78778
          graphTitle: "Revenue Graph This Month",
          weeks: [
            {
              id: "w1",
              label: "Week 1",
              dateRange: "Apr 1- Apr 4",
              amount: "+₹10400",
              percentage: 30,
              details: [],
            },
            {
              id: "w2",
              label: "Week 2",
              dateRange: "Apr 5- Apr 11",
              amount: "+₹56000",
              percentage: 85,
              active: true,
              details: [
                { label: "12 Apr", amount: "+₹10400", percentage: 80 },
                { label: "13 Apr", amount: "+₹5600", percentage: 45 },
                { label: "14 Apr", amount: "+₹6400", percentage: 50 },
                { label: "15 Apr", amount: "+₹4000", percentage: 35 },
                { label: "16 Apr", amount: "+₹8000", percentage: 60 },
                { label: "17 Apr", amount: "+₹10400", percentage: 80 },
                { label: "18 Apr", amount: "+₹11200", percentage: 85 },
              ],
            },
            {
              id: "w3",
              label: "Week 3",
              dateRange: "Apr 12 - Apr 18",
              amount: "+₹8000",
              percentage: 25,
              details: [],
            },
            {
              id: "w4",
              label: "Week 4",
              dateRange: "Apr 19 - Apr 25",
              amount: "+₹10400",
              percentage: 30,
              details: [],
            },
            {
              id: "w5",
              label: "Week 5",
              dateRange: "Apr 26 - Apr 30",
              amount: "+₹10400",
              percentage: 30,
              details: [],
            },
          ],
        },
      };
      setRevenueData(data[activeTab] || data.Today);
      setLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, [serviceId, activeTab]);

  return {
    loading,
    activeTab,
    setActiveTab,
    revenueData,
  };
};
