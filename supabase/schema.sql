-- Gyosoku backend schema (Supabase / Postgres). Run once in the SQL editor.
-- Sign-up is open, so every table has row-level security and nothing is
-- readable by default.

create type public.user_role as enum ('fisherman', 'captain', 'processor', 'other');

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  role public.user_role not null,
  display_name text check (char_length(display_name) <= 40),
  -- vessel, home port, method, species, capacity, phone / company, interests
  details jsonb not null default '{}'::jsonb check (pg_column_size(details) < 4096),
  created_at timestamptz not null default now()
);

create table public.catch_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  species text not null check (char_length(species) between 1 and 50),
  quantity_kg numeric not null check (quantity_kg > 0 and quantity_kg <= 1000000),
  arrival_date date not null,
  arrival_time time,
  port text not null check (char_length(port) between 1 and 80),
  certainty text not null check (certainty in ('expected', 'confirmed')),
  notes text check (char_length(notes) <= 500),
  created_at timestamptz not null default now()
);
create index catch_reports_arrival_idx on public.catch_reports (arrival_date, species);

-- Processor-side records (orders, confirmed stock). Private to their owner.
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  species text not null,
  quantity_kg numeric not null check (quantity_kg > 0),
  due_date date not null,
  buyer text,
  created_at timestamptz not null default now()
);

create table public.stock (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  species text not null,
  confirmed_kg numeric not null check (confirmed_kg >= 0),
  location text,
  verified_at timestamptz not null default now()
);

-- Imported public/market series (government landings, prices, ocean data).
-- Written only by the service role (the ingest job); readable by signed-in users.
create table public.external_series (
  source text not null,
  series text not null,
  observed_on date not null,
  species text,
  value numeric not null,
  unit text not null,
  fetched_at timestamptz not null default now(),
  primary key (source, series, observed_on, species)
);

alter table public.profiles enable row level security;
alter table public.catch_reports enable row level security;
alter table public.orders enable row level security;
alter table public.stock enable row level security;
alter table public.external_series enable row level security;

create policy "own profile" on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

create policy "own reports" on public.catch_reports
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own orders" on public.orders
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own stock" on public.stock
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "signed-in read external" on public.external_series
  for select using (auth.uid() is not null);

-- Processors never read individual fishermen's rows. They get only aggregates
-- over several reporters, which limits what a self-declared role can learn.
create or replace function public.expected_landings(p_species text, p_until date)
returns table (reporters int, expected_kg numeric, confirmed_kg numeric, low_kg numeric, high_kg numeric)
language sql security definer set search_path = public as $$
  with r as (
    select user_id, quantity_kg, certainty
    from catch_reports
    where species = p_species and arrival_date between current_date and p_until
  )
  select count(distinct user_id)::int,
         coalesce(sum(quantity_kg), 0),
         coalesce(sum(quantity_kg) filter (where certainty = 'confirmed'), 0),
         coalesce(sum(quantity_kg) filter (where certainty = 'confirmed'), 0),
         coalesce(sum(quantity_kg), 0)
  from r
  having count(distinct user_id) >= 3;   -- suppress results from fewer than 3 reporters
$$;
revoke all on function public.expected_landings(text, date) from public;
grant execute on function public.expected_landings(text, date) to authenticated;
