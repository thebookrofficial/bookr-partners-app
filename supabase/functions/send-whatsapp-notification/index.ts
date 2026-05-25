import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const formatTo12Hour = (timeStr: string) => {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":");
  let hourInt = parseInt(h, 10);
  const ampm = hourInt >= 12 ? "PM" : "AM";
  hourInt = hourInt % 12 || 12;
  return m === "00" ? `${hourInt} ${ampm}` : `${hourInt}:${m} ${ampm}`;
};

serve(async req => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const record = payload.record;
    const old_record = payload.old_record;
    const type = payload.type;

    if (!record) {
      return new Response("No record found", { status: 200 });
    }

    let action = "";
    let templateName = "";

    if (type === "INSERT" && record.booking_status === "confirmed") {
      action = "CONFIRM";
      templateName = "manual_booking_confirmed_02";
    } else if (
      type === "UPDATE" &&
      record.booking_status === "cancelled" &&
      old_record?.booking_status !== "cancelled"
    ) {
      action = "CANCEL";
      templateName = "manual_booking_cancelled_03";
    } else {
      return new Response(JSON.stringify({ message: "No relevant status change, skipping." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseKey);

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
      console.error("[DB ERROR] Could not fetch relational data:", fetchError);
      throw new Error("Could not fetch relational booking details");
    }

    const rawPhone = bookingDetails.profiles?.phone || bookingDetails.guest_phone;
    const guestName = bookingDetails.profiles?.full_name || bookingDetails.guest_name || "Guest";

    if (!rawPhone) {
      return new Response(JSON.stringify({ message: "No phone number, skipping." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const venueName = bookingDetails.venues.name;
    const slotDate = bookingDetails.sports_slots.slot_date;
    const formattedTimeRange = `${formatTo12Hour(
      bookingDetails.sports_slots.start_time,
    )} - ${formatTo12Hour(bookingDetails.sports_slots.end_time)}`;

    let cleanPhone = rawPhone.replace(/\D/g, "");
    if (cleanPhone.length === 10) cleanPhone = `91${cleanPhone}`;

    let templateParams: string[] = [];

    if (action === "CONFIRM") {
      const totalAmount = Number(record.total_amount) || 0;
      const paidAmount = Number(record.paid_amount) || 0;
      const dueAmount = totalAmount - paidAmount;

      templateParams = [
        guestName,
        venueName,
        slotDate,
        formattedTimeRange,
        String(totalAmount),
        String(paidAmount),
        String(dueAmount),
      ];
    } else if (action === "CANCEL") {
      templateParams = [guestName, venueName, slotDate, formattedTimeRange];
    }

    const aisensyApiKey = Deno.env.get("AISENSY_API_KEY");
    if (!aisensyApiKey) throw new Error("AISENSY_API_KEY is not set in secrets");

    const aisensyPayload = {
      apiKey: aisensyApiKey,
      campaignName: templateName,
      destination: cleanPhone,
      userName: guestName,
      templateParams: templateParams,
    };

    const aisensyRes = await fetch("https://backend.aisensy.com/campaign/t1/api/v2", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(aisensyPayload),
    });

    const aisensyData = await aisensyRes.json();

    if (!aisensyRes.ok || aisensyData.success === false) {
      console.error("[AISENSY API ERROR]", aisensyData);
      throw new Error("Failed to send WhatsApp message via AiSensy");
    }

    return new Response(
      JSON.stringify({ success: true, message: `WhatsApp ${action} sent!`, data: aisensyData }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error: any) {
    console.error("[FATAL ERROR]", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
