// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React from "react";
import { View, StyleSheet } from "react-native";
import { Skeleton } from "./Skeleton";
import { vs, hs, ms } from "@/utils/responsive.utils";

export const ListSkeleton = ({ count = 3 }: { count?: number }) => {
  return (
    <View style={styles.listContainer}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.listItem}>
          <Skeleton width={ms(60)} height={ms(60)} borderRadius={ms(8)} />
          <View style={styles.listItemContent}>
            <Skeleton width="70%" height={vs(16)} style={styles.mb8} />
            <Skeleton width="40%" height={vs(12)} />
          </View>
        </View>
      ))}
    </View>
  );
};

export const DetailsSkeleton = () => {
  return (
    <View style={styles.container}>
      <Skeleton height={vs(250)} borderRadius={0} />
      <View style={styles.detailsContent}>
        <Skeleton width="80%" height={vs(24)} style={styles.mb16} />
        <Skeleton width="40%" height={vs(16)} style={styles.mb24} />

        <View style={styles.row}>
          <Skeleton width={hs(40)} height={hs(40)} borderRadius={hs(20)} />
          <View style={styles.rowText}>
            <Skeleton width="60%" height={vs(16)} style={styles.mb8} />
            <Skeleton width="30%" height={vs(14)} />
          </View>
        </View>

        <Skeleton width="100%" height={vs(1)} style={styles.divider} />

        <Skeleton width="100%" height={vs(60)} borderRadius={ms(12)} style={styles.mb16} />
        <Skeleton width="100%" height={vs(60)} borderRadius={ms(12)} style={styles.mb16} />
        <Skeleton width="100%" height={vs(60)} borderRadius={ms(12)} />
      </View>
    </View>
  );
};

export const DashboardSkeleton = () => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Skeleton width="50%" height={vs(24)} style={styles.mb8} />
        <Skeleton width="30%" height={vs(14)} />
      </View>

      <View style={styles.statsGrid}>
        <Skeleton width="47%" height={vs(100)} borderRadius={ms(12)} />
        <Skeleton width="47%" height={vs(100)} borderRadius={ms(12)} />
        <Skeleton width="47%" height={vs(100)} borderRadius={ms(12)} />
        <Skeleton width="47%" height={vs(100)} borderRadius={ms(12)} />
      </View>

      <View style={styles.chart}>
        <Skeleton width="100%" height={vs(200)} borderRadius={ms(16)} />
      </View>
    </View>
  );
};

export const StaycationSkeleton = () => {
  return (
    <View style={styles.container}>
      {/* Service Header Mockup */}
      <View style={[styles.row, { paddingHorizontal: hs(16), paddingTop: vs(20) }]}>
        <Skeleton width={ms(50)} height={ms(50)} borderRadius={ms(25)} />
        <View style={styles.rowText}>
          <Skeleton width="50%" height={vs(18)} style={styles.mb8} />
          <Skeleton width="30%" height={vs(14)} />
        </View>
      </View>

      {/* Calendar Strip Mockup */}
      <View
        style={[
          styles.row,
          { paddingHorizontal: hs(16), justifyContent: "space-between", marginBottom: vs(20) },
        ]}>
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} width={ms(32)} height={ms(32)} borderRadius={ms(16)} />
        ))}
      </View>

      {/* Booking Cards Mockup */}
      <View style={{ paddingHorizontal: hs(16) }}>
        <Skeleton width="100%" height={vs(180)} borderRadius={ms(16)} style={styles.mb16} />
        <Skeleton width="100%" height={vs(180)} borderRadius={ms(16)} style={styles.mb16} />
      </View>
    </View>
  );
};

export const SportsHomeSkeleton = () => {
  return (
    <View style={styles.container}>
      {/* Service Header Mockup */}
      <View style={[styles.row, { paddingHorizontal: hs(16), paddingTop: vs(20) }]}>
        <View style={styles.rowText}>
          <Skeleton width="60%" height={vs(24)} style={styles.mb8} />
          <Skeleton width="30%" height={vs(16)} />
        </View>
        <Skeleton width={ms(50)} height={ms(50)} borderRadius={ms(25)} />
      </View>

      {/* Legend & Dropdown Mockup */}
      <View style={{ paddingHorizontal: hs(16), marginBottom: vs(20) }}>
        <View style={[styles.row, { justifyContent: "space-between", marginBottom: vs(16) }]}>
          <Skeleton width="40%" height={vs(20)} borderRadius={ms(4)} />
          <Skeleton width="20%" height={vs(20)} borderRadius={ms(4)} />
        </View>

        {/* Time Slot Grid Mockup */}
        <View style={[styles.statsGrid, { paddingHorizontal: 0, gap: vs(8) }]}>
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} width="23%" height={vs(40)} borderRadius={ms(8)} />
          ))}
        </View>
      </View>

      {/* List Header Mockup */}
      <View style={{ paddingHorizontal: hs(16), marginBottom: vs(16) }}>
        <Skeleton width="30%" height={vs(20)} borderRadius={ms(4)} />
      </View>

      {/* Booking List Mockup */}
      <View style={{ paddingHorizontal: hs(16) }}>
        <Skeleton width="100%" height={vs(80)} borderRadius={ms(12)} style={styles.mb16} />
        <Skeleton width="100%" height={vs(80)} borderRadius={ms(12)} style={styles.mb16} />
        <Skeleton width="100%" height={vs(80)} borderRadius={ms(12)} style={styles.mb16} />
      </View>
    </View>
  );
};

export const EventHomeSkeleton = () => {
  return (
    <View style={styles.container}>
      {/* Event Header Mockup */}
      <View style={[styles.row, { paddingHorizontal: hs(16), paddingTop: vs(20) }]}>
        <View style={styles.rowText}>
          <Skeleton width="70%" height={vs(28)} style={styles.mb8} />
          <Skeleton width="40%" height={vs(16)} />
        </View>
        <Skeleton width={ms(60)} height={ms(60)} borderRadius={ms(30)} />
      </View>

      {/* Summary Stats Mockup */}
      <View style={[styles.row, { paddingHorizontal: hs(16), gap: hs(12), marginBottom: vs(24) }]}>
        <Skeleton width="48%" height={vs(90)} borderRadius={ms(16)} />
        <Skeleton width="48%" height={vs(90)} borderRadius={ms(16)} />
      </View>

      {/* Filter Tabs Mockup */}
      <View style={[styles.row, { paddingHorizontal: hs(16), gap: hs(8), marginBottom: vs(24) }]}>
        <Skeleton width={ms(80)} height={vs(36)} borderRadius={ms(18)} />
        <Skeleton width={ms(100)} height={vs(36)} borderRadius={ms(18)} />
        <Skeleton width={ms(90)} height={vs(36)} borderRadius={ms(18)} />
      </View>

      {/* Event Booking List Mockup */}
      <View style={{ paddingHorizontal: hs(16) }}>
        <View style={[styles.row, { justifyContent: "space-between", marginBottom: vs(16) }]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: hs(12) }}>
            <Skeleton width={ms(40)} height={ms(40)} borderRadius={ms(20)} />
            <View>
              <Skeleton width={ms(100)} height={vs(14)} style={styles.mb8} />
              <Skeleton width={ms(80)} height={vs(12)} />
            </View>
          </View>
          <Skeleton width={ms(60)} height={vs(24)} borderRadius={ms(12)} />
        </View>

        <View style={[styles.row, { justifyContent: "space-between", marginBottom: vs(16) }]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: hs(12) }}>
            <Skeleton width={ms(40)} height={ms(40)} borderRadius={ms(20)} />
            <View>
              <Skeleton width={ms(100)} height={vs(14)} style={styles.mb8} />
              <Skeleton width={ms(80)} height={vs(12)} />
            </View>
          </View>
          <Skeleton width={ms(60)} height={vs(24)} borderRadius={ms(12)} />
        </View>

        <View style={[styles.row, { justifyContent: "space-between", marginBottom: vs(16) }]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: hs(12) }}>
            <Skeleton width={ms(40)} height={ms(40)} borderRadius={ms(20)} />
            <View>
              <Skeleton width={ms(100)} height={vs(14)} style={styles.mb8} />
              <Skeleton width={ms(80)} height={vs(12)} />
            </View>
          </View>
          <Skeleton width={ms(60)} height={vs(24)} borderRadius={ms(12)} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    padding: ms(16),
  },
  listItem: {
    flexDirection: "row",
    marginBottom: vs(16),
    alignItems: "center",
  },
  listItemContent: {
    marginLeft: hs(12),
    flex: 1,
  },
  mb8: {
    marginBottom: vs(8),
  },
  mb16: {
    marginBottom: vs(16),
  },
  mb24: {
    marginBottom: vs(24),
  },
  header: {
    paddingHorizontal: hs(16),
    paddingTop: vs(20),
    marginBottom: vs(24),
  },
  headerText: {
    marginLeft: hs(16),
    flex: 1,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: hs(16),
    gap: vs(16),
    marginBottom: vs(24),
  },
  chart: {
    marginHorizontal: hs(16),
  },
  detailsContent: {
    padding: ms(20),
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  rowText: {
    marginLeft: hs(12),
    flex: 1,
  },
  divider: {
    marginVertical: vs(24),
  },
});
