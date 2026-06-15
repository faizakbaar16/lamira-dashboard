-- ============================================================
-- LAMIRA DASHBOARD — Seed Data: Plant Inventory
-- Run AFTER 001_initial_schema.sql
-- ============================================================

insert into plants (species, variety, block, quantity, planting_year, status) values
  -- Block A: Mangga Lhokmai
  ('Mangga', 'Lhokmai', 'A', 1000, 2018, 'producing'),

  -- Block B: Durian Thailand varieties
  ('Durian', 'Monthong', 'B', 25, 2019, 'producing'),
  ('Durian', 'Chanee',   'B', 15, 2019, 'active'),
  ('Durian', 'Kanyao',   'B', 10, 2020, 'active'),

  -- Block C: Lemon
  ('Lemon', 'Eureka',  'C', 1000, 2020, 'producing'),

  -- Block D: Kelapa
  ('Kelapa', 'Dalam',  'D', 150, 2015, 'producing'),

  -- Block E: Jeruk Bali
  ('Jeruk Bali', 'Bangkok', 'E', 100, 2021, 'active'),

  -- Block F: Sawo
  ('Sawo', 'Manila', 'F', 20, 2020, 'active'),

  -- Block G: Pete
  ('Pete', 'Lokal', 'G', 20, 2019, 'producing');

-- ─── Seed: Initial Care Schedules ────────────────────────────
-- Auto-generate first schedule for each plant group
-- (Pemupukan every 90 days, Penyemprotan every 30 days)

insert into care_schedules (plant_id, work_type, frequency_days, last_done, next_due, status)
select
  p.id,
  'pemupukan',
  90,
  null,
  current_date + interval '7 days',
  'upcoming'
from plants p;

insert into care_schedules (plant_id, work_type, frequency_days, last_done, next_due, status)
select
  p.id,
  'penyemprotan',
  30,
  null,
  current_date + interval '3 days',
  'upcoming'
from plants p;

-- ─── Seed: Default Feed Type ─────────────────────────────────
insert into feed_types (name, supplier, price_per_kg, min_stock_threshold, current_stock_kg) values
  ('Pakan Bebek Starter', 'Poultry Farm Palu', 8500, 100, 200),
  ('Pakan Bebek Layer',   'Poultry Farm Palu', 7500, 150, 300),
  ('Dedak Padi',          'Penggilingan Lokal', 2500, 50, 100);

-- ─── Seed: HPP default ────────────────────────────────────────
insert into hpp_config (value, effective_date) values
  (1500, current_date);
