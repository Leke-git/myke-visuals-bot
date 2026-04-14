-- Run this in your Supabase SQL editor

-- Sessions
create table if not exists sessions (
  user_id text primary key,
  data jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

-- Bookings
create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  booking_id text unique not null,
  user_id text not null,
  username text,
  service text,
  date date,
  time time,
  name text,
  notes text,
  status text default 'PENDING',
  created_at timestamptz not null default now()
);

-- Analytics
create table if not exists analytics (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  event text not null,
  data text,
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists bookings_user_idx on bookings(user_id);
create index if not exists bookings_status_idx on bookings(status);
create index if not exists analytics_event_idx on analytics(event);
create index if not exists analytics_created_idx on analytics(created_at);
