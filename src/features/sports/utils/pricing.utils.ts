// src/features/sports/utils/pricing.utils.ts

/**
 * Normalizes a time string like "6:00 AM" or "06:00 AM" to standard "06:00 AM" format
 * to ensure robust string matching across components and databases.
 */
export const normalizeTime = (timeStr: string) => {
  if (!timeStr) return "";
  const parts = timeStr.trim().split(" ");
  if (parts.length !== 2) return timeStr;
  let timePart = parts[0];
  const ampm = parts[1].toUpperCase();
  if (timePart.length === 4) {
    // e.g., "6:00" -> "06:00"
    timePart = `0${timePart}`;
  }
  return `${timePart} ${ampm}`;
};

/**
 * Converts a 12-hour or 24-hour time string to total minutes for easy comparison.
 * e.g., "06:00 AM" -> 360, "18:00" -> 1080
 */
export const timeToMinutes = (timeStr: string): number => {
  if (!timeStr) return 0;

  const is12Hour = timeStr.toUpperCase().includes("AM") || timeStr.toUpperCase().includes("PM");

  if (is12Hour) {
    const parts = timeStr.trim().split(" ");
    if (parts.length < 2) return 0;
    let [hours, minutes] = parts[0].split(":").map(Number);
    const ampm = parts[1].toUpperCase();

    if (ampm === "PM" && hours < 12) hours += 12;
    if (ampm === "AM" && hours === 12) hours = 0;

    return hours * 60 + (minutes || 0);
  } else {
    // 24-hour format like "10:00", "10:00:00"
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours * 60 + (minutes || 0);
  }
};

export const getParsedCustomPricing = (ground: any, allGrounds?: any[]): any[] => {
  if (!ground) return [];

  let currentGround = ground;
  let customPricing = currentGround.custom_pricing;

  // If the ground has no custom_pricing but has a parent_ground_id, inherit from parent
  if (
    (!customPricing ||
      customPricing === "[]" ||
      (Array.isArray(customPricing) && customPricing.length === 0)) &&
    currentGround.parent_ground_id &&
    allGrounds
  ) {
    const parent = allGrounds.find((g: any) => g.id === currentGround.parent_ground_id);
    if (parent && parent.custom_pricing) {
      customPricing = parent.custom_pricing;
    }
  }

  if (typeof customPricing === "string") {
    try {
      customPricing = JSON.parse(customPricing);
    } catch (e) {
      return [];
    }
  }
  return Array.isArray(customPricing) ? customPricing : [];
};

/**
 * Calculates the price for a specific slot based on the ground's custom_pricing array.
 * If no custom_pricing is defined or it's empty, falls back to legacy boundary logic (5 PM switch).
 *
 * @param ground The ground object fetched from the database, possibly containing custom_pricing JSONB array.
 * @param slotTime The string representation of the slot, e.g., "06:00 AM"
 * @param defaultBoundary The index of 5 PM in the startTimes array (legacy support)
 * @param slotIndex The index of the current slot time (legacy support)
 */
export const calculateSlotPrice = (
  ground: any,
  slotTime: string,
  defaultBoundary: number = -1,
  slotIndex: number = -1,
  allGrounds?: any[],
): number => {
  const customPricing = getParsedCustomPricing(ground, allGrounds);

  // If custom_pricing array exists and is populated
  if (customPricing.length > 0) {
    const slotMinutes = timeToMinutes(slotTime);

    for (const session of customPricing) {
      if (session.selectedDaySlots !== undefined) {
        // Fallback for old custom_pricing format
        const normalizedSlot = normalizeTime(slotTime);
        const daySlots = (session.selectedDaySlots || []).map(normalizeTime);
        const nightSlots = (session.selectedNightSlots || []).map(normalizeTime);

        if (daySlots.includes(normalizedSlot)) return Number(session.priceDay) || 0;
        if (nightSlots.includes(normalizedSlot)) return Number(session.priceNight) || 0;
      } else if (session.startTime && session.endTime) {
        // New session format
        const startMinutes = timeToMinutes(session.startTime);
        const endMinutes = timeToMinutes(session.endTime);

        let fallsIn = false;
        if (startMinutes <= endMinutes) {
          fallsIn = slotMinutes >= startMinutes && slotMinutes < endMinutes;
        } else {
          // Overnight session
          fallsIn = slotMinutes >= startMinutes || slotMinutes < endMinutes;
        }

        if (fallsIn) {
          return Number(session.price) || 0;
        }
      }
    }

    // If it's strictly not in the arrays but we reached here
    return Number(ground.price_per_slot) || 0;
  }

  // FALLBACK LOGIC: Legacy 5 PM split
  if (slotIndex > -1 && defaultBoundary > -1 && slotIndex >= defaultBoundary) {
    return Number(ground.night_price_per_slot) || Number(ground.price_per_slot) || 0;
  }

  return Number(ground.price_per_slot) || 0;
};

/**
 * Returns an array of valid slot strings for a given ground, filtering out times
 * that are not allowed based on custom_pricing configurations.
 * If custom_pricing is absent, returns all input slots.
 */
export const getValidSlotsForGround = (
  ground: any,
  generatedSlots: string[],
  allGrounds?: any[],
): string[] => {
  const customPricing = getParsedCustomPricing(ground, allGrounds);

  if (customPricing.length > 0) {
    return generatedSlots.filter(slot => {
      const slotMinutes = timeToMinutes(slot);
      const normalizedSlot = normalizeTime(slot);

      for (const session of customPricing) {
        if (session.selectedDaySlots !== undefined) {
          // Fallback for old custom_pricing format
          const daySlots = (session.selectedDaySlots || []).map(normalizeTime);
          const nightSlots = (session.selectedNightSlots || []).map(normalizeTime);
          if (daySlots.includes(normalizedSlot) || nightSlots.includes(normalizedSlot)) {
            return true;
          }
        } else if (session.startTime && session.endTime) {
          // New session format
          const startMinutes = timeToMinutes(session.startTime);
          const endMinutes = timeToMinutes(session.endTime);

          if (startMinutes <= endMinutes) {
            if (slotMinutes >= startMinutes && slotMinutes < endMinutes) return true;
          } else {
            if (slotMinutes >= startMinutes || slotMinutes < endMinutes) return true;
          }
        }
      }
      return false;
    });
  }

  return generatedSlots;
};
