-- AI Receptionist - database schema
-- Run this once in your Supabase project: Dashboard -> SQL Editor -> New query -> paste -> Run

create extension if not exists pgcrypto;

-- One row per client business (salon, clinic, shop, ...)
create table if not exists businesses (
  id uuid primary key default gen_random_uuid(),
  widget_key text unique not null,       -- public id used in the embed <script> tag
  dashboard_token text unique not null,  -- secret id used in the owner's dashboard link
  name text not null,
  logo_url text,
  primary_color text not null default '#4f46e5',
  welcome_message text not null default 'Hi! How can I help you today?',
  location text,
  hours text,                           -- free text, e.g. "Mon-Fri 9am-6pm, Sat 10am-4pm"
  extra_info text,                      -- anything else the AI should know
  created_at timestamptz not null default now()
);

create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name text not null,
  price text,          -- text so owners can write "$45" or "From $30" or "Free"
  description text,
  created_at timestamptz not null default now()
);

create table if not exists faqs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  question text not null,
  answer text not null,
  created_at timestamptz not null default now()
);

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  session_id text,
  name text,
  contact text,            -- phone or email
  service_wanted text,
  preferred_time text,
  notes text,
  status text not null default 'new',   -- new | contacted | done
  created_at timestamptz not null default now()
);

create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  session_id text not null,
  role text not null,       -- 'user' | 'assistant'
  content text not null,
  created_at timestamptz not null default now()
);

-- Used for free-tier AI quota protection. One row per (business + day + visitor).
create table if not exists rate_limits (
  key text primary key,     -- e.g. "biz_abc123:2026-09-27:1.2.3.4"
  count int not null default 0,
  reset_at timestamptz not null
);

-- Atomically bumps (or creates) a rate-limit counter and returns the new count.
create or replace function increment_rate_limit(p_key text, p_reset_at timestamptz)
returns int
language plpgsql
as $$
declare
  new_count int;
begin
  insert into rate_limits (key, count, reset_at)
  values (p_key, 1, p_reset_at)
  on conflict (key) do update
    set count = rate_limits.count + 1
  returning count into new_count;
  return new_count;
end;
$$;

create index if not exists idx_services_business on services(business_id);
create index if not exists idx_faqs_business on faqs(business_id);
create index if not exists idx_leads_business on leads(business_id);
create index if not exists idx_chat_business_session on chat_messages(business_id, session_id);

-- Note: this app only ever talks to Supabase using the "service_role" key from
-- server-side Next.js API routes (never from the browser), so Row Level
-- Security is left off. Do NOT expose the service_role key to the browser.

-- Some Supabase projects don't auto-grant table privileges to service_role.
-- These grants make sure it can always read/write everything above
-- (service_role is meant to be a full-access, server-only key).
grant usage on schema public to service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;
alter default privileges in schema public grant execute on functions to service_role;
