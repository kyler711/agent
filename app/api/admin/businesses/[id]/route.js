import { NextResponse } from "next/server";
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

export async function GET(_req, { params }) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = db();

  const [{ data: business }, { data: services }, { data: faqs }] = await Promise.all([
    supabase.from("businesses").select("*").eq("id", id).single(),
    supabase.from("services").select("*").eq("business_id", id).order("created_at"),
    supabase.from("faqs").select("*").eq("business_id", id).order("created_at"),
  ]);

  if (!business) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ business, services: services || [], faqs: faqs || [] });
}

export async function PUT(req, { params }) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  const { id } = await params;
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

  const { error } = await supabase
    .from("businesses")
    .update({
      name,
      logo_url: (body.logoUrl || "").trim() || null,
      primary_color: (body.primaryColor || "#4f46e5").trim(),
      welcome_message: (body.welcomeMessage || "Hi! How can I help you today?").trim(),
      location: (body.location || "").trim() || null,
      hours: (body.hours || "").trim() || null,
      extra_info: (body.extraInfo || "").trim() || null,
    })
    .eq("id", id);

  if (error) {
    console.error("Update business error:", error);
    return NextResponse.json({ error: "Could not update business" }, { status: 500 });
  }

  const services = cleanServices(body.services).map((s) => ({ ...s, business_id: id }));
  const faqs = cleanFaqs(body.faqs).map((f) => ({ ...f, business_id: id }));

  await supabase.from("services").delete().eq("business_id", id);
  await supabase.from("faqs").delete().eq("business_id", id);
  if (services.length) await supabase.from("services").insert(services);
  if (faqs.length) await supabase.from("faqs").insert(faqs);

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req, { params }) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = db();
  const { error } = await supabase.from("businesses").delete().eq("id", id);

  if (error) {
    console.error("Delete business error:", error);
    return NextResponse.json({ error: "Could not delete business" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
