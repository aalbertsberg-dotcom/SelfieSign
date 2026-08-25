-- Ink & Flash production-oriented starting schema for Supabase/Postgres.
-- Authentication/RLS policies should be added before production use.

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  event_code text unique not null,
  owner_id uuid,
  display_name text not null,
  event_date date,
  book_title text,
  slot_count int not null default 48,
  photo_limit int not null default 3 check (photo_limit between 1 and 3),
  signature_mode text not null default 'both' check (signature_mode in ('guest','both','host')),
  filters_enabled boolean not null default true,
  messages_enabled boolean not null default true,
  live_wall_enabled boolean not null default true,
  wall_moderation boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.signature_slots (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  slot_number int not null,
  short_code text not null,
  signature_path text,
  review_status text not null default 'pending' check (review_status in ('pending','needs-review','approved')),
  hidden_from_book boolean not null default false,
  hidden_from_wall boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(event_id, slot_number),
  unique(event_id, short_code)
);

create table if not exists public.guest_entries (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  slot_id uuid not null unique references public.signature_slots(id) on delete cascade,
  guest_names text,
  message text,
  submitted_at timestamptz default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.guest_photos (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.guest_entries(id) on delete cascade,
  storage_path text not null,
  filter_name text not null default 'Natural',
  sort_order int not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index if not exists one_primary_photo_per_entry
  on public.guest_photos(entry_id)
  where is_primary = true;

-- Suggested private storage buckets:
--   guest-selfies
--   signature-scans
-- Use signed URLs, event-scoped RLS, owner authentication, upload size/type limits,
-- consent text, retention settings, rate limiting and audit logging before launch.
