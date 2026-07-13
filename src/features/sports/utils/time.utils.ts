// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

/**
 * Generates an array of time slot strings based on the given interval.
 * @param startHour The starting hour (e.g., 6 for 6 AM). Default 6.
 * @param endHour The ending hour (e.g., 24 for 12 AM). Default 24.
 * @param intervalMinutes The slot duration in minutes (e.g., 60 or 30). Default 60.
 * @returns Array of time strings like ["6:00 AM", "6:30 AM", "7:00 AM", ... "12:00 AM"]
 */
export const generateTimeSlots = (
  startHour: number = 6,
  endHour: number = 24,
  intervalMinutes: number = 60,
): string[] => {
  const slots: string[] = [];
  let currentMinutes = startHour * 60;
  const endMinutes = endHour * 60;

  while (currentMinutes <= endMinutes) {
    const h = Math.floor(currentMinutes / 60);
    const m = currentMinutes % 60;

    // Formatting display hour
    let displayHour = h % 12;
    if (displayHour === 0) displayHour = 12;

    const ampm = h >= 12 && h < 24 ? "PM" : "AM";
    const displayMinutes = m.toString().padStart(2, "0");

    // For exact hours without minutes (e.g., "6 AM" or "6:00 AM")
    // We should be explicit and use "6:00 AM" if interval is < 60 to align styling,
    // but the previous codebase used "6 AM" for hourly.
    // To be safe and compatible with half-hours, we'll format as "H:MM AM/PM" if interval is 30.
    // If interval is 60, we'll keep "H AM/PM" to not break any external deps,
    // though the request asks to support both. Let's use H:MM AM/PM for 30 and H AM/PM for 60.

    if (intervalMinutes < 60) {
      slots.push(`${displayHour}:${displayMinutes} ${ampm}`);
    } else {
      slots.push(`${displayHour} ${ampm}`);
    }

    // Always include the exact end boundary, but break after it
    if (currentMinutes === endMinutes) break;

    currentMinutes += intervalMinutes;
  }

  // Handle 12 AM edge case at the very end
  if (intervalMinutes >= 60 && slots[slots.length - 1] === "12 AM") {
    // It's correct for 24:00
  } else if (intervalMinutes < 60 && slots[slots.length - 1] === "12:00 AM") {
    // Also correct for 24:00
  }

  return slots;
};

/**
 * Converts a 12-hour format string ("6 AM", "6:30 PM", "12 AM") to 24-hour "HH:MM:00" format.
 * @param time12h The time string to convert.
 * @param isEnd If true and time is 12 AM, returns 24:00:00 instead of 00:00:00
 */
export const parseTimeTo24Hour = (time12h: string, isEnd: boolean = false): string => {
  if (!time12h) return "";

  if (time12h === "12 AM" || time12h === "12:00 AM") {
    return isEnd ? "24:00:00" : "00:00:00";
  }

  const [time, modifier] = time12h.split(" ");
  let [hoursStr, minutesStr] = time.split(":");

  let hours = parseInt(hoursStr, 10);
  const minutes = minutesStr ? parseInt(minutesStr, 10) : 0;

  if (hours === 12 && modifier.toUpperCase() === "AM") hours = 0;
  if (hours < 12 && modifier.toUpperCase() === "PM") hours += 12;

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:00`;
};
