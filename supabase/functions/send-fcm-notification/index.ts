import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { JWT } from "https://esm.sh/google-auth-library@9";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"; // Added Supabase client

// Grab secrets from Supabase environments
const serviceAccountString = Deno.env.get("FIREBASE_SERVICE_ACCOUNT");
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

serve(async req => {
  try {
    const payload = await req.json();

    // 1. Get the inserted row from the Supabase webhook payload
    const record = payload.record;
    if (!record || !record.fcm_token) {
      return new Response(
        JSON.stringify({ error: "No FCM token provided or not an insert payload." }),
        { status: 400 },
      );
    }

    if (!serviceAccountString || !supabaseUrl || !supabaseKey) {
      throw new Error("Missing required environment secrets.");
    }

    // 2. Initialize Supabase Admin Client to fetch user data
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch the user's profile to get their name
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", record.user_id)
      .maybeSingle();

    // Setup fallback names if profile is missing or name is empty
    const fullName = profile?.full_name || "Partner";
    const firstName = fullName.split(" ")[0];

    // 3. Process Dynamic Placeholders (The Template Engine)
    // Replaces {{userName}} with full name, and {{firstName}} with just the first name
    const finalTitle = record.title
      .replace(/\{\{userName\}\}/g, fullName)
      .replace(/\{\{firstName\}\}/g, firstName);

    const finalBody = record.body
      .replace(/\{\{userName\}\}/g, fullName)
      .replace(/\{\{firstName\}\}/g, firstName);

    // 4. Initialize Google Auth JWT for the new HTTP v1 API
    const serviceAccount = JSON.parse(serviceAccountString);
    const jwtClient = new JWT({
      email: serviceAccount.client_email,
      key: serviceAccount.private_key,
      scopes: ["https://www.googleapis.com/auth/firebase.messaging"],
    });

    const tokens = await jwtClient.authorize();
    const accessToken = tokens.access_token;

    // 5. Construct the payload for Firebase Cloud Messaging
    const stringifiedData: Record<string, string> = {};
    if (record.data && typeof record.data === "object") {
      for (const [key, value] of Object.entries(record.data)) {
        stringifiedData[key] = String(value);
      }
    }

    const fcmPayload = {
      message: {
        token: record.fcm_token,
        notification: {
          title: finalTitle, // Use the processed title
          body: finalBody, // Use the processed body
        },
        data: stringifiedData,
      },
    };

    // 6. Send the Push Notification
    const fcmResponse = await fetch(
      `https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(fcmPayload),
      },
    );

    const fcmData = await fcmResponse.json();

    if (!fcmResponse.ok) {
      console.error("FCM Error:", fcmData);
      throw new Error("Failed to send FCM message");
    }

    // Optional: Mark as sent in the queue
    await supabase
      .from("notification_queue")
      .update({ status: "sent", sent_at: new Date().toISOString() })
      .eq("id", record.id);

    return new Response(
      JSON.stringify({ success: true, message: "Notification blasted out!", data: fcmData }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    console.error("Edge Function Error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
