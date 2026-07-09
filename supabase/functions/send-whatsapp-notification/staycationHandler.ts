import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { sendAiSensyMessage } from "./utils.ts";

export const handleStaycationBooking = async (
  type: string,
  record: any,
  old_record: any,
  supabase: SupabaseClient,
) => {
  let action = "";
  let templateName = "";

  if (type === "INSERT" && record.booking_status === "confirmed") {
    action = "CONFIRM";
    // TODO: Update to actual staycation confirm template name once provided by user
    templateName = "staycation_offline_booking_confirm_placeholder";
  } else if (
    type === "UPDATE" &&
    record.booking_status === "cancelled" &&
    old_record?.booking_status !== "cancelled"
  ) {
    action = "CANCEL";
    // TODO: Update to actual staycation cancel template name
    templateName = "staycation_offline_booking_cancel_placeholder";
  } else {
    return {
      success: true,
      message: "No relevant status change for staycation, skipping.",
    };
  }

  const { data: bookingDetails, error: fetchError } = await supabase
    .from("staycation_bookings")
    .select(
      `
      guest_name,
      guest_phone,
      check_in_date,
      check_out_date,
      venues ( name ),
      profiles ( full_name, phone )
    `,
    )
    .eq("id", record.id)
    .single();

  if (fetchError || !bookingDetails) {
    console.error("[DB ERROR] Could not fetch relational data for staycation:", fetchError);
    throw new Error("Could not fetch relational booking details for staycation");
  }

  const rawPhone = bookingDetails.profiles?.phone || bookingDetails.guest_phone;
  const guestName = bookingDetails.profiles?.full_name || bookingDetails.guest_name || "Guest";

  if (!rawPhone) {
    return { success: true, message: "No phone number, skipping." };
  }

  const venueName = bookingDetails.venues.name;
  const checkInDate = bookingDetails.check_in_date;
  const checkOutDate = bookingDetails.check_out_date;

  let cleanPhone = rawPhone.replace(/\D/g, "");
  if (cleanPhone.length === 10) cleanPhone = `91${cleanPhone}`;

  let templateParams: string[] = [];

  if (action === "CONFIRM") {
    // TODO: Adjust template parameters based on the actual AiSensy template for staycation
    templateParams = [guestName, venueName, checkInDate, checkOutDate];
  } else if (action === "CANCEL") {
    // TODO: Adjust template parameters
    templateParams = [guestName, venueName, checkInDate, checkOutDate];
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
    message: `WhatsApp ${action} sent for staycation!`,
    data: aisensyData,
  };
};
