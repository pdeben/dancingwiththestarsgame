-- Run this in Supabase → SQL Editor

-- Admin table (one row, id=1)
create table if not exists admin (
  id integer primary key default 1,
  current_week integer default 1,
  eliminated jsonb default '{}',
  picks_locked boolean default false,
  actual_final4 integer[] default '{}',
  actual_winner integer default null,
  updated_at timestamptz default now()
);
insert into admin (id) values (1) on conflict do nothing;

-- Groups table
create table if not exists groups (
  code text primary key,
  name text not null,
  created_by text not null,
  member_ids text[] default '{}',
  members jsonb default '{}',
  created_at timestamptz default now()
);

-- Picks table (one row per user, global picks apply to all groups)
create table if not exists picks (
  user_id text primary key,
  final4 integer[] default '{}',
  winner integer default null,
  weekly jsonb default '{}',
  updated_at timestamptz default now()
);

-- Sync log
create table if not exists sync_log (
  id bigserial primary key,
  ran_at timestamptz default now(),
  found text,
  source text,
  confidence text
);

-- Disable RLS (service role handles all writes via API routes)
alter table admin disable row level security;
alter table groups disable row level security;
alter table picks disable row level security;
alter table sync_log disable row level security;
