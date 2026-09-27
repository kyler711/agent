import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const MAX_FIELD_LENGTH = 300;

function clean(value) {
  return (value || "").toString().trim().slice(0, MAX_FIELD_LENGTH);
}

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const widgetKey = clean(body.widgetKey);
  const sessionId = clean(body.sessionId);
  const name = clean(body.name);
  const contact = clean(body.contact);
  const serviceWanted = clean(body.serviceWanted);
  const preferredTime = clean(body.preferredTime);
  const notes = clean(body.notes);

  if (!widgetKey || !name || !contact) {
    return NextResponse.json(
      { error: "widgetKey, name and contact are required" },
      { status: 400 }
    );
  }

  const supabase = db();

  const { data: business, error: bizError } = await supabase
    .from("businesses")
    .select("id")
    .eq("widget_key", widgetKey)
    .single();

  if (bizError || !business) {
    return NextResponse.json({ error: "Unknown business" }, { status: 404 });
  }

  const { error: insertError } = await supabase.from("leads").insert({
    business_id: business.id,
    session_id: sessionId || null,
    name,
    contact,
    service_wanted: serviceWanted || null,
    preferred_time: preferredTime || null,
    notes: notes || null,
  });

  if (insertError) {
    console.error("Lead insert error:", insertError);
    return NextResponse.json({ error: "Could not save your request" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
