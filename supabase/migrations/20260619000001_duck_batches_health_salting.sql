-- ============================================================
-- LAMIRA — Duck Batches, Health Records, Salting Costs
-- Run in Supabase SQL Editor
-- ============================================================

-- ─── 1. duck_batches — master kandang ────────────────────────
create table if not exists duck_batches (
  id              uuid primary key default gen_random_uuid(),
  code            text not null unique,        -- P1, P2, P3_K1 ...
  name            text not null,
  population      integer not null default 0,
  feed_kg_per_day numeric(6,2) not null default 0,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Seed kandang sesuai data real
insert into duck_batches (code, name, population, feed_kg_per_day) values
  ('P1',    'Petelur 1',               166, 21),
  ('P2',    'Petelur 2',               143, 19),
  ('P3_K1', 'Petelur 3 – Kamar 1',    232, 30),
  ('P3_K2', 'Petelur 3 – Kamar 2',    232, 30),
  ('P3_K3', 'Petelur 3 – Kamar 3',    232, 30),
  ('P3_K4', 'Petelur 3 – Kamar 4',    232, 30)
on conflict (code) do nothing;

-- ─── 2. Update duck_daily — tambah batch_id & feed_type_id ───
alter table duck_daily
  add column if not exists batch_id     uuid references duck_batches(id),
  add column if not exists feed_type_id uuid references feed_types(id);

-- Unique constraint: satu batch satu log per hari
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'duck_daily_date_batch_key'
  ) then
    alter table duck_daily
      add constraint duck_daily_date_batch_key unique (date, batch_id);
  end if;
end $$;

-- ─── 3. duck_health_records — obat & vitamin ─────────────────
create table if not exists duck_health_records (
  id           uuid primary key default gen_random_uuid(),
  date         date not null,
  batch_id     uuid references duck_batches(id),  -- null = semua kandang
  record_type  text not null check (record_type in ('obat','vitamin','vaksin','lainnya')),
  product_name text not null,
  dosage       text,
  total_cost   numeric(12,2) not null default 0,
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ─── 4. salting_costs — biaya item per batch pengasinan ──────
create table if not exists salting_costs (
  id              uuid primary key default gen_random_uuid(),
  salting_log_id  uuid not null references salting_logs(id) on delete cascade,
  item_name       text not null,   -- garam, plastik, dll
  quantity        numeric(10,3) not null,
  unit            text not null default 'kg',
  unit_cost       numeric(12,2) not null,
  total_cost      numeric(12,2) generated always as (quantity * unit_cost) stored,
  created_at      timestamptz not null default now()
);

-- ─── 5. Update view monthly_duck_summary ─────────────────────
create or replace view monthly_duck_summary as
select
  date_trunc('month', d.date)::date          as month,
  b.code                                     as batch_code,
  b.name                                     as batch_name,
  sum(d.eggs_total)                          as total_eggs,
  sum(d.eggs_reject)                         as total_reject,
  sum(d.eggs_total - coalesce(d.eggs_reject,0)) as net_eggs,
  sum(d.feed_consumed_kg)                    as total_feed_kg,
  sum(d.feed_cost)                           as total_feed_cost,
  round(avg(d.eggs_total), 1)               as avg_daily_eggs,
  round(avg(
    case when b.population > 0
    then d.eggs_total::numeric / b.population * 100
    end
  ), 2)                                      as avg_productivity_pct
from duck_daily d
left join duck_batches b on b.id = d.batch_id
group by date_trunc('month', d.date), b.code, b.name
order by month desc, b.code;

-- Aggregated view (all batches combined per day — for charts)
create or replace view daily_duck_summary as
select
  date,
  sum(eggs_total)                             as total_eggs,
  sum(eggs_reject)                            as total_reject,
  sum(eggs_total - coalesce(eggs_reject,0))   as net_eggs,
  sum(feed_consumed_kg)                       as total_feed_kg,
  sum(feed_cost)                              as total_feed_cost,
  count(distinct batch_id)                    as active_batches
from duck_daily
group by date
order by date;

-- ─── 6. RLS policies ─────────────────────────────────────────
alter table duck_batches       enable row level security;
alter table duck_health_records enable row level security;
alter table salting_costs       enable row level security;

create policy "auth_all" on duck_batches
  for all to authenticated using (true) with check (true);

create policy "auth_all" on duck_health_records
  for all to authenticated using (true) with check (true);

create policy "auth_all" on salting_costs
  for all to authenticated using (true) with check (true);
