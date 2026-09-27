import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const MAX_FIELD_LENGTH = 300;

function clean(value) {
  return (value || "").toString().trim().slice(0, MAX_FIELD_LENGTH);
}

// Combines a "YYYY-MM-DD" date and "HH:MM" time (as typed into the widget's
// native date/time pickers) into a real Date, or null if either is missing
// or invalid.
function parsePreferredAt(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null;
  const d = new Date(`${dateStr}T${timeStr}:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatPreferredTime(date) {
  return date.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
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
  const preferredDate = clean(body.preferredDate);
  const preferredTimeOfDay = clean(body.preferredTimeOfDay);
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
    .select("id, max_bookings_per_hour")
    .eq("widget_key", widgetKey)
    .single();

  if (bizError || !business) {
    return NextResponse.json({ error: "Unknown business" }, { status: 404 });
  }

  const preferredAt = parsePreferredAt(preferredDate, preferredTimeOfDay);

  if (preferredAt) {
    const hourStart = new Date(preferredAt);
    hourStart.setMinutes(0, 0, 0);
    const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);

    const { count, error: countError } = await supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id)
      .gte("preferred_at", hourStart.toISOString())
      .lt("preferred_at", hourEnd.toISOString());

    if (countError) {
      console.error("Booking capacity check error:", countError);
    } else if ((count || 0) >= business.max_bookings_per_hour) {
      return NextResponse.json(
        {
          error: "fully_booked",
          message: "That time is already fully booked. Please choose a different time.",
        },
        { status: 409 }
      );
    }
  }

  const { error: insertError } = await supabase.from("leads").insert({
    business_id: business.id,
    session_id: sessionId || null,
    name,
    contact,
    service_wanted: serviceWanted || null,
    preferred_time: preferredAt ? formatPreferredTime(preferredAt) : null,
    preferred_at: preferredAt ? preferredAt.toISOString() : null,
    notes: notes || null,
  });

  if (insertError) {
    console.error("Lead insert error:", insertError);
    return NextResponse.json({ error: "Could not save your request" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
