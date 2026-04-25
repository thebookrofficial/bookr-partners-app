import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

serve(async req => {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return new Response("Invalid Token", { status: 400 });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  // Fetch invite details
  const { data: invite, error } = await supabaseClient
    .from("event_guest_invites")
    .select(
      "guest_name, pass_type, quantity, event_id, events(title, cover_image_url, venues(name, address))",
    )
    .eq("qr_code_token", token)
    .single();

  if (error || !invite) {
    return new Response("Pass Not Found or Expired", { status: 404 });
  }

  const event = invite.events as any;
  const venue = event?.venues as any;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Event Pass - Bookr</title>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
      <style>
        body {
          font-family: 'Inter', sans-serif;
          background-color: #F3F4F6;
          margin: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
        }
        .card {
          background: white;
          width: 90%;
          max-width: 400px;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
          text-align: center;
        }
        .header {
          background: #000;
          color: white;
          padding: 24px;
        }
        .header h1 {
          margin: 0;
          font-size: 20px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .content {
          padding: 32px 24px;
        }
        .event-title {
          font-size: 22px;
          font-weight: 700;
          margin-bottom: 8px;
          color: #111;
        }
        .guest-name {
          font-size: 16px;
          color: #4B5563;
          margin-bottom: 24px;
        }
        #qrcode {
          display: inline-block;
          padding: 16px;
          background: white;
          border: 1px solid #E5E7EB;
          border-radius: 16px;
          margin-bottom: 24px;
        }
        .pass-details {
          display: flex;
          justify-content: space-around;
          background: #F9FAFB;
          padding: 16px;
          border-radius: 12px;
          margin-bottom: 24px;
        }
        .detail-item {
          flex: 1;
        }
        .detail-label {
          font-size: 12px;
          color: #9CA3AF;
          text-transform: uppercase;
          margin-bottom: 4px;
        }
        .detail-value {
          font-size: 14px;
          font-weight: 600;
          color: #111;
        }
        .footer {
          padding: 24px;
          border-top: 1px dashed #E5E7EB;
          color: #6B7280;
          font-size: 13px;
        }
        .save-hint {
          margin-top: 16px;
          font-size: 12px;
          color: #3B82F6;
          font-weight: 600;
        }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1>Event Entry Pass</h1>
        </div>
        <div class="content">
          <div class="event-title">${event?.title || "Exclusive Event"}</div>
          <div class="guest-name">Invited: ${invite.guest_name}</div>
          
          <div id="qrcode"></div>
          
          <div class="pass-details">
            <div class="detail-item">
              <div class="detail-label">Pass Type</div>
              <div class="detail-value">${invite.pass_type}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Quantity</div>
              <div class="detail-value">${invite.quantity} Person(s)</div>
            </div>
          </div>

          <div class="detail-label">Venue</div>
          <div class="detail-value" style="margin-top:4px">${
            venue?.name || "Venue Details Provided at Entry"
          }</div>
          
          <div class="save-hint">Screenshot this pass for offline use</div>
        </div>
        <div class="footer">
          Powered by <b>Bookr</b>
        </div>
      </div>

      <script>
        new QRCode(document.getElementById("qrcode"), {
          text: "${token}",
          width: 200,
          height: 200,
          colorDark : "#000000",
          colorLight : "#ffffff",
          correctLevel : QRCode.CorrectLevel.H
        });
      </script>
    </body>
    </html>
  `;

  return new Response(html, {
    headers: { "Content-Type": "text/html" },
    status: 200,
  });
});
