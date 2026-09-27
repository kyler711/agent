import { db } from "@/lib/db";

export const DEMO_WIDGET_KEY = "demo-salon";

// Creates a made-up business the first time /demo is visited, so there's
// always something to show potential customers with zero manual setup.
export async function ensureDemoBusiness() {
  const supabase = db();

  const { data: existing } = await supabase
    .from("businesses")
    .select("*")
    .eq("widget_key", DEMO_WIDGET_KEY)
    .single();

  if (existing) return existing;

  const { data: business, error } = await supabase
    .from("businesses")
    .insert({
      widget_key: DEMO_WIDGET_KEY,
      dashboard_token: "demo-dashboard-token",
      name: "Bella's Beauty Salon",
      primary_color: "#d946ef",
      welcome_message: "Hi! Welcome to Bella's Beauty Salon 💇 How can I help you today?",
      location: "12 Rose Street, Springfield",
      hours: "Tue-Sat 9am-6pm, closed Sun & Mon",
      extra_info:
        "We are a small, appointment-only salon. Walk-ins are only accepted if we have a free slot. We ask for 24 hours notice to cancel or reschedule.",
    })
    .select("*")
    .single();

  if (error) throw error;

  await supabase.from("services").insert([
    { business_id: business.id, name: "Women's haircut & style", price: "$65", description: "Includes wash and blow-dry" },
    { business_id: business.id, name: "Men's haircut", price: "$35", description: "" },
    { business_id: business.id, name: "Manicure", price: "$30", description: "Classic polish" },
    { business_id: business.id, name: "Gel manicure", price: "$45", description: "Lasts up to 3 weeks" },
    { business_id: business.id, name: "60-minute massage", price: "$90", description: "Full body relaxation massage" },
  ]);

  await supabase.from("faqs").insert([
    {
      business_id: business.id,
      question: "Do you accept walk-ins?",
      answer: "We're appointment-only most of the time, but walk-ins are welcome if we have a free slot that day.",
    },
    {
      business_id: business.id,
      question: "Is there parking?",
      answer: "Yes, there is free street parking right outside the salon on Rose Street.",
    },
    {
      business_id: business.id,
      question: "What is your cancellation policy?",
      answer: "Please give us at least 24 hours notice to cancel or reschedule an appointment.",
    },
  ]);

  return business;
}
