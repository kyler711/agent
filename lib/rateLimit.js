import { db } from "./db";

// How many chat messages a single visitor / a whole business can send per day.
// Tune these in .env.local if your free AI quota is bigger or smaller.
const PER_VISITOR_DAILY_LIMIT = Number(process.env.RATE_LIMIT_PER_VISITOR || 40);
const PER_BUSINESS_DAILY_LIMIT = Number(process.env.RATE_LIMIT_PER_BUSINESS || 300);

function endOfTodayUTC() {
  const day = new Date().toISOString().slice(0, 10);
  return new Date(`${day}T00:00:00Z`).getTime() + 24 * 60 * 60 * 1000;
}

async function bump(key) {
  const supabase = db();
  const resetAt = new Date(endOfTodayUTC()).toISOString();
  const { data, error } = await supabase.rpc("increment_rate_limit", {
    p_key: key,
    p_reset_at: resetAt,
  });
  if (error) throw error;
  return data; // new count
}

// Returns { allowed: true } or { allowed: false, reason: "visitor" | "business" }
export async function checkRateLimit({ businessKey, ip }) {
  const day = new Date().toISOString().slice(0, 10);
  const safeIp = ip || "unknown";

  const visitorCount = await bump(`${businessKey}:${day}:${safeIp}`);
  if (visitorCount > PER_VISITOR_DAILY_LIMIT) {
    return { allowed: false, reason: "visitor" };
  }

  const businessCount = await bump(`${businessKey}:${day}:_total`);
  if (businessCount > PER_BUSINESS_DAILY_LIMIT) {
    return { allowed: false, reason: "business" };
  }

  return { allowed: true };
}
