-- ============================================================
-- LAMIRA DASHBOARD — Business Logic Triggers & Functions
-- Run AFTER 002_seed_plants.sql
-- ============================================================

-- ─── Auto-update feed stock on purchase ──────────────────────
create or replace function increment_feed_stock()
returns trigger language plpgsql as $$
begin
  update feed_types
  set current_stock_kg = current_stock_kg + new.quantity_kg,
      price_per_kg     = new.price_per_kg,  -- update price to latest purchase
      updated_at       = now()
  where id = new.feed_type_id;
  return new;
end;
$$;

create trigger feed_purchase_increment_stock
  after insert on feed_purchases
  for each row execute function increment_feed_stock();

-- ─── Auto-deduct feed stock on daily usage ───────────────────
create or replace function decrement_feed_stock()
returns trigger language plpgsql as $$
begin
  update feed_types
  set current_stock_kg = greatest(0, current_stock_kg - new.quantity_kg),
      updated_at       = now()
  where id = new.feed_type_id;
  return new;
end;
$$;

create trigger feed_usage_decrement_stock
  after insert on feed_daily_usage
  for each row execute function decrement_feed_stock();

-- Reverse on delete
create or replace function restore_feed_stock()
returns trigger language plpgsql as $$
begin
  update feed_types
  set current_stock_kg = current_stock_kg + old.quantity_kg,
      updated_at       = now()
  where id = old.feed_type_id;
  return old;
end;
$$;

create trigger feed_usage_restore_stock
  after delete on feed_daily_usage
  for each row execute function restore_feed_stock();

-- ─── Auto-recalculate care schedule next_due after work log ──
create or replace function update_care_schedule_after_work()
returns trigger language plpgsql as $$
begin
  update care_schedules
  set last_done  = new.date,
      next_due   = new.date + (frequency_days || ' days')::interval,
      status     = 'upcoming',
      updated_at = now()
  where plant_id  = new.plant_id
    and work_type = new.work_type;
  return new;
end;
$$;

create trigger work_log_update_schedule
  after insert on work_logs
  for each row execute function update_care_schedule_after_work();

-- ─── Auto-refresh care schedule statuses ─────────────────────
-- Call this daily (or on page load via RPC) to keep status current
create or replace function refresh_care_schedule_statuses()
returns void language plpgsql as $$
begin
  update care_schedules
  set status = case
    when next_due < current_date  then 'overdue'
    when next_due = current_date  then 'due_today'
    else 'upcoming'
  end,
  updated_at = now()
  where status != 'completed';
end;
$$;

-- ─── Auto-flag overdue payments ───────────────────────────────
create or replace function refresh_payment_statuses()
returns void language plpgsql as $$
begin
  update sales_transactions
  set payment_status = 'overdue',
      updated_at     = now()
  where payment_status = 'pending'
    and due_date is not null
    and due_date < current_date;
end;
$$;

-- ─── Set due_date on sales_transaction insert ─────────────────
create or replace function set_sales_due_date()
returns trigger language plpgsql as $$
declare
  terms text;
  days_offset integer;
begin
  select payment_terms into terms
  from customers where id = new.customer_id;

  days_offset := case terms
    when 'net7'  then 7
    when 'net14' then 14
    when 'net30' then 30
    else 0
  end;

  if days_offset > 0 then
    new.due_date = new.date + (days_offset || ' days')::interval;
  end if;

  return new;
end;
$$;

create trigger sales_set_due_date
  before insert on sales_transactions
  for each row execute function set_sales_due_date();

-- ─── Helpful views ────────────────────────────────────────────

-- Monthly egg production summary
create or replace view monthly_duck_summary as
select
  date_trunc('month', date)::date          as month,
  sum(eggs_total)                          as total_eggs,
  sum(eggs_reject)                         as total_reject,
  sum(eggs_total - eggs_reject)            as net_eggs,
  sum(feed_consumed_kg)                    as total_feed_kg,
  sum(feed_cost)                           as total_feed_cost,
  round(avg(eggs_total), 1)               as avg_daily_eggs
from duck_daily
group by date_trunc('month', date)
order by month desc;

-- Project budget vs actuals
create or replace view project_budget_summary as
select
  p.id,
  p.name,
  p.status,
  p.budget,
  coalesce(mat.total_materials, 0)                                 as actual_materials,
  coalesce(wkr.total_labor, 0)                                     as actual_labor,
  coalesce(mat.total_materials, 0) + coalesce(wkr.total_labor, 0) as actual_total,
  p.budget - (coalesce(mat.total_materials, 0) + coalesce(wkr.total_labor, 0)) as budget_remaining,
  (select count(*) from milestones m where m.project_id = p.id)                as milestone_count,
  (select count(*) from milestones m where m.project_id = p.id and m.status = 'completed') as milestones_done
from projects p
left join (
  select cl.project_id, sum(cm.total) as total_materials
  from construction_logs cl
  join construction_materials cm on cm.log_id = cl.id
  group by cl.project_id
) mat on mat.project_id = p.id
left join (
  select cl.project_id, sum(cw.day_rate * cw.days_worked) as total_labor
  from construction_logs cl
  join construction_workers cw on cw.log_id = cl.id
  group by cl.project_id
) wkr on wkr.project_id = p.id;

-- Monthly payroll summary
create or replace view monthly_payroll_summary as
select
  period_year,
  period_month,
  count(*)        as employee_count,
  sum(gross)      as total_gross,
  sum(deductions) as total_deductions,
  sum(net)        as total_net,
  count(*) filter (where paid_at is not null) as paid_count
from payroll_records
group by period_year, period_month
order by period_year desc, period_month desc;

-- Feed stock alert view
create or replace view feed_stock_alerts as
select
  id,
  name,
  current_stock_kg,
  min_stock_threshold,
  price_per_kg,
  (current_stock_kg <= min_stock_threshold) as needs_reorder,
  (current_stock_kg / nullif(min_stock_threshold, 0) * 100)::integer as stock_pct
from feed_types
order by (current_stock_kg / nullif(min_stock_threshold, 0));
