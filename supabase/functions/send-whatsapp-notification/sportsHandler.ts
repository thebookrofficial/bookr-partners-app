import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { formatTo12Hour, sendAiSensyMessage } from "./utils.ts";

export const handleSportsBooking = async (
  type: string,
  record: any,
  old_record: any,
  supabase: SupabaseClient,
) => {
  // If the booking has a user_id, it is an ONLINE booking.
  // We only want to send these templates for OFFLINE (manual) bookings.
  if (record.user_id !== null) {
    return {
      success: true,
      message: "Online booking detected. Skipping offline WhatsApp notification.",
    };
  }

  // If multi-slot, skip sending for non-parent bookings (to prevent duplicate WhatsApp messages)
  if (record.booking_group_id !== null && record.parent_booking_id !== null) {
    return {
      success: true,
      message:
        "Multi-slot booking detected. Skipping child slot to prevent duplicate WhatsApp notification.",
    };
  }

  let action = "";
  let templateName = "";

  if (type === "INSERT" && record.booking_status === "confirmed") {
    action = "CONFIRM";
    // Using the new template name
    templateName = "sports_offline_booking_confirm";
  } else if (
    type === "UPDATE" &&
    record.booking_status === "cancelled" &&
    old_record?.booking_status !== "cancelled"
  ) {
    action = "CANCEL";
    // Assuming cancellation template name remains the same, or needs to be updated.
    templateName = "manual_booking_cancelled_03";
  } else {
    return {
      success: true,
      message: "No relevant status change for sports, skipping.",
    };
  }

  const { data: bookingDetails, error: fetchError } = await supabase
    .from("sports_bookings")
    .select(
      `
      guest_name,
      guest_phone,
      venues ( name ),
      sports_slots ( slot_date, start_time, end_time ),
      profiles ( full_name, phone )
    `,
    )
    .eq("id", record.id)
    .single();

  if (fetchError || !bookingDetails) {
    console.error("[DB ERROR] Could not fetch relational data for sports:", fetchError);
    throw new Error("Could not fetch relational booking details for sports");
  }

  const rawPhone = bookingDetails.profiles?.phone || bookingDetails.guest_phone;
  const guestName = bookingDetails.profiles?.full_name || bookingDetails.guest_name || "Guest";

  if (!rawPhone) {
    return { success: true, message: "No phone number, skipping." };
  }

  const venueName = bookingDetails.venues.name;
  const slotDate = bookingDetails.sports_slots.slot_date;

  // Consolidate time range if this is a multi-slot booking group
  let formattedTimeRange = "";
  if (record.booking_group_id) {
    const { data: groupBookings } = await supabase
      .from("sports_bookings")
      .select(
        `
        sports_slots ( start_time, end_time )
      `,
      )
      .eq("booking_group_id", record.booking_group_id);

    if (groupBookings && groupBookings.length > 0) {
      const sortedSlots = groupBookings
        .map((b: any) => b.sports_slots)
        .filter(Boolean)
        .sort((a: any, b: any) => a.start_time.localeCompare(b.start_time));

      if (sortedSlots.length > 0) {
        const firstStart = sortedSlots[0].start_time;
        const lastEnd = sortedSlots[sortedSlots.length - 1].end_time;
        formattedTimeRange = `${formatTo12Hour(firstStart)} - ${formatTo12Hour(lastEnd)}`;
      }
    }
  }

  if (!formattedTimeRange) {
    formattedTimeRange = `${formatTo12Hour(
      bookingDetails.sports_slots.start_time,
    )} - ${formatTo12Hour(bookingDetails.sports_slots.end_time)}`;
  }

  let cleanPhone = rawPhone.replace(/\D/g, "");
  if (cleanPhone.length === 10) cleanPhone = `91${cleanPhone}`;

  let templateParams: string[] = [];

  if (action === "CONFIRM") {
    // New template sports_offline_booking_confirm takes 4 parameters:
    // 1: Name, 2: Venue, 3: Date, 4: Time Slot
    templateParams = [guestName, venueName, slotDate, formattedTimeRange];
  } else if (action === "CANCEL") {
    templateParams = [guestName, venueName, slotDate, formattedTimeRange];
  }

  const aisensyApiKey = Deno.env.get("AISENSY_API_KEY");
  if (!aisensyApiKey) throw new Error("AISENSY_API_KEY is not set in secrets");

  const aisensyData = await sendAiSensyMessage({
    apiKey: aisensyApiKey,
    campaignName: templateName,
    destination: cleanPhone,
    userName: guestName,
    templateParams: templateParams,
  });

  return {
    success: true,
    message: `WhatsApp ${action} sent for sports!`,
    data: aisensyData,
  };
};
