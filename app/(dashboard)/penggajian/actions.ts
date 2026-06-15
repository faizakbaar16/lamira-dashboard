"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import type { Employee, Attendance, PayrollRecord } from "@/types"

export async function getEmployees(): Promise<Employee[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .order("name")
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getAttendanceByMonth(year: number, month: number): Promise<Attendance[]> {
  const supabase = await createClient()
  const from = `${year}-${String(month).padStart(2, "0")}-01`
  const to = `${year}-${String(month).padStart(2, "0")}-31`
  const { data, error } = await supabase
    .from("attendance")
    .select("*, employee:employees(id,name,role,base_rate,type)")
    .gte("date", from)
    .lte("date", to)
    .order("date", { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as Attendance[]
}

export async function getPayrollRecords(year: number, month: number): Promise<PayrollRecord[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("payroll_records")
    .select("*, employee:employees(id,name,role)")
    .eq("period_year", year)
    .eq("period_month", month)
    .order("employee(name)")
  if (error) throw new Error(error.message)
  return (data ?? []) as PayrollRecord[]
}

export async function addEmployee(formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.from("employees").insert({
    name: formData.get("name") as string,
    role: formData.get("role") as string,
    type: formData.get("type") as string,
    base_rate: Number(formData.get("base_rate")),
    active: true,
  })
  if (error) throw new Error(error.message)
  revalidatePath("/penggajian")
}

export async function addAttendance(formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.from("attendance").insert({
    date: formData.get("date") as string,
    employee_id: formData.get("employee_id") as string,
    module: (formData.get("module") as string) || null,
    hours_or_days: Number(formData.get("hours_or_days")),
    notes: (formData.get("notes") as string) || null,
  })
  if (error) throw new Error(error.message)
  revalidatePath("/penggajian")
}

export async function generatePayroll(year: number, month: number) {
  const supabase = await createClient()

  // Get all employees
  const { data: employees } = await supabase.from("employees").select("*").eq("active", true)
  if (!employees) throw new Error("Gagal mengambil data karyawan")

  const from = `${year}-${String(month).padStart(2, "0")}-01`
  const to = `${year}-${String(month).padStart(2, "0")}-31`

  for (const emp of employees) {
    // Sum attendance for the month
    const { data: att } = await supabase
      .from("attendance")
      .select("hours_or_days")
      .eq("employee_id", emp.id)
      .gte("date", from)
      .lte("date", to)

    const totalUnits = (att ?? []).reduce((s: number, a: any) => s + a.hours_or_days, 0)
    const gross = totalUnits * emp.base_rate

    // Upsert payroll record
    await supabase.from("payroll_records").upsert({
      employee_id: emp.id,
      period_month: month,
      period_year: year,
      gross,
      deductions: 0,
    }, { onConflict: "employee_id,period_month,period_year" })
  }

  revalidatePath("/penggajian")
}

export async function markPayrollPaid(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from("payroll_records")
    .update({ paid_at: new Date().toISOString() })
    .eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/penggajian")
}
