import { createClient } from "@supabase/supabase-js";

// Server-only Supabase client using the secret service_role key.
// This file must never be imported from client components.
let client;

// A very common copy/paste mistake is pasting the URL with a trailing
// slash or with "/rest/v1" already on it (from the Supabase dashboard's
// example API calls). supabase-js appends its own "/rest/v1/..." path, so
// either of those turns into a broken double path and Supabase replies
// with PGRST125 "Invalid path specified in request URL". Strip those here
// so a slightly-off paste still works.
function normalizeSupabaseUrl(raw) {
  return (raw || "")
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/\/rest\/v1\/?$/, "")
    .replace(/\/+$/, "");
}

export function db() {
  if (client) return client;

  const url = normalizeSupabaseUrl(process.env.SUPABASE_URL);
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Copy .env.example to .env.local and fill them in."
    );
  }

  client = createClient(url, key, {
    auth: { persistSession: false },
  });
  return client;
}
