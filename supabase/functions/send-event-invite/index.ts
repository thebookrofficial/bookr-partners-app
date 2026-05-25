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

    const { guestName, email, mobileNo, passType, quantity, venueId, eventId, eventTitle } =
      await req.json();

    if (!guestName || !mobileNo || !venueId || !eventId) {
      throw new Error("Missing required guest information.");
    }

    // 1. Generate a secure, hard-to-guess token (e.g., 12-char random string)
    // This is the "encoded" part that prevents users from guessing other links.
    const qrCodeToken =
      Math.random().toString(36).substring(2, 8) + Math.random().toString(36).substring(2, 8);

    // 2. Store invite in database
    const { data: invite, error: dbError } = await supabaseClient
      .from("event_guest_invites")
      .insert([
        {
          venue_id: venueId,
          event_id: eventId,
          guest_name: guestName,
          guest_email: email || null,
          guest_phone: mobileNo,
          pass_type: passType,
          quantity: parseInt(quantity, 10),
          qr_code_token: qrCodeToken,
          status: "sent",
        },
      ])
      .select()
      .single();

    if (dbError) throw dbError;

    // 3. Construct the masked link (Uses your Cloudflare Proxy)
    const passUrl = `https://api.thebookr.in/t/${qrCodeToken}`;

    // 4. Trigger WhatsApp via AiSensy (V2 API)
    const AISENSY_API_KEY = Deno.env.get("AISENSY_API_KEY");
    if (AISENSY_API_KEY) {
      // Ensure phone has + prefix for International format if not already there
      const cleanPhone = mobileNo.startsWith("+") ? mobileNo : `+${mobileNo.replace(/\D/g, "")}`;

      const waPayload = {
        apiKey: AISENSY_API_KEY,
        campaignName: "event_guest_invite",
        destination: cleanPhone,
        userName: guestName,
        templateParams: [
          guestName, // {{1}}
          eventTitle, // {{2}}
          passType, // {{3}}
          quantity, // {{4}}
          passUrl, // {{5}} - This is your unique, secure link
        ],
        source: "Bookr_App",
      };

      const waResponse = await fetch("https://backend.aisensy.com/campaign/t1/api/v2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(waPayload),
      });

      const responseData = await waResponse.json();
      if (!waResponse.ok) {
        console.error("AiSensy Error Payload:", JSON.stringify(responseData));
        throw new Error(`AiSensy API Failed: ${responseData.message || waResponse.statusText}`);
      }
    } else {
      console.warn("AISENSY_API_KEY not set. Skipping WhatsApp send.");
    }

    return new Response(JSON.stringify({ success: true, inviteId: invite.id, passUrl }), {
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
