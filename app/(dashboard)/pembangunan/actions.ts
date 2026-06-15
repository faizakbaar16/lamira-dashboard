"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import type { Project, Milestone, ConstructionLog } from "@/types"

export async function getProjects() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("project_budget_summary")
    .select("*")
    .order("status")
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getMilestones(projectId: string): Promise<Milestone[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("milestones")
    .select("*")
    .eq("project_id", projectId)
    .order("target_date")
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getConstructionLogs(): Promise<ConstructionLog[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("construction_logs")
    .select("*, project:projects(id,name), materials:construction_materials(*), workers:construction_workers(*)")
    .order("date", { ascending: false })
    .limit(30)
  if (error) throw new Error(error.message)
  return (data ?? []) as ConstructionLog[]
}

export async function addProject(formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.from("projects").insert({
    name: formData.get("name") as string,
    description: (formData.get("description") as string) || null,
    location: (formData.get("location") as string) || null,
    start_date: formData.get("start_date") as string,
    target_date: formData.get("target_date") as string,
    budget: Number(formData.get("budget")),
    status: "planning",
  })
  if (error) throw new Error(error.message)
  revalidatePath("/pembangunan")
}

export async function addMilestone(formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.from("milestones").insert({
    project_id: formData.get("project_id") as string,
    name: formData.get("name") as string,
    target_date: formData.get("target_date") as string,
    status: "pending",
  })
  if (error) throw new Error(error.message)
  revalidatePath("/pembangunan")
}

export async function updateMilestoneStatus(id: string, status: Milestone["status"]) {
  const supabase = await createClient()
  const updates: Partial<Milestone> = { status }
  if (status === "completed") updates.completion_date = new Date().toISOString().split("T")[0]
  const { error } = await supabase.from("milestones").update(updates).eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/pembangunan")
}

export async function updateProjectStatus(id: string, status: Project["status"]) {
  const supabase = await createClient()
  const { error } = await supabase.from("projects").update({ status }).eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/pembangunan")
}
