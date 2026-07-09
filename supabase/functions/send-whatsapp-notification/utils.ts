export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export const formatTo12Hour = (timeStr: string) => {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":");
  let hourInt = parseInt(h, 10);
  const ampm = hourInt >= 12 ? "PM" : "AM";
  hourInt = hourInt % 12 || 12;
  return m === "00" ? `${hourInt} ${ampm}` : `${hourInt}:${m} ${ampm}`;
};

export const sendAiSensyMessage = async (payload: {
  apiKey: string;
  campaignName: string;
  destination: string;
  userName: string;
  templateParams: string[];
}) => {
  const aisensyRes = await fetch("https://backend.aisensy.com/campaign/t1/api/v2", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const aisensyData = await aisensyRes.json();

  if (!aisensyRes.ok || aisensyData.success === false) {
    console.error("[AISENSY API ERROR]", aisensyData);
    throw new Error("Failed to send WhatsApp message via AiSensy");
  }

  return aisensyData;
};
