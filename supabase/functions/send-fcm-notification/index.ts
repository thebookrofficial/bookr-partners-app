import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { JWT } from "https://esm.sh/google-auth-library@9";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const serviceAccountString = Deno.env.get("FIREBASE_SERVICE_ACCOUNT");
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

serve(async req => {
  try {
    const payload = await req.json();
    const record = payload.record;
    const type = payload.type;

    // eslint-disable-next-line no-console
    console.log(
      `[EVENT] Type: ${type}, RecordID: ${record?.id}, UserID: ${record?.user_id}, Title: "${record?.title}"`,
    );

    // 1. STOPS THE INFINITE LOGS: Only process initial INSERTS
    if (type && type !== "INSERT") {
      return new Response(JSON.stringify({ message: "Skipping non-insert" }), { status: 200 });
    }

    if (!record || record.status !== "pending") {
      return new Response(JSON.stringify({ message: "Skipping non-pending" }), { status: 200 });
    }

    // 2. STOPS THE RACE CONDITION: Stagger executions
    const jitter = Math.floor(Math.random() * 1000);
    await new Promise(resolve => setTimeout(resolve, jitter));

    const supabase = createClient(supabaseUrl!, supabaseKey!);
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();

    // 3. BROAD DEDUPLICATION: User + Title only
    let winnerQuery = supabase
      .from("notification_queue")
      .select("id")
      .eq("title", record.title)
      .gte("created_at", oneMinuteAgo);

    if (record.user_id) winnerQuery = winnerQuery.eq("user_id", record.user_id);
    else winnerQuery = winnerQuery.is("user_id", null);

    const { data: winner } = await winnerQuery
      .order("id", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (winner && winner.id !== record.id) {
      // eslint-disable-next-line no-console
      console.log(`[DEDUPE] Skipping duplicate: ${record.id}`);
      await supabase.from("notification_queue").update({ status: "skipped" }).eq("id", record.id);
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    // 4. TOKEN REPAIR: Fetch the CURRENT token, don't trust the one in the record
    let finalToken = record.fcm_token;
    if (record.user_id) {
      const { data: dev } = await supabase
        .from("user_devices")
        .select("fcm_token")
        .eq("user_id", record.user_id)
        .order("last_seen_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (dev?.fcm_token) {
        finalToken = dev.fcm_token;
      }
    }

    if (!finalToken) {
      console.error(`[ERROR] No valid token found for user ${record.user_id}`);
      await supabase.from("notification_queue").update({ status: "failed" }).eq("id", record.id);
      return new Response(JSON.stringify({ error: "No valid token" }), { status: 200 });
    }

    // 5. HIGH PRIORITY PAYLOAD
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
        notification: { title: record.title, body: record.body },
        android: {
          priority: "high",
          notification: {
            sound: "default",
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
    const status = res.ok ? "sent" : "failed";

    if (!res.ok) console.error(`[FCM ERROR]`, fcmData);

    await supabase
      .from("notification_queue")
      .update({ status, sent_at: new Date().toISOString() })
      .eq("id", record.id);
    // eslint-disable-next-line no-console
    console.log(`[${status.toUpperCase()}] Record ${record.id}`);

    return new Response(JSON.stringify({ success: res.ok, data: fcmData }), { status: 200 });
  } catch (err: any) {
    console.error(`[FATAL ERROR]`, err);
    return new Response(JSON.stringify({ error: err.message }), { status: 200 });
  }
});
