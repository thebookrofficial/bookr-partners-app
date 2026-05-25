import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

// 1. Mandatory CORS headers for mobile/web apps
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async req => {
  // 2. Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 3. Initialize Supabase client using the user's Auth token (maintains RLS)
    // New Code (Admin privileges)
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Extract payload from your React Native hook
    const { bookingId, vertical, amount, mode, loggedBy } = await req.json();

    // 4. Validation: Fetch current booking to check remaining amount
    const { data: booking, error: fetchError } = await supabaseClient
      .from("sports_bookings")
      .select("total_amount, paid_amount")
      .eq("id", bookingId)
      .single();

    if (fetchError || !booking) throw new Error("Booking not found.");

    const remaining = booking.total_amount - (booking.paid_amount || 0);
    if (amount > remaining) {
      throw new Error("Amount exceeds remaining balance.");
    }

    // 5. Insert the immutable ledger log (Claude's Option B)
    const { error: insertError } = await supabaseClient.from("offline_payment_logs").insert({
      booking_id: bookingId,
      booking_vertical: vertical,
      amount: amount,
      payment_mode: mode,
      note: `Manual ${mode} payment added via vendor app`,
      logged_by: loggedBy,
    });

    if (insertError) throw new Error(`Log insert failed: ${insertError.message}`);

    // 6. Update the main booking paid_amount
    const newPaidAmount = (booking.paid_amount || 0) + amount;
    const { error: updateError } = await supabaseClient
      .from("sports_bookings")
      .update({ paid_amount: newPaidAmount })
      .eq("id", bookingId);

    if (updateError) throw new Error(`Booking update failed: ${updateError.message}`);

    // 7. Return 200 Success
    return new Response(JSON.stringify({ success: true, newPaidAmount }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    // Return 400 Error (This triggers the catch block in your React Native hook)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
