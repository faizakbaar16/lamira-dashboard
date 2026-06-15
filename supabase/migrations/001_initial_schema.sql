-- ============================================================
-- LAMIRA DASHBOARD — Initial Schema
-- Run this in the Supabase SQL Editor (project: zbsuwanicpqvzejviwtq)
-- ============================================================

-- ─── Extensions ──────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── Helper: updated_at trigger ──────────────────────────────
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─── EMPLOYEES ───────────────────────────────────────────────
create table employees (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  role        text not null,
  type        text not null check (type in ('harian', 'mingguan', 'bulanan')),
  base_rate   numeric(12,2) not null default 0,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger employees_updated_at
  before update on employees
  for each row execute function update_updated_at();

alter table employees enable row level security;
create policy "owner access" on employees
  for all using (auth.uid() is not null);

-- ─── CUSTOMERS ───────────────────────────────────────────────
create table customers (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,
  contact         text,
  price_per_egg   numeric(10,2) not null default 0,
  payment_terms   text not null default 'cash'
    check (payment_terms in ('cash', 'net7', 'net14', 'net30')),
  active          boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger customers_updated_at
  before update on customers
  for each row execute function update_updated_at();

alter table customers enable row level security;
create policy "owner access" on customers
  for all using (auth.uid() is not null);

-- ─── PLANTS ──────────────────────────────────────────────────
create table plants (
  id            uuid primary key default uuid_generate_v4(),
  species       text not null,
  variety       text,
  block         text not null check (block in ('A','B','C','D','E','F','G')),
  quantity      integer not null default 0,
  planting_year integer,
  status        text not null default 'active'
    check (status in ('dormant','active','producing','new_planting')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger plants_updated_at
  before update on plants
  for each row execute function update_updated_at();

alter table plants enable row level security;
create policy "owner access" on plants
  for all using (auth.uid() is not null);

-- ─── PROJECTS (Pembangunan) ───────────────────────────────────
create table projects (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  description   text,
  location      text,
  start_date    date not null,
  target_date   date not null,
  budget        numeric(15,2) not null default 0,
  status        text not null default 'planning'
    check (status in ('planning','in_progress','on_hold','completed')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger projects_updated_at
  before update on projects
  for each row execute function update_updated_at();

alter table projects enable row level security;
create policy "owner access" on projects
  for all using (auth.uid() is not null);

-- ─── FEED TYPES (Stok Pakan) ──────────────────────────────────
create table feed_types (
  id                    uuid primary key default uuid_generate_v4(),
  name                  text not null,
  supplier              text,
  price_per_kg          numeric(10,2) not null default 0,
  min_stock_threshold   numeric(10,2) not null default 50,
  current_stock_kg      numeric(10,2) not null default 0,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create trigger feed_types_updated_at
  before update on feed_types
  for each row execute function update_updated_at();

alter table feed_types enable row level security;
create policy "owner access" on feed_types
  for all using (auth.uid() is not null);

-- ─── HPP CONFIG ───────────────────────────────────────────────
create table hpp_config (
  id              uuid primary key default uuid_generate_v4(),
  value           numeric(10,2) not null,
  effective_date  date not null default current_date,
  created_at      timestamptz not null default now()
);

alter table hpp_config enable row level security;
create policy "owner access" on hpp_config
  for all using (auth.uid() is not null);

-- ─── DUCK DAILY ───────────────────────────────────────────────
create table duck_daily (
  id                  uuid primary key default uuid_generate_v4(),
  date                date not null unique,
  eggs_total          integer not null default 0,
  eggs_reject         integer not null default 0,
  feed_consumed_kg    numeric(8,2) not null default 0,
  feed_cost           numeric(12,2) not null default 0,
  notes               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index duck_daily_date_idx on duck_daily(date desc);

create trigger duck_daily_updated_at
  before update on duck_daily
  for each row execute function update_updated_at();

alter table duck_daily enable row level security;
create policy "owner access" on duck_daily
  for all using (auth.uid() is not null);

-- ─── SALTING LOG ──────────────────────────────────────────────
create table salting_log (
  id                    uuid primary key default uuid_generate_v4(),
  date_salted           date not null,
  quantity              integer not null default 0,
  worker_names          text[] not null default '{}',
  storage_location      text,
  expected_ready_date   date not null,
  status                text not null default 'in_process'
    check (status in ('in_process','ready','sold')),
  date_sold             date,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index salting_log_date_idx on salting_log(date_salted desc);
create index salting_log_status_idx on salting_log(status);

create trigger salting_log_updated_at
  before update on salting_log
  for each row execute function update_updated_at();

alter table salting_log enable row level security;
create policy "owner access" on salting_log
  for all using (auth.uid() is not null);

-- ─── SALES TRANSACTIONS ───────────────────────────────────────
create table sales_transactions (
  id              uuid primary key default uuid_generate_v4(),
  date            date not null,
  customer_id     uuid not null references customers(id) on delete restrict,
  product_type    text not null check (product_type in ('fresh','salted')),
  quantity        integer not null default 0,
  unit_price      numeric(10,2) not null default 0,
  total           numeric(14,2) generated always as (quantity * unit_price) stored,
  payment_status  text not null default 'pending'
    check (payment_status in ('pending','paid','overdue')),
  due_date        date,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index sales_transactions_date_idx on sales_transactions(date desc);
create index sales_transactions_customer_idx on sales_transactions(customer_id);
create index sales_transactions_status_idx on sales_transactions(payment_status);

create trigger sales_transactions_updated_at
  before update on sales_transactions
  for each row execute function update_updated_at();

alter table sales_transactions enable row level security;
create policy "owner access" on sales_transactions
  for all using (auth.uid() is not null);

-- ─── WORK LOGS (Tanaman) ──────────────────────────────────────
create table work_logs (
  id            uuid primary key default uuid_generate_v4(),
  date          date not null,
  plant_id      uuid not null references plants(id) on delete restrict,
  work_type     text not null,
  worker_names  text[] not null default '{}',
  notes         text,
  photo_url     text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index work_logs_date_idx on work_logs(date desc);
create index work_logs_plant_idx on work_logs(plant_id);

create trigger work_logs_updated_at
  before update on work_logs
  for each row execute function update_updated_at();

alter table work_logs enable row level security;
create policy "owner access" on work_logs
  for all using (auth.uid() is not null);

-- ─── CARE SCHEDULES ───────────────────────────────────────────
create table care_schedules (
  id              uuid primary key default uuid_generate_v4(),
  plant_id        uuid not null references plants(id) on delete cascade,
  work_type       text not null,
  frequency_days  integer not null default 30,
  last_done       date,
  next_due        date not null,
  status          text not null default 'upcoming'
    check (status in ('upcoming','due_today','overdue','completed')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index care_schedules_plant_idx on care_schedules(plant_id);
create index care_schedules_next_due_idx on care_schedules(next_due);
create index care_schedules_status_idx on care_schedules(status);

create trigger care_schedules_updated_at
  before update on care_schedules
  for each row execute function update_updated_at();

alter table care_schedules enable row level security;
create policy "owner access" on care_schedules
  for all using (auth.uid() is not null);

-- ─── MILESTONES (Pembangunan) ─────────────────────────────────
create table milestones (
  id                uuid primary key default uuid_generate_v4(),
  project_id        uuid not null references projects(id) on delete cascade,
  name              text not null,
  target_date       date not null,
  completion_date   date,
  status            text not null default 'pending'
    check (status in ('pending','in_progress','completed')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index milestones_project_idx on milestones(project_id);

create trigger milestones_updated_at
  before update on milestones
  for each row execute function update_updated_at();

alter table milestones enable row level security;
create policy "owner access" on milestones
  for all using (auth.uid() is not null);

-- ─── CONSTRUCTION LOGS ────────────────────────────────────────
create table construction_logs (
  id          uuid primary key default uuid_generate_v4(),
  date        date not null,
  project_id  uuid not null references projects(id) on delete restrict,
  description text not null,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index construction_logs_date_idx on construction_logs(date desc);
create index construction_logs_project_idx on construction_logs(project_id);

create trigger construction_logs_updated_at
  before update on construction_logs
  for each row execute function update_updated_at();

alter table construction_logs enable row level security;
create policy "owner access" on construction_logs
  for all using (auth.uid() is not null);

-- ─── CONSTRUCTION MATERIALS ───────────────────────────────────
create table construction_materials (
  id          uuid primary key default uuid_generate_v4(),
  log_id      uuid not null references construction_logs(id) on delete cascade,
  item_name   text not null,
  quantity    numeric(10,2) not null default 0,
  unit        text not null default 'pcs',
  unit_price  numeric(12,2) not null default 0,
  total       numeric(14,2) generated always as (quantity * unit_price) stored,
  created_at  timestamptz not null default now()
);

create index construction_materials_log_idx on construction_materials(log_id);

alter table construction_materials enable row level security;
create policy "owner access" on construction_materials
  for all using (auth.uid() is not null);

-- ─── CONSTRUCTION WORKERS ─────────────────────────────────────
create table construction_workers (
  id            uuid primary key default uuid_generate_v4(),
  log_id        uuid not null references construction_logs(id) on delete cascade,
  employee_id   uuid references employees(id) on delete set null,
  role          text not null,
  day_rate      numeric(10,2) not null default 0,
  days_worked   numeric(5,2) not null default 1,
  created_at    timestamptz not null default now()
);

create index construction_workers_log_idx on construction_workers(log_id);

alter table construction_workers enable row level security;
create policy "owner access" on construction_workers
  for all using (auth.uid() is not null);

-- ─── ATTENDANCE (Penggajian) ──────────────────────────────────
create table attendance (
  id            uuid primary key default uuid_generate_v4(),
  date          date not null,
  employee_id   uuid not null references employees(id) on delete restrict,
  module        text,
  hours_or_days numeric(5,2) not null default 1,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index attendance_date_idx on attendance(date desc);
create index attendance_employee_idx on attendance(employee_id);

create trigger attendance_updated_at
  before update on attendance
  for each row execute function update_updated_at();

alter table attendance enable row level security;
create policy "owner access" on attendance
  for all using (auth.uid() is not null);

-- ─── PAYROLL RECORDS ──────────────────────────────────────────
create table payroll_records (
  id              uuid primary key default uuid_generate_v4(),
  employee_id     uuid not null references employees(id) on delete restrict,
  period_month    integer not null check (period_month between 1 and 12),
  period_year     integer not null,
  gross           numeric(12,2) not null default 0,
  deductions      numeric(12,2) not null default 0,
  net             numeric(12,2) generated always as (gross - deductions) stored,
  paid_at         timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (employee_id, period_month, period_year)
);

create index payroll_records_employee_idx on payroll_records(employee_id);
create index payroll_records_period_idx on payroll_records(period_year, period_month);

create trigger payroll_records_updated_at
  before update on payroll_records
  for each row execute function update_updated_at();

alter table payroll_records enable row level security;
create policy "owner access" on payroll_records
  for all using (auth.uid() is not null);

-- ─── FEED PURCHASES ───────────────────────────────────────────
create table feed_purchases (
  id              uuid primary key default uuid_generate_v4(),
  feed_type_id    uuid not null references feed_types(id) on delete restrict,
  date            date not null,
  quantity_kg     numeric(10,2) not null default 0,
  price_per_kg    numeric(10,2) not null default 0,
  supplier        text,
  total_cost      numeric(14,2) generated always as (quantity_kg * price_per_kg) stored,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index feed_purchases_date_idx on feed_purchases(date desc);
create index feed_purchases_type_idx on feed_purchases(feed_type_id);

create trigger feed_purchases_updated_at
  before update on feed_purchases
  for each row execute function update_updated_at();

alter table feed_purchases enable row level security;
create policy "owner access" on feed_purchases
  for all using (auth.uid() is not null);

-- ─── FEED DAILY USAGE ─────────────────────────────────────────
create table feed_daily_usage (
  id                    uuid primary key default uuid_generate_v4(),
  date                  date not null,
  feed_type_id          uuid not null references feed_types(id) on delete restrict,
  quantity_kg           numeric(8,2) not null default 0,
  linked_duck_daily_id  uuid references duck_daily(id) on delete set null,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index feed_daily_usage_date_idx on feed_daily_usage(date desc);
create index feed_daily_usage_type_idx on feed_daily_usage(feed_type_id);

create trigger feed_daily_usage_updated_at
  before update on feed_daily_usage
  for each row execute function update_updated_at();

alter table feed_daily_usage enable row level security;
create policy "owner access" on feed_daily_usage
  for all using (auth.uid() is not null);

-- ─── SYNC LOG ────────────────────────────────────────────────
create table sync_log (
  id              uuid primary key default uuid_generate_v4(),
  module          text not null,
  direction       text not null check (direction in ('push','pull')),
  synced_at       timestamptz not null default now(),
  status          text not null check (status in ('success','error')),
  rows_affected   integer not null default 0,
  error_message   text
);

create index sync_log_module_idx on sync_log(module, synced_at desc);

alter table sync_log enable row level security;
create policy "owner access" on sync_log
  for all using (auth.uid() is not null);
