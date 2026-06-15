import { NextRequest, NextResponse } from "next/server"
import { renderToBuffer } from "@react-pdf/renderer"
import { createClient } from "@/lib/supabase/server"
import { PayrollReport } from "@/lib/pdf/PayrollReport"

const MONTHS = ["", "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"]

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()))
  const month = parseInt(searchParams.get("month") ?? String(new Date().getMonth() + 1))

  const { data } = await supabase
    .from("payroll_records")
    .select("gross_pay,deductions,net_pay,status,days_or_hours,employee:employees(name,role,type)")
    .eq("year", year)
    .eq("month", month)
    .order("created_at")

  const rows = (data ?? []).map((r: any) => ({
    name: r.employee?.name ?? "",
    role: r.employee?.role ?? "",
    type: r.employee?.type ?? "",
    days_or_hours: r.days_or_hours ?? 0,
    gross_pay: r.gross_pay,
    deductions: r.deductions,
    net_pay: r.net_pay,
    status: r.status,
  }))

  const totalGross = rows.reduce((s, r) => s + r.gross_pay, 0)
  const totalNet = rows.reduce((s, r) => s + r.net_pay, 0)

  const buffer = await renderToBuffer(
    <PayrollReport
      month={`${MONTHS[month]} ${year}`}
      year={year}
      monthNum={month}
      rows={rows}
      totalGross={totalGross}
      totalNet={totalNet}
    />
  )

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="penggajian-${year}-${String(month).padStart(2, "0")}.pdf"`,
    },
  })
}
