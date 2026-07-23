// Follow this setup guide to integrate the Deno language server with your editor:
// https://supabase.com/docs/guides/functions/local-development#set-up-your-editor

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async req => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // GET handler removed - App Links are now handled directly by the OS or thebookr.in website

  try {
    // Only check auth for POST requests (email sending)
    if (req.method === "POST") {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        return new Response("Unauthorized", { status: 401 });
      }
    }

    const { email, inviteToken, businessName } = await req.json();

    if (!email || !inviteToken) {
      return new Response(JSON.stringify({ error: "Missing email or inviteToken" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    if (!RESEND_API_KEY) {
      console.warn("RESEND_API_KEY is not set. Simulating email send for local dev.");
      return new Response(JSON.stringify({ success: true, simulated: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Construct the correct Universal Link for the App
    const inviteLink = `https://thebookr.in/invite?token=${inviteToken}`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Bookr <noreply@thebookr.in>", // Using your verified domain
        to: email,
        subject: `You have been invited to join ${businessName || "Bookr Business"}`,
        html: `
          <h1>Welcome to Bookr!</h1>
          <p>You have been invited to join <strong>${
            businessName || "a business"
          }</strong> as a staff member.</p>
          <p>Click the link below to accept your invitation and create your account:</p>
          <a href="${inviteLink}" style="display:inline-block;padding:10px 20px;background-color:#007bff;color:white;text-decoration:none;border-radius:5px;">Accept Invitation</a>
        `,
      }),
    });

    const data = await res.json();

    if (res.ok) {
      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } else {
      console.error("Resend error:", data);
      return new Response(JSON.stringify({ error: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }
  } catch (err) {
    console.error("Function error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
