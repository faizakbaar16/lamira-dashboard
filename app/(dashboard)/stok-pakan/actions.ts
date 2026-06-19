"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import type { FeedType, FeedPurchase } from "@/types"

export async function getFeedTypes(): Promise<FeedType[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("feed_types")
    .select("*")
    .order("name")
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getFeedPurchases(): Promise<FeedPurchase[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("feed_purchases")
    .select("*, feed_type:feed_types(id,name)")
    .order("date", { ascending: false })
    .limit(50)
  if (error) throw new Error(error.message)
  return (data ?? []) as FeedPurchase[]
}

export async function addFeedType(formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.from("feed_types").insert({
    name: formData.get("name") as string,
    supplier: formData.get("supplier") as string || null,
    price_per_kg: Number(formData.get("price_per_kg")),
    min_stock_threshold: Number(formData.get("min_stock_threshold")),
    current_stock_kg: 0,
  })
  if (error) throw new Error(error.message)
  revalidatePath("/stok-pakan")
}

export async function addFeedPurchase(formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.from("feed_purchases").insert({
    feed_type_id: formData.get("feed_type_id") as string,
    date: formData.get("date") as string,
    quantity_kg: Number(formData.get("quantity_kg")),
    price_per_kg: Number(formData.get("price_per_kg")),
    supplier: formData.get("supplier") as string || null,
  })
  if (error) throw new Error(error.message)
  revalidatePath("/stok-pakan")
}

export async function updateFeedThreshold(id: string, threshold: number) {
  const supabase = await createClient()
  const { error } = await supabase
    .from("feed_types")
    .update({ min_stock_threshold: threshold })
    .eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/stok-pakan")
}

export async function deleteFeedType(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("feed_types").delete().eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/stok-pakan")
  revalidatePath("/bebek")
}
