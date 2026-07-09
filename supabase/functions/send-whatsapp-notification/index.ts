import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { corsHeaders } from "./utils.ts";
import { handleSportsBooking } from "./sportsHandler.ts";
import { handleStaycationBooking } from "./staycationHandler.ts";

serve(async req => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const record = payload.record;
    const old_record = payload.old_record;
    const type = payload.type;
    const table = payload.table;

    if (!record) {
      return new Response("No record found", { status: 200 });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    let result;

    if (table === "sports_bookings") {
      result = await handleSportsBooking(type, record, old_record, supabase);
    } else if (table === "staycation_bookings") {
      result = await handleStaycationBooking(type, record, old_record, supabase);
    } else {
      return new Response(JSON.stringify({ message: "No handler for this table, skipping." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("[FATAL ERROR]", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
