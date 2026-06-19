import { PageShell } from "@/components/layout/PageShell"
import { StatCard } from "@/components/shared/StatCard"
import { ProductionChart } from "@/components/bebek/ProductionChart"
import { SalesTable } from "@/components/bebek/SalesTable"
import { AddSaleDialog } from "@/components/bebek/AddSaleDialog"
import { AddDailyLogDialog } from "@/components/bebek/AddDailyLogDialog"
import { AddHealthDialog } from "@/components/bebek/AddHealthDialog"
import {
  getDuckBatches,
  getDuckDailyRecent,
  getDuckDailyForChart,
  getDuckHealthRecords,
  getSaltingLogs,
  getSalesTransactions,
  getCustomers,
  getHppConfig,
} from "./actions"
import { createClient } from "@/lib/supabase/server"
import { formatRupiah, formatNumber } from "@/lib/utils/format"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bird, Egg, FlaskConical, TrendingUp, Syringe } from "lucide-react"
import { PdfExportButton } from "@/components/shared/PdfExportButton"
import type { FeedType } from "@/types"

export const metadata = { title: "Bebek & Telur" }

const SALTING_STATUS: Record<string, { label: string; className: string }> = {
  in_process: { label: "Proses",  className: "bg-blue-100 text-blue-800 border-blue-200" },
  ready:      { label: "Siap",    className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  sold:       { label: "Terjual", className: "bg-gray-100 text-gray-600 border-gray-200" },
}

const HEALTH_TYPE: Record<string, string> = {
  obat:    "bg-red-100 text-red-800",
  vitamin: "bg-emerald-100 text-emerald-800",
  vaksin:  "bg-blue-100 text-blue-800",
  lainnya: "bg-gray-100 text-gray-700",
}

export default async function BebekPage() {
  const supabase = await createClient()
  const [batches, daily, chartData, healthRecords, saltingLogs, sales, customers, hpp, feedTypesRes] = await Promise.all([
    getDuckBatches(),
    getDuckDailyRecent(60),
    getDuckDailyForChart(365),
    getDuckHealthRecords(),
    getSaltingLogs(),
    getSalesTransactions(),
    getCustomers(),
    getHppConfig(),
    supabase.from("feed_types").select("*").order("name"),
  ])

  const feedTypes: FeedType[] = (feedTypesRes.data ?? []) as FeedType[]

  const now = new Date()
  const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  const thisMonth = daily.filter((d) => d.date.startsWith(monthPrefix))

  const totalEggsThisMonth = thisMonth.reduce((s, d) => s + d.eggs_total, 0)
  const totalNetThisMonth  = thisMonth.reduce((s, d) => s + d.eggs_total - d.eggs_reject, 0)

  const pendingRevenue = sales
    .filter((s) => s.payment_status !== "paid")
    .reduce((sum, s) => sum + s.total, 0)

  const activeSalting = saltingLogs.filter((s) => s.status === "in_process")
  const hppValue = hpp?.value ?? 0

  // Batch summary for today
  const today = now.toISOString().split("T")[0]
  const todayLogs = daily.filter((d) => d.date === today)

  return (
    <PageShell
      title="Bebek & Telur"
      description="Produksi, pengasinan, dan penjualan telur bebek"
      actions={
        <div className="flex items-center gap-2 flex-wrap">
          <PdfExportButton href={`/api/pdf/bebek?year=${now.getFullYear()}&month=${now.getMonth() + 1}`} label="Ekspor PDF" />
          <AddHealthDialog batches={batches} />
          <AddDailyLogDialog batches={batches} feedTypes={feedTypes} />
          <AddSaleDialog customers={customers} />
        </div>
      }
    >
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <StatCard
          title="Produksi Bulan Ini"
          value={formatNumber(totalEggsThisMonth)}
          subtitle={`${formatNumber(totalNetThisMonth)} bersih`}
          icon={Egg}
          variant="forest"
        />
        <StatCard
          title="Proses Pengasinan"
          value={`${activeSalting.length} batch`}
          subtitle={`${activeSalting.reduce((s, b) => s + b.quantity, 0)} butir`}
          icon={FlaskConical}
        />
        <StatCard
          title="Piutang Belum Lunas"
          value={formatRupiah(pendingRevenue)}
          subtitle="Pending + overdue"
          icon={TrendingUp}
          variant={pendingRevenue > 0 ? "gold" : "default"}
        />
        <StatCard
          title="HPP / Butir"
          value={formatRupiah(hppValue)}
          subtitle="Harga pokok produksi"
          icon={Bird}
        />
      </div>

      {/* Batch status strip */}
      {batches.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-5">
          {batches.map((b) => {
            const log = todayLogs.find((d) => d.batch_id === b.id)
            const pct = log && b.population > 0
              ? Math.round((log.eggs_total / b.population) * 100)
              : null
            return (
              <div key={b.id} className="rounded-xl border bg-card p-3 text-center surface-raised">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{b.code}</p>
                <p className="text-lg font-bold text-foreground mt-0.5 tabular-nums">
                  {log ? formatNumber(log.eggs_total) : "—"}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {pct !== null ? `${pct}%` : `${b.population} ekor`}
                </p>
              </div>
            )
          })}
        </div>
      )}

      <Tabs defaultValue="chart" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="chart">Grafik</TabsTrigger>
          <TabsTrigger value="harian">Log Harian</TabsTrigger>
          <TabsTrigger value="pengasinan">Pengasinan</TabsTrigger>
          <TabsTrigger value="penjualan">Penjualan</TabsTrigger>
          <TabsTrigger value="kesehatan">Kesehatan</TabsTrigger>
          <TabsTrigger value="pelanggan">Pelanggan</TabsTrigger>
        </TabsList>

        {/* ─── Chart tab ──────────────────────────────────────── */}
        <TabsContent value="chart">
          <ProductionChart data={chartData} />
        </TabsContent>

        {/* ─── Harian tab ─────────────────────────────────────── */}
        <TabsContent value="harian">
          <Card className="surface-raised">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Log Harian Per Kandang</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Kandang</TableHead>
                    <TableHead className="text-right">Telur</TableHead>
                    <TableHead className="text-right">Reject</TableHead>
                    <TableHead className="text-right">Bersih</TableHead>
                    <TableHead className="text-right">Pakan (kg)</TableHead>
                    <TableHead className="text-right">Biaya Pakan</TableHead>
                    <TableHead>Catatan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {daily.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                        Belum ada data
                      </TableCell>
                    </TableRow>
                  ) : (
                    daily.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="text-sm font-medium">{d.date}</TableCell>
                        <TableCell className="text-sm">
                          <span className="font-medium">{(d.batch as any)?.code ?? "—"}</span>
                        </TableCell>
                        <TableCell className="text-right text-sm tabular-nums">{formatNumber(d.eggs_total)}</TableCell>
                        <TableCell className="text-right text-sm text-red-600 tabular-nums">{d.eggs_reject}</TableCell>
                        <TableCell className="text-right text-sm font-semibold text-emerald-700 tabular-nums">
                          {formatNumber(d.eggs_total - d.eggs_reject)}
                        </TableCell>
                        <TableCell className="text-right text-sm tabular-nums">{d.feed_consumed_kg}</TableCell>
                        <TableCell className="text-right text-sm tabular-nums">{formatRupiah(d.feed_cost)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[160px] truncate">
                          {d.notes ?? "—"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Pengasinan tab ──────────────────────────────────── */}
        <TabsContent value="pengasinan">
          <Card className="surface-raised">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Log Pengasinan</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal Asin</TableHead>
                    <TableHead className="text-right">Jumlah</TableHead>
                    <TableHead>Pekerja</TableHead>
                    <TableHead>Lokasi</TableHead>
                    <TableHead>Siap Tanggal</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {saltingLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        Belum ada data pengasinan
                      </TableCell>
                    </TableRow>
                  ) : (
                    saltingLogs.map((s) => {
                      const badge = SALTING_STATUS[s.status] ?? SALTING_STATUS.in_process
                      return (
                        <TableRow key={s.id}>
                          <TableCell className="text-sm">{s.date_salted}</TableCell>
                          <TableCell className="text-right text-sm tabular-nums">{formatNumber(s.quantity)}</TableCell>
                          <TableCell className="text-sm">{s.worker_names.join(", ") || "—"}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{s.storage_location ?? "—"}</TableCell>
                          <TableCell className="text-sm">{s.expected_ready_date}</TableCell>
                          <TableCell>
                            <Badge className={badge.className}>{badge.label}</Badge>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Penjualan tab ───────────────────────────────────── */}
        <TabsContent value="penjualan">
          <Card className="surface-raised">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Transaksi Penjualan</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <SalesTable transactions={sales} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Kesehatan tab ───────────────────────────────────── */}
        <TabsContent value="kesehatan">
          <Card className="surface-raised">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Syringe className="w-4 h-4 text-primary" />
                  Riwayat Obat & Vitamin
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Kandang</TableHead>
                    <TableHead>Jenis</TableHead>
                    <TableHead>Produk</TableHead>
                    <TableHead>Dosis</TableHead>
                    <TableHead className="text-right">Biaya</TableHead>
                    <TableHead>Catatan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {healthRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        Belum ada catatan kesehatan
                      </TableCell>
                    </TableRow>
                  ) : (
                    healthRecords.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="text-sm">{r.date}</TableCell>
                        <TableCell className="text-sm font-medium">
                          {(r.batch as any)?.code ?? "Semua"}
                        </TableCell>
                        <TableCell>
                          <Badge className={HEALTH_TYPE[r.record_type] ?? ""}>{r.record_type}</Badge>
                        </TableCell>
                        <TableCell className="text-sm font-medium">{r.product_name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{r.dosage ?? "—"}</TableCell>
                        <TableCell className="text-right text-sm tabular-nums">{formatRupiah(r.total_cost)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">
                          {r.notes ?? "—"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Pelanggan tab ───────────────────────────────────── */}
        <TabsContent value="pelanggan">
          <Card className="surface-raised">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Daftar Pelanggan</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Kontak</TableHead>
                    <TableHead className="text-right">Harga/Butir</TableHead>
                    <TableHead>Pembayaran</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        Belum ada pelanggan
                      </TableCell>
                    </TableRow>
                  ) : (
                    customers.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="text-sm font-medium">{c.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{c.contact ?? "—"}</TableCell>
                        <TableCell className="text-right text-sm tabular-nums">{formatRupiah(c.price_per_egg)}</TableCell>
                        <TableCell className="text-sm uppercase">{c.payment_terms}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageShell>
  )
}
