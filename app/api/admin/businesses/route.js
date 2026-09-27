import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/adminAuth";

function cleanServices(list) {
  if (!Array.isArray(list)) return [];
  return list
    .map((s) => ({
      name: (s.name || "").trim(),
      price: (s.price || "").trim(),
      description: (s.description || "").trim(),
    }))
    .filter((s) => s.name);
}

function cleanFaqs(list) {
  if (!Array.isArray(list)) return [];
  return list
    .map((f) => ({ question: (f.question || "").trim(), answer: (f.answer || "").trim() }))
    .filter((f) => f.question && f.answer);
}

export async function POST(req) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const name = (body.name || "").trim();
  if (!name) {
    return NextResponse.json({ error: "Business name is required" }, { status: 400 });
  }

  const supabase = db();

  const { data: business, error } = await supabase
    .from("businesses")
    .insert({
      widget_key: nanoid(12),
      dashboard_token: nanoid(24),
      name,
      logo_url: (body.logoUrl || "").trim() || null,
      primary_color: (body.primaryColor || "#4f46e5").trim(),
      welcome_message: (body.welcomeMessage || "Hi! How can I help you today?").trim(),
      location: (body.location || "").trim() || null,
      hours: (body.hours || "").trim() || null,
      extra_info: (body.extraInfo || "").trim() || null,
    })
    .select("*")
    .single();

  if (error) {
    console.error("Create business error:", error);
    return NextResponse.json({ error: "Could not create business" }, { status: 500 });
  }

  const services = cleanServices(body.services).map((s) => ({ ...s, business_id: business.id }));
  const faqs = cleanFaqs(body.faqs).map((f) => ({ ...f, business_id: business.id }));

  if (services.length) await supabase.from("services").insert(services);
  if (faqs.length) await supabase.from("faqs").insert(faqs);

  return NextResponse.json({ ok: true, business });
}
