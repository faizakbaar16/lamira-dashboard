import { NextRequest, NextResponse } from "next/server"
import { renderToBuffer } from "@react-pdf/renderer"
import { createClient } from "@/lib/supabase/server"
import { BebekReport } from "@/lib/pdf/BebokReport"

const MONTHS = ["", "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"]

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()))
  const month = parseInt(searchParams.get("month") ?? String(new Date().getMonth() + 1))

  const from = `${year}-${String(month).padStart(2, "0")}-01`
  const to = new Date(year, month, 0).toISOString().slice(0, 10)

  const [duckRes, salesRes, hppRes] = await Promise.all([
    supabase.from("duck_daily").select("date,eggs_total,eggs_reject,feed_consumed_kg,feed_cost").gte("date", from).lte("date", to).order("date"),
    supabase.from("sales_transactions").select("date,product_type,quantity,total,payment_status,customer:customers(name)").gte("date", from).lte("date", to).order("date"),
    supabase.from("hpp_config").select("hpp_per_butir").order("updated_at", { ascending: false }).limit(1).maybeSingle(),
  ])

  const rows = duckRes.data ?? []
  const sales = (salesRes.data ?? []).map((s: any) => ({
    ...s,
    customer_name: s.customer?.name ?? "",
  }))

  const totalEggs = rows.reduce((s, r) => s + r.eggs_total, 0)
  const totalReject = rows.reduce((s, r) => s + r.eggs_reject, 0)
  const totalFeedCost = rows.reduce((s, r) => s + r.feed_cost, 0)
  const totalRevenue = sales.reduce((s: number, r: any) => s + r.total, 0)

  const buffer = await renderToBuffer(
    <BebekReport
      month={`${MONTHS[month]} ${year}`}
      totalEggs={totalEggs}
      totalReject={totalReject}
      totalFeedCost={totalFeedCost}
      totalRevenue={totalRevenue}
      hppPerButir={hppRes.data?.hpp_per_butir ?? 0}
      rows={rows}
      sales={sales}
    />
  )

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="bebek-${year}-${String(month).padStart(2, "0")}.pdf"`,
    },
  })
}
