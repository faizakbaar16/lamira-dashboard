"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import type { DuckDaily, SaltingLog, SalesTransaction, Customer } from "@/types"

// ─── Duck Daily ───────────────────────────────────────────────

export async function getDuckDailyRecent(limit = 30): Promise<DuckDaily[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("duck_daily")
    .select("*")
    .order("date", { ascending: false })
    .limit(limit)
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function addDuckDaily(formData: FormData) {
  const supabase = await createClient()
  const feedConsumedKg = Number(formData.get("feed_consumed_kg"))

  // Get latest feed price
  const { data: feedData } = await supabase
    .from("feed_types")
    .select("price_per_kg")
    .order("updated_at", { ascending: false })
    .limit(1)
    .single()

  const pricePerKg = feedData?.price_per_kg ?? 0
  const feedCost = feedConsumedKg * pricePerKg

  const { error } = await supabase.from("duck_daily").upsert({
    date: formData.get("date") as string,
    eggs_total: Number(formData.get("eggs_total")),
    eggs_reject: Number(formData.get("eggs_reject")),
    feed_consumed_kg: feedConsumedKg,
    feed_cost: feedCost,
    notes: (formData.get("notes") as string) || null,
  }, { onConflict: "date" })

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

  const { error } = await supabase.from("salting_log").insert({
    date_salted: dateSalted,
    quantity: Number(formData.get("quantity")),
    worker_names: (formData.get("worker_names") as string)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    storage_location: (formData.get("storage_location") as string) || null,
    expected_ready_date: readyDate.toISOString().split("T")[0],
    status: "in_process",
  })

  if (error) throw new Error(error.message)
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
  const customerId = formData.get("customer_id") as string
  const quantity = Number(formData.get("quantity"))
  const unitPrice = Number(formData.get("unit_price"))

  const { error } = await supabase.from("sales_transactions").insert({
    date: formData.get("date") as string,
    customer_id: customerId,
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

// ─── Monthly summary ──────────────────────────────────────────

export async function getMonthlyDuckSummary() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("monthly_duck_summary")
    .select("*")
    .limit(12)
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
