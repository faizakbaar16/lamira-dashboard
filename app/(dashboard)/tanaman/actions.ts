"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import type { Plant, WorkLog, CareSchedule } from "@/types"

export async function getPlants(): Promise<Plant[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("plants")
    .select("*")
    .order("block")
    .order("species")
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getWorkLogs(limit = 50): Promise<WorkLog[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("work_logs")
    .select("*, plant:plants(id,species,variety,block)")
    .order("date", { ascending: false })
    .limit(limit)
  if (error) throw new Error(error.message)
  return (data ?? []) as WorkLog[]
}

export async function getCareSchedules(): Promise<CareSchedule[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("care_schedules")
    .select("*, plant:plants(id,species,variety,block)")
    .neq("status", "completed")
    .order("next_due")
  if (error) throw new Error(error.message)
  return (data ?? []) as CareSchedule[]
}

export async function addWorkLog(formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.from("work_logs").insert({
    date: formData.get("date") as string,
    plant_id: formData.get("plant_id") as string,
    work_type: formData.get("work_type") as string,
    worker_names: (formData.get("worker_names") as string)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    notes: (formData.get("notes") as string) || null,
  })
  if (error) throw new Error(error.message)
  revalidatePath("/tanaman")
}

export async function refreshScheduleStatuses() {
  const supabase = await createClient()
  await supabase.rpc("refresh_care_schedule_statuses")
  revalidatePath("/tanaman")
}
