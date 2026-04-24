// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React from "react";
import { EventHomeScreenOpen } from "./EventHomeScreenOpen";
import { EventHomeScreenAssigned } from "./EventHomeScreenAssigned";

interface EventHomeScreenProps {
  seatingType?: "open" | "assigned";
}

/**
 * Wrapper screen that conditionally renders the open or assigned seating home screen
 * based on the event's seating type.
 */
export const EventHomeScreen = ({ seatingType = "assigned" }: EventHomeScreenProps) => {
  if (seatingType === "open") {
    return <EventHomeScreenOpen />;
  }
  return <EventHomeScreenAssigned />;
};
