import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { chatComplete } from "@/lib/ai/provider";
import { buildSystemPrompt, BOOKING_TOKEN } from "@/lib/ai/systemPrompt";
import { checkRateLimit } from "@/lib/rateLimit";

const MAX_MESSAGE_LENGTH = 1500;
const HISTORY_LIMIT = 12;

function getClientIp(req) {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const widgetKey = (body.widgetKey || "").trim();
  const sessionId = (body.sessionId || "").trim();
  let message = (body.message || "").trim();

  if (!widgetKey || !sessionId || !message) {
    return NextResponse.json(
      { error: "widgetKey, sessionId and message are required" },
      { status: 400 }
    );
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    message = message.slice(0, MAX_MESSAGE_LENGTH);
  }

  const supabase = db();

  const { data: business, error: bizError } = await supabase
    .from("businesses")
    .select("*")
    .eq("widget_key", widgetKey)
    .single();

  if (bizError || !business) {
    return NextResponse.json({ error: "Unknown business" }, { status: 404 });
  }

  const rateLimit = await checkRateLimit({ businessKey: widgetKey, ip: getClientIp(req) });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: "rate_limited",
        reply:
          "This chat has reached its message limit for today. Please try again tomorrow, or contact us directly.",
      },
      { status: 429 }
    );
  }

  const [{ data: services }, { data: faqs }, { data: historyRows }] = await Promise.all([
    supabase.from("services").select("*").eq("business_id", business.id),
    supabase.from("faqs").select("*").eq("business_id", business.id),
    supabase
      .from("chat_messages")
      .select("role, content")
      .eq("business_id", business.id)
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true })
      .limit(HISTORY_LIMIT),
  ]);

  const system = buildSystemPrompt(business, services || [], faqs || []);
  const history = (historyRows || []).map((m) => ({ role: m.role, content: m.content }));

  let reply;
  try {
    reply = await chatComplete({
      system,
      messages: [...history, { role: "user", content: message }],
    });
  } catch (err) {
    console.error("AI provider error:", err);
    return NextResponse.json(
      {
        error: "ai_unavailable",
        reply:
          "Sorry, I'm having trouble replying right now. Please try again in a moment, or leave your details and our staff will get back to you.",
      },
      { status: 502 }
    );
  }

  const showBookingForm = reply.includes(BOOKING_TOKEN);
  const cleanReply = reply.replaceAll(BOOKING_TOKEN, "").trim();

  await supabase.from("chat_messages").insert([
    { business_id: business.id, session_id: sessionId, role: "user", content: message },
    { business_id: business.id, session_id: sessionId, role: "assistant", content: cleanReply },
  ]);

  return NextResponse.json({ reply: cleanReply, showBookingForm });
}
