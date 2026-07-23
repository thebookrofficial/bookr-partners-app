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
    const userIds: string[] = [];
    let title = record?.title;
    let body = record?.body;

    console.error(`[START] Processing ${type} for table ${table}. venue_id: ${record?.venue_id}`);

    // --- HANDLE DIRECT BOOKINGS ---
    if (table && table.includes("bookings")) {
      // 1. Find the vendor (owner_id) for this booking via the venue_id
      const { data: venue, error: venueError } = await supabase
        .from("venues")
        .select("owner_id")
        .eq("id", record.venue_id)
        .maybeSingle();

      if (venueError) {
        console.error(`[VENUE ERROR]`, venueError);
      }

      if (venue?.owner_id) {
        // We have the client_profile ID (owner_id). Now we need the Supabase Auth user_id.
        const { data: profile } = await supabase
          .from("client_profiles")
          .select("user_id")
          .eq("id", venue.owner_id)
          .maybeSingle();

        if (profile?.user_id) {
          userIds.push(profile.user_id);
        }
      }

      // 2. Find active staff members' auth user_ids for this venue
      const { data: staffProfiles, error: staffError } = await supabase
        .from("client_profiles")
        .select("user_id")
        .contains("assigned_venue_ids", [record.venue_id])
        .eq("client_role", "staff");

      if (staffError) {
        console.error(`[STAFF ERROR]`, staffError);
      }

      if (staffProfiles) {
        staffProfiles.forEach(s => {
          if (s.user_id && !userIds.includes(s.user_id)) {
            userIds.push(s.user_id);
          }
        });
      }

      title = "New Booking!";
      body = "You have received a new booking.";
    } else {
      console.error(`[SKIP] Unsupported table: ${table}`);
      return new Response(JSON.stringify({ message: "Unsupported table" }), { status: 200 });
    }

    console.error(`[INFO] Found userIds: ${JSON.stringify(userIds)}`);

    if (userIds.length === 0) {
      console.error(`[SKIP] No users/staff found for notification.`);
      return new Response(JSON.stringify({ message: "No users/staff found for notification" }), {
        status: 200,
      });
    }

    // --- FETCH ALL FCM TOKENS FOR OWNER AND STAFF ---
    const { data: devices, error: devError } = await supabase
      .from("user_devices")
      .select("fcm_token")
      .in("user_id", userIds)
      .not("fcm_token", "is", null);

    if (devError) {
      console.error(`[DEVICES ERROR]`, devError);
    }

    const tokensToSend = (devices || []).map(d => d.fcm_token).filter(Boolean) as string[];

    // Remove duplicates
    const uniqueTokens = [...new Set(tokensToSend)];

    console.error(`[INFO] Found ${uniqueTokens.length} unique tokens to send push to.`);

    if (uniqueTokens.length === 0) {
      console.error(`[ERROR] No valid tokens found for users: ${JSON.stringify(userIds)}`);
      return new Response(JSON.stringify({ error: "No valid tokens" }), { status: 200 });
    }

    // --- SEND FCM PUSH TO ALL TOKENS ---
    const serviceAccount = JSON.parse(serviceAccountString!);
    const jwtClient = new JWT({
      email: serviceAccount.client_email,
      key: serviceAccount.private_key,
      scopes: ["https://www.googleapis.com/auth/firebase.messaging"],
    });
    const tokens = await jwtClient.authorize();

    const sendPromises = uniqueTokens.map(async token => {
      const fcmPayload = {
        message: {
          token,
          notification: { title, body },
          android: {
            priority: "HIGH", // Must be capitalized in FCM v1 API to wake device from Doze mode
            notification: {
              channel_id: "booking_alerts_v2", // Plays the custom sound!
              sound: "notification_audio", // Don't use .wav extension in FCM payload
            },
          },
          apns: {
            headers: {
              "apns-priority": "10", // 10 is required for immediate delivery
              "apns-push-type": "alert",
            },
            payload: {
              aps: {
                "content-available": 1,
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

      const responseData = await res.json();
      if (!res.ok) {
        console.error(`[FCM ERROR for token ${token}]`, responseData);
      } else {
        console.error(`[FCM SUCCESS for token ${token}]`, responseData);
      }
      return { token, ok: res.ok, data: responseData };
    });

    const sendResults = await Promise.all(sendPromises);
    const successCount = sendResults.filter(r => r.ok).length;

    // console.log(`[DONE] Successfully sent ${successCount}/${uniqueTokens.length} notifications.`);

    return new Response(
      JSON.stringify({
        success: successCount > 0,
        total_tokens: uniqueTokens.length,
        success_count: successCount,
        results: sendResults,
      }),
      { status: 200 },
    );
  } catch (err: any) {
    console.error(`[FATAL ERROR]`, err);
    return new Response(JSON.stringify({ error: err.message }), { status: 200 });
  }
});
