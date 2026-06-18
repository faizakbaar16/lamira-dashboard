import Link from "next/link"
import { Bird, Sprout, HardHat, Package, TrendingUp, AlertTriangle, CalendarClock, Users } from "lucide-react"
import { PageShell } from "@/components/layout/PageShell"
import { StatCard } from "@/components/shared/StatCard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { createClient } from "@/lib/supabase/server"
import { formatRupiah, formatNumber, todayISO } from "@/lib/utils/format"

async function getDashboardData() {
  const supabase = await createClient()
  const today = todayISO()
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  const [
    todayDuck,
    feedTypes,
    overdueSchedules,
    activeProjects,
    monthlySales,
    monthlyFeedCost,
    monthlyPayroll,
    upcomingSchedules,
    unpaidSales,
  ] = await Promise.all([
    supabase.from("duck_daily").select("eggs_total,eggs_reject,feed_cost").eq("date", today).maybeSingle(),
    supabase.from("feed_types").select("name,current_stock_kg,min_stock_threshold"),
    supabase.from("care_schedules").select("id,plant:plants(name,block),care_type,next_due_date").eq("status", "overdue").limit(5),
    supabase.from("projects").select("id,name,status").eq("status", "active").limit(5),
    supabase.from("sales_transactions")
      .select("total")
      .gte("date", `${year}-${String(month).padStart(2, "0")}-01`)
      .lte("date", today),
    supabase.from("duck_daily")
      .select("feed_cost")
      .gte("date", `${year}-${String(month).padStart(2, "0")}-01`)
      .lte("date", today),
    supabase.from("payroll_records")
      .select("net_pay")
      .eq("year", year)
      .eq("month", month),
    supabase.from("care_schedules")
      .select("plant:plants(name,block),care_type,next_due_date")
      .in("status", ["pending", "due_soon"])
      .order("next_due_date")
      .limit(5),
    supabase.from("sales_transactions")
      .select("id,date,quantity,total,customer:customers(name)")
      .eq("payment_status", "pending")
      .order("due_date")
      .limit(4),
  ])

  const lowStockFeeds = (feedTypes.data ?? []).filter(
    (f) => f.current_stock_kg <= f.min_stock_threshold
  )

  const totalRevenue = (monthlySales.data ?? []).reduce((s, r) => s + (r.total ?? 0), 0)
  const totalFeedCost = (monthlyFeedCost.data ?? []).reduce((s, r) => s + (r.feed_cost ?? 0), 0)
  const totalPayroll = (monthlyPayroll.data ?? []).reduce((s, r) => s + (r.net_pay ?? 0), 0)

  return {
    todayEggs: todayDuck.data?.eggs_total ?? null,
    todayReject: todayDuck.data?.eggs_reject ?? 0,
    lowStockFeeds,
    overdueSchedules: overdueSchedules.data ?? [],
    activeProjects: activeProjects.data ?? [],
    totalRevenue,
    totalFeedCost,
    totalPayroll,
    estimatedProfit: totalRevenue - totalFeedCost - totalPayroll,
    upcomingSchedules: upcomingSchedules.data ?? [],
    unpaidSales: unpaidSales.data ?? [],
  }
}

export default async function HomePage() {
  const data = await getDashboardData()

  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const alertCount = data.lowStockFeeds.length + data.overdueSchedules.length + data.unpaidSales.length

  return (
    <PageShell title="Beranda" description={today}>
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <div className="stagger-item">
          <StatCard
            title="Produksi Hari Ini"
            value={data.todayEggs !== null ? formatNumber(data.todayEggs - data.todayReject) : "—"}
            subtitle={data.todayEggs !== null ? `${data.todayReject} reject dari ${data.todayEggs}` : "Belum dicatat"}
            icon={Bird}
            variant="forest"
          />
        </div>
        <div className="stagger-item">
          <StatCard
            title="Stok Pakan"
            value={data.lowStockFeeds.length === 0 ? "Aman" : `${data.lowStockFeeds.length} rendah`}
            subtitle={data.lowStockFeeds.length === 0 ? "Semua stok cukup" : data.lowStockFeeds.map((f) => f.name).join(", ")}
            icon={Package}
            variant={data.lowStockFeeds.length > 0 ? "gold" : "default"}
          />
        </div>
        <div className="stagger-item">
          <StatCard
            title="Jadwal Overdue"
            value={data.overdueSchedules.length === 0 ? "0" : String(data.overdueSchedules.length)}
            subtitle={data.overdueSchedules.length === 0 ? "Semua jadwal terpenuhi" : "Perlu tindakan segera"}
            icon={Sprout}
            variant={data.overdueSchedules.length > 0 ? "gold" : "default"}
          />
        </div>
        <div className="stagger-item">
          <StatCard
            title="Proyek Aktif"
            value={String(data.activeProjects.length)}
            subtitle={data.activeProjects.length > 0 ? data.activeProjects[0].name : "Tidak ada proyek berjalan"}
            icon={HardHat}
            variant="default"
          />
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Alerts */}
        <Card className="surface-raised border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Peringatan & Tindakan
              {alertCount > 0 && (
                <Badge className="ml-auto bg-red-500 text-white text-xs">{alertCount}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {alertCount === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Tidak ada peringatan aktif</p>
            )}
            {data.lowStockFeeds.map((f) => (
              <Link key={f.name} href="/stok-pakan" className="flex items-start gap-2 text-sm p-2 rounded-lg bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors">
                <Package className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <span className="font-medium text-amber-900">Stok Rendah</span>
                  <p className="text-amber-700 text-xs">{f.name}: {formatNumber(f.current_stock_kg)} kg tersisa</p>
                </div>
              </Link>
            ))}
            {data.overdueSchedules.map((s: any, i) => (
              <Link key={i} href="/tanaman" className="flex items-start gap-2 text-sm p-2 rounded-lg bg-red-50 border border-red-200 hover:bg-red-100 transition-colors">
                <Sprout className="w-3.5 h-3.5 text-red-600 mt-0.5 shrink-0" />
                <div>
                  <span className="font-medium text-red-900">Jadwal Overdue</span>
                  <p className="text-red-700 text-xs">{s.plant?.name} (Blok {s.plant?.block}): {s.care_type}</p>
                </div>
              </Link>
            ))}
            {data.unpaidSales.map((s: any) => (
              <Link key={s.id} href="/bebek" className="flex items-start gap-2 text-sm p-2 rounded-lg bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors">
                <Users className="w-3.5 h-3.5 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <span className="font-medium text-blue-900">Pembayaran Tertunda</span>
                  <p className="text-blue-700 text-xs">{s.customer?.name}: {formatRupiah(s.total)}</p>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* Upcoming schedules */}
        <Card className="surface-raised">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-primary" />
              Jadwal Perawatan Mendatang
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.upcomingSchedules.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Tidak ada jadwal mendatang</p>
            )}
            {(data.upcomingSchedules as any[]).map((s, i) => (
              <div key={i} className="flex items-center justify-between text-sm py-1.5">
                <div>
                  <p className="font-medium text-foreground text-xs">{s.plant?.name}</p>
                  <p className="text-muted-foreground text-xs capitalize">{s.care_type} · Blok {s.plant?.block}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(s.next_due_date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Monthly summary */}
        <Card className="surface-raised">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Ringkasan Bulan Ini
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Pendapatan Penjualan", value: formatRupiah(data.totalRevenue), positive: true },
              { label: "Biaya Pakan", value: `− ${formatRupiah(data.totalFeedCost)}`, positive: false },
              { label: "Biaya Tenaga Kerja", value: `− ${formatRupiah(data.totalPayroll)}`, positive: false },
              { label: "Estimasi Laba", value: formatRupiah(data.estimatedProfit), positive: data.estimatedProfit >= 0 },
            ].map(({ label, value, positive }) => (
              <div key={label}>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <span className={`font-medium ${positive ? "text-emerald-700" : "text-foreground"}`}>{value}</span>
                </div>
                <Separator className="mt-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Module quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-4">
        {[
          { href: "/bebek", icon: Bird, label: "Bebek & Telur", color: "text-blue-600" },
          { href: "/tanaman", icon: Sprout, label: "Tanaman", color: "text-emerald-600" },
          { href: "/pembangunan", icon: HardHat, label: "Pembangunan", color: "text-orange-600" },
          { href: "/penggajian", icon: Users, label: "Penggajian", color: "text-purple-600" },
          { href: "/stok-pakan", icon: Package, label: "Stok Pakan", color: "text-amber-600" },
        ].map(({ href, icon: Icon, label, color }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-2 p-4 rounded-xl border bg-card hover:border-primary/25 transition-colors duration-150 text-center group pressable surface-raised"
          >
            <div className="w-10 h-10 rounded-xl bg-muted/70 flex items-center justify-center group-hover:bg-primary/8 transition-colors duration-150">
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <span className="text-xs font-medium text-foreground leading-tight">{label}</span>
          </Link>
        ))}
      </div>
    </PageShell>
  )
}
