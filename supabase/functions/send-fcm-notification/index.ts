import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { JWT } from "https://esm.sh/google-auth-library@9";

// Grab the secret Firebase Service Account JSON from Supabase environments
const serviceAccountString = Deno.env.get("FIREBASE_SERVICE_ACCOUNT");

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

    if (!serviceAccountString) {
      throw new Error("Missing FIREBASE_SERVICE_ACCOUNT secret.");
    }

    const serviceAccount = JSON.parse(serviceAccountString);

    // 2. Initialize Google Auth JWT for the new HTTP v1 API
    const jwtClient = new JWT({
      email: serviceAccount.client_email,
      key: serviceAccount.private_key,
      scopes: ["https://www.googleapis.com/auth/firebase.messaging"],
    });

    // 3. Generate a secure access token
    const tokens = await jwtClient.authorize();
    const accessToken = tokens.access_token;

    // 4. Construct the payload for Firebase Cloud Messaging
    const fcmPayload = {
      message: {
        token: record.fcm_token,
        notification: {
          title: record.title,
          body: record.body,
        },
        data: record.data || {},
      },
    };

    // 5. Send the Push Notification
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

    // Optional: You could write an update query here to change the queue_status from 'pending' to 'sent'

    return new Response(
      JSON.stringify({ success: true, message: "Notification blasted out!", data: fcmData }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    console.error("Edge Function Error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
