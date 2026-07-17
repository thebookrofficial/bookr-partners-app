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

    const { bookingId, vertical, amount, mode, loggedBy, note } = await req.json();
    const tableName = vertical === "staycation" ? "staycation_bookings" : "sports_bookings";

    // 1. Fetch current booking, pulling group IDs
    const { data: booking, error: fetchError } = await supabaseClient
      .from(tableName)
      .select("total_amount, paid_amount, booking_group_id, parent_booking_id")
      .eq("id", bookingId)
      .single();

    if (fetchError || !booking) throw new Error("Booking not found.");

    let totalAmount = Number(booking.total_amount);
    let paidAmount = Number(booking.paid_amount || 0);

    // 2. AGGREGATE TOTALS FOR MULTI-SLOT BOOKINGS
    if (booking.booking_group_id || booking.parent_booking_id) {
      const orConditions = [];
      if (booking.booking_group_id) {
        orConditions.push(`booking_group_id.eq.${booking.booking_group_id}`);
      }
      if (booking.parent_booking_id) {
        orConditions.push(`id.eq.${booking.parent_booking_id}`);
        orConditions.push(`parent_booking_id.eq.${booking.parent_booking_id}`);
      }
      // Always include the current booking and its children just in case
      orConditions.push(`id.eq.${bookingId}`);
      orConditions.push(`parent_booking_id.eq.${bookingId}`);

      const { data: groupData } = await supabaseClient
        .from(tableName)
        .select("total_amount, paid_amount")
        .or(orConditions.join(","));

      if (groupData && groupData.length > 0) {
        totalAmount = groupData.reduce((sum, b) => sum + Number(b.total_amount), 0);
        paidAmount = groupData.reduce((sum, b) => sum + Number(b.paid_amount || 0), 0);
      }
    }

    // 3. Validation against the GROUP'S remaining balance
    const remaining = totalAmount - paidAmount;
    if (amount > remaining) {
      throw new Error(`Amount exceeds remaining balance. Remaining: ₹${remaining}`);
    }

    // 4. Insert the immutable ledger log
    const { error: insertError } = await supabaseClient.from("offline_payment_logs").insert({
      booking_id: bookingId,
      booking_vertical: vertical,
      amount: amount,
      payment_mode: mode,
      note: note || `Manual ${mode} payment added via vendor app`,
      logged_by: loggedBy,
    });

    if (insertError) throw new Error(`Log insert failed: ${insertError.message}`);

    // 5. Update the main booking paid_amount
    const newPaidAmount = Number(booking.paid_amount || 0) + amount;
    const { error: updateError } = await supabaseClient
      .from(tableName)
      .update({ paid_amount: newPaidAmount })
      .eq("id", bookingId);

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
