import { createClient } from "@supabase/supabase-js";

// Server-only Supabase client using the secret service_role key.
// This file must never be imported from client components.
let client;

export function db() {
  if (client) return client;

  const url = process.env.SUPABASE_URL;
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
