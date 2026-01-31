-- Wendenzo Trip Planner - Initial schema + RLS
create extension if not exists "pgcrypto";

-- =========================
-- TABLES
-- =========================
create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  destination text,
  budget numeric,
  created_at timestamptz not null default now()
);

create table if not exists public.trip_days (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  day_index int not null,
  label text not null,
  created_at timestamptz not null default now(),
  unique(trip_id, day_index)
);

create table if not exists public.trip_items (
  id uuid primary key default gen_random_uuid(),
  day_id uuid not null references public.trip_days (id) on delete cascade,
  title text not null,
  time text,
  note text,
  map_url text,
  cost numeric,
  created_at timestamptz not null default now()
);

create table if not exists public.trip_members (
  trip_id uuid not null references public.trips (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'member',
  created_at timestamptz not null default now(),
  primary key (trip_id, user_id)
);

create table if not exists public.trip_messages (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

-- =========================
-- TRIGGER: owner auto-membership
-- =========================
create or replace function public.add_owner_membership()
returns trigger as $$
begin
  insert into public.trip_members(trip_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict do nothing;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_add_owner_membership on public.trips;
create trigger trg_add_owner_membership
after insert on public.trips
for each row execute function public.add_owner_membership();

-- =========================
-- RLS ENABLE
-- =========================
alter table public.trips enable row level security;
alter table public.trip_days enable row level security;
alter table public.trip_items enable row level security;
alter table public.trip_members enable row level security;
alter table public.trip_messages enable row level security;

-- =========================
-- POLICIES
-- =========================

-- TRIPS
drop policy if exists "trips_select_member" on public.trips;
create policy "trips_select_member" on public.trips
for select using (
  exists (
    select 1 from public.trip_members m
    where m.trip_id = id and m.user_id = auth.uid()
  )
);

drop policy if exists "trips_insert_owner" on public.trips;
create policy "trips_insert_owner" on public.trips
for insert with check (auth.uid() = owner_id);

drop policy if exists "trips_update_owner" on public.trips;
create policy "trips_update_owner" on public.trips
for update using (auth.uid() = owner_id);

drop policy if exists "trips_delete_owner" on public.trips;
create policy "trips_delete_owner" on public.trips
for delete using (auth.uid() = owner_id);

-- MEMBERS
drop policy if exists "members_select_owner" on public.trip_members;
create policy "members_select_owner" on public.trip_members
for select using (
  exists (
    select 1 from public.trips t
    where t.id = trip_id and t.owner_id = auth.uid()
  )
);

drop policy if exists "members_insert_owner" on public.trip_members;
create policy "members_insert_owner" on public.trip_members
for insert with check (
  exists (
    select 1 from public.trips t
    where t.id = trip_id and t.owner_id = auth.uid()
  )
);

drop policy if exists "members_delete_owner" on public.trip_members;
create policy "members_delete_owner" on public.trip_members
for delete using (
  exists (
    select 1 from public.trips t
    where t.id = trip_id and t.owner_id = auth.uid()
  )
);

-- DAYS
drop policy if exists "days_select_member" on public.trip_days;
create policy "days_select_member" on public.trip_days
for select using (
  exists (
    select 1 from public.trip_members m
    where m.trip_id = trip_id and m.user_id = auth.uid()
  )
);

drop policy if exists "days_insert_owner" on public.trip_days;
create policy "days_insert_owner" on public.trip_days
for insert with check (
  exists (
    select 1 from public.trips t
    where t.id = trip_id and t.owner_id = auth.uid()
  )
);

drop policy if exists "days_update_owner" on public.trip_days;
create policy "days_update_owner" on public.trip_days
for update using (
  exists (
    select 1 from public.trips t
    where t.id = trip_id and t.owner_id = auth.uid()
  )
);

drop policy if exists "days_delete_owner" on public.trip_days;
create policy "days_delete_owner" on public.trip_days
for delete using (
  exists (
    select 1 from public.trips t
    where t.id = trip_id and t.owner_id = auth.uid()
  )
);

-- ITEMS
drop policy if exists "items_select_member" on public.trip_items;
create policy "items_select_member" on public.trip_items
for select using (
  exists (
    select 1
    from public.trip_days d
    join public.trip_members m on m.trip_id = d.trip_id
    where d.id = day_id and m.user_id = auth.uid()
  )
);

drop policy if exists "items_insert_owner" on public.trip_items;
create policy "items_insert_owner" on public.trip_items
for insert with check (
  exists (
    select 1
    from public.trip_days d
    join public.trips t on t.id = d.trip_id
    where d.id = day_id and t.owner_id = auth.uid()
  )
);

drop policy if exists "items_delete_owner" on public.trip_items;
create policy "items_delete_owner" on public.trip_items
for delete using (
  exists (
    select 1
    from public.trip_days d
    join public.trips t on t.id = d.trip_id
    where d.id = day_id and t.owner_id = auth.uid()
  )
);

-- MESSAGES
drop policy if exists "msg_select_member" on public.trip_messages;
create policy "msg_select_member" on public.trip_messages
for select using (
  exists (
    select 1 from public.trip_members m
    where m.trip_id = trip_id and m.user_id = auth.uid()
  )
);

drop policy if exists "msg_insert_member" on public.trip_messages;
create policy "msg_insert_member" on public.trip_messages
for insert with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.trip_members m
    where m.trip_id = trip_id and m.user_id = auth.uid()
  )
);