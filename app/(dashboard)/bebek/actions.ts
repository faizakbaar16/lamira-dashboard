"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import type { DuckBatch, DuckDaily, DuckHealthRecord, SaltingLog, SalesTransaction, Customer } from "@/types"

// ─── Duck Batches ─────────────────────────────────────────────

export async function getDuckBatches(): Promise<DuckBatch[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("duck_batches")
    .select("*")
    .eq("is_active", true)
    .order("code")
  if (error) throw new Error(error.message)
  return data ?? []
}

// ─── Duck Daily ───────────────────────────────────────────────

export async function getDuckDailyRecent(limit = 60): Promise<DuckDaily[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("duck_daily")
    .select("*, batch:duck_batches(id,code,name,population), feed_type:feed_types(id,name,price_per_kg)")
    .order("date", { ascending: false })
    .order("batch_id")
    .limit(limit)
  if (error) throw new Error(error.message)
  return (data ?? []) as DuckDaily[]
}

export async function getDuckDailyForChart(days = 180): Promise<{ date: string; batch_code: string; eggs_total: number; productivity_pct: number }[]> {
  const supabase = await createClient()
  const since = new Date()
  since.setDate(since.getDate() - days)
  const { data, error } = await supabase
    .from("duck_daily")
    .select("date, eggs_total, eggs_reject, batch:duck_batches(code, population)")
    .gte("date", since.toISOString().split("T")[0])
    .order("date")
  if (error) return []
  return (data ?? []).map((r: any) => ({
    date: r.date,
    batch_code: r.batch?.code ?? "?",
    eggs_total: r.eggs_total ?? 0,
    productivity_pct: r.batch?.population > 0
      ? Math.round((r.eggs_total / r.batch.population) * 100 * 10) / 10
      : 0,
  }))
}

export async function addDuckDaily(formData: FormData) {
  const supabase = await createClient()
  const feedTypeId = formData.get("feed_type_id") as string
  const feedConsumedKg = Number(formData.get("feed_consumed_kg"))
  const batchId = formData.get("batch_id") as string

  const { data: feedData } = await supabase
    .from("feed_types")
    .select("price_per_kg")
    .eq("id", feedTypeId)
    .single()

  const feedCost = feedConsumedKg * (feedData?.price_per_kg ?? 0)

  const { error } = await supabase.from("duck_daily").upsert({
    date: formData.get("date") as string,
    batch_id: batchId || null,
    feed_type_id: feedTypeId || null,
    eggs_total: Number(formData.get("eggs_total")),
    eggs_reject: Number(formData.get("eggs_reject") ?? 0),
    feed_consumed_kg: feedConsumedKg,
    feed_cost: feedCost,
    notes: (formData.get("notes") as string) || null,
  }, { onConflict: "date,batch_id" })

  if (error) throw new Error(error.message)
  revalidatePath("/bebek")
}

// ─── Feed Types ───────────────────────────────────────────────

export async function addFeedType(formData: FormData): Promise<{ id: string; name: string; price_per_kg: number }> {
  const supabase = await createClient()
  const name = (formData.get("name") as string).trim()
  const price_per_kg = Number(formData.get("price_per_kg") ?? 0)
  if (!name) throw new Error("Nama pakan wajib diisi")
  const { data, error } = await supabase
    .from("feed_types")
    .insert({ name, price_per_kg })
    .select("id,name,price_per_kg")
    .single()
  if (error) throw new Error(error.message)
  revalidatePath("/bebek")
  return data
}

// ─── Duck Health Records ──────────────────────────────────────

export async function getDuckHealthRecords(limit = 50): Promise<DuckHealthRecord[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("duck_health_records")
    .select("*, batch:duck_batches(id,code,name)")
    .order("date", { ascending: false })
    .limit(limit)
  if (error) throw new Error(error.message)
  return (data ?? []) as DuckHealthRecord[]
}

export async function addDuckHealthRecord(formData: FormData) {
  const supabase = await createClient()
  const batchId = formData.get("batch_id") as string

  const { error } = await supabase.from("duck_health_records").insert({
    date: formData.get("date") as string,
    batch_id: batchId || null,
    record_type: formData.get("record_type") as string,
    product_name: formData.get("product_name") as string,
    dosage: (formData.get("dosage") as string) || null,
    total_cost: Number(formData.get("total_cost") ?? 0),
    notes: (formData.get("notes") as string) || null,
  })

  if (error) throw new Error(error.message)
  revalidatePath("/bebek")
}

// ─── Salting Log ──────────────────────────────────────────────

export async function getSaltingLogs(): Promise<SaltingLog[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("salting_log")
    .select("*")
    .order("date_salted", { ascending: false })
    .limit(50)
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function addSaltingLog(formData: FormData) {
  const supabase = await createClient()
  const dateSalted = formData.get("date_salted") as string
  const daysToReady = Number(formData.get("days_to_ready") ?? 15)
  const readyDate = new Date(dateSalted)
  readyDate.setDate(readyDate.getDate() + daysToReady)

  const { data: log, error } = await supabase.from("salting_log").insert({
    date_salted: dateSalted,
    quantity: Number(formData.get("quantity")),
    worker_names: (formData.get("worker_names") as string)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    storage_location: (formData.get("storage_location") as string) || null,
    expected_ready_date: readyDate.toISOString().split("T")[0],
    status: "in_process",
  }).select("id").single()

  if (error) throw new Error(error.message)

  // Insert salting costs if provided
  const costsRaw = formData.get("costs") as string
  if (costsRaw && log?.id) {
    const costs = JSON.parse(costsRaw) as { item_name: string; quantity: number; unit: string; unit_cost: number }[]
    if (costs.length > 0) {
      await supabase.from("salting_costs").insert(
        costs.map((c) => ({ ...c, salting_log_id: log.id }))
      )
    }
  }

  revalidatePath("/bebek")
}

export async function updateSaltingStatus(id: string, status: SaltingLog["status"]) {
  const supabase = await createClient()
  const updates: Partial<SaltingLog> = { status }
  if (status === "sold") updates.date_sold = new Date().toISOString().split("T")[0]

  const { error } = await supabase
    .from("salting_log")
    .update(updates)
    .eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/bebek")
}

// ─── Customers ────────────────────────────────────────────────

export async function getCustomers(): Promise<Customer[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("active", true)
    .order("name")
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function addCustomer(formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.from("customers").insert({
    name: formData.get("name") as string,
    contact: (formData.get("contact") as string) || null,
    price_per_egg: Number(formData.get("price_per_egg")),
    payment_terms: formData.get("payment_terms") as string,
  })
  if (error) throw new Error(error.message)
  revalidatePath("/bebek")
}

// ─── Sales ────────────────────────────────────────────────────

export async function getSalesTransactions(): Promise<SalesTransaction[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("sales_transactions")
    .select("*, customer:customers(id,name,payment_terms)")
    .order("date", { ascending: false })
    .limit(100)
  if (error) throw new Error(error.message)
  return (data ?? []) as SalesTransaction[]
}

export async function addSalesTransaction(formData: FormData) {
  const supabase = await createClient()
  const quantity = Number(formData.get("quantity"))
  const unitPrice = Number(formData.get("unit_price"))

  const { error } = await supabase.from("sales_transactions").insert({
    date: formData.get("date") as string,
    customer_id: formData.get("customer_id") as string,
    product_type: formData.get("product_type") as string,
    quantity,
    unit_price: unitPrice,
    payment_status: "pending",
  })

  if (error) throw new Error(error.message)
  revalidatePath("/bebek")
}

export async function markPaymentPaid(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from("sales_transactions")
    .update({ payment_status: "paid" })
    .eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/bebek")
}

// ─── Summary ──────────────────────────────────────────────────

export async function getMonthlyDuckSummary() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("monthly_duck_summary")
    .select("*")
    .limit(24)
  if (error) return []
  return data ?? []
}

export async function getHppConfig() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("hpp_config")
    .select("*")
    .order("effective_date", { ascending: false })
    .limit(1)
    .single()
  return data
}

export async function setHpp(value: number) {
  const supabase = await createClient()
  const { error } = await supabase.from("hpp_config").insert({
    value,
    effective_date: new Date().toISOString().split("T")[0],
  })
  if (error) throw new Error(error.message)
  revalidatePath("/bebek")
}
