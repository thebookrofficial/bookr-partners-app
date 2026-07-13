import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { JWT } from "https://esm.sh/google-auth-library@9";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const serviceAccountString = Deno.env.get("FIREBASE_SERVICE_ACCOUNT");
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

serve(async req => {
  try {
    const payload = await req.json();
    let record = payload.record;
    const type = payload.type;
    const table = payload.table;

    if (type !== "INSERT") {
      return new Response(JSON.stringify({ message: "Skipping non-insert" }), { status: 200 });
    }

    const supabase = createClient(supabaseUrl!, supabaseKey!);
    let finalToken = null;
    let userId = record?.user_id;
    let title = record?.title;
    let body = record?.body;

    // --- HANDLE DIRECT BOOKINGS ---
    if (table && table.includes("bookings")) {
      // Find the vendor (user_id) for this booking via the venue_id
      const { data: venue, error: venueError } = await supabase
        .from("venues")
        .select("owner_id")
        .eq("id", record.venue_id)
        .maybeSingle();

      if (venueError) {
        console.error(`[VENUE ERROR]`, venueError);
      }

      if (!venue || !venue.owner_id) {
        return new Response(JSON.stringify({ message: "No vendor found for this venue" }), {
          status: 200,
        });
      }

      // We have the client_profile ID (owner_id). Now we need the Supabase Auth user_id.
      const { data: profile } = await supabase
        .from("client_profiles")
        .select("user_id")
        .eq("id", venue.owner_id)
        .maybeSingle();

      userId = profile?.user_id;

      if (!userId) {
        return new Response(JSON.stringify({ message: "No auth user_id found for vendor" }), {
          status: 200,
        });
      }

      title = "New Booking!";
      body = "You have received a new booking.";
    } else {
      return new Response(JSON.stringify({ message: "Unsupported table" }), { status: 200 });
    }

    // --- FETCH FCM TOKEN ---
    if (userId) {
      const { data: dev } = await supabase
        .from("user_devices")
        .select("fcm_token")
        .eq("user_id", userId)
        .order("last_seen_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (dev?.fcm_token) {
        finalToken = dev.fcm_token;
      }
    }

    if (!finalToken) {
      console.error(`[ERROR] No valid token found for user ${userId}`);
      return new Response(JSON.stringify({ error: "No valid token" }), { status: 200 });
    }

    // --- SEND FCM PUSH ---
    const serviceAccount = JSON.parse(serviceAccountString!);
    const jwtClient = new JWT({
      email: serviceAccount.client_email,
      key: serviceAccount.private_key,
      scopes: ["https://www.googleapis.com/auth/firebase.messaging"],
    });
    const tokens = await jwtClient.authorize();

    const fcmPayload = {
      message: {
        token: finalToken,
        notification: { title, body },
        android: {
          priority: "high",
          notification: {
            channelId: "booking_alerts_v2", // Plays the custom sound!
            sound: "notification_audio", // Don't use .wav extension in FCM payload
          },
        },
        apns: {
          payload: {
            aps: {
              contentAvailable: true,
              sound: "default",
            },
          },
        },
      },
    };

    const res = await fetch(
      `https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokens.access_token}`,
        },
        body: JSON.stringify(fcmPayload),
      },
    );

    const fcmData = await res.json();
    if (!res.ok) console.error(`[FCM ERROR]`, fcmData);

    return new Response(JSON.stringify({ success: res.ok, data: fcmData }), { status: 200 });
  } catch (err: any) {
    console.error(`[FATAL ERROR]`, err);
    return new Response(JSON.stringify({ error: err.message }), { status: 200 });
  }
});
