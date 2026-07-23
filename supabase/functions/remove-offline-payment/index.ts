import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async req => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { logId } = await req.json();

    if (!logId) {
      throw new Error("Missing logId");
    }

    // 1. Fetch the log
    const { data: log, error: fetchLogError } = await supabaseClient
      .from("offline_payment_logs")
      .select("*")
      .eq("id", logId)
      .single();

    if (fetchLogError || !log) throw new Error("Payment log not found.");

    const { amount, booking_id, booking_vertical } = log;
    const tableName = booking_vertical === "staycation" ? "staycation_bookings" : "sports_bookings";

    // 2. Delete the log
    const { error: deleteError } = await supabaseClient
      .from("offline_payment_logs")
      .delete()
      .eq("id", logId);

    if (deleteError) throw new Error(`Failed to delete payment log: ${deleteError.message}`);

    // 3. Fetch the booking to get current paid_amount
    const { data: booking, error: fetchBookingError } = await supabaseClient
      .from(tableName)
      .select("paid_amount")
      .eq("id", booking_id)
      .single();

    if (fetchBookingError || !booking) throw new Error("Booking not found.");

    // 4. Deduct the amount
    const newPaidAmount = Math.max(0, Number(booking.paid_amount || 0) - amount);

    const { error: updateError } = await supabaseClient
      .from(tableName)
      .update({ paid_amount: newPaidAmount })
      .eq("id", booking_id);

    if (updateError) throw new Error(`Booking update failed: ${updateError.message}`);

    return new Response(JSON.stringify({ success: true, newPaidAmount }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
