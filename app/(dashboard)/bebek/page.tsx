import { PageShell } from "@/components/layout/PageShell"
import { StatCard } from "@/components/shared/StatCard"
import { DuckDailyForm } from "@/components/bebek/DuckDailyForm"
import { ProductionChart } from "@/components/bebek/ProductionChart"
import { SalesTable } from "@/components/bebek/SalesTable"
import { AddSaleDialog } from "@/components/bebek/AddSaleDialog"
import {
  getDuckDailyRecent,
  getSaltingLogs,
  getSalesTransactions,
  getCustomers,
  getHppConfig,
} from "./actions"
import { formatRupiah, formatNumber } from "@/lib/utils/format"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bird, Egg, FlaskConical, TrendingUp } from "lucide-react"
import { PdfExportButton } from "@/components/shared/PdfExportButton"

export const metadata = { title: "Bebek & Telur" }

const SALTING_STATUS: Record<string, { label: string; className: string }> = {
  in_process: { label: "Proses",    className: "bg-blue-100 text-blue-800 border-blue-200" },
  ready:      { label: "Siap",      className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  sold:       { label: "Terjual",   className: "bg-gray-100 text-gray-600 border-gray-200" },
}

export default async function BebekPage() {
  const [daily, saltingLogs, sales, customers, hpp] = await Promise.all([
    getDuckDailyRecent(30),
    getSaltingLogs(),
    getSalesTransactions(),
    getCustomers(),
    getHppConfig(),
  ])

  // Compute month-to-date stats
  const now = new Date()
  const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  const thisMonth = daily.filter((d) => d.date.startsWith(monthPrefix))

  const totalEggsThisMonth = thisMonth.reduce((s, d) => s + d.eggs_total, 0)
  const totalNetThisMonth = thisMonth.reduce((s, d) => s + d.eggs_total - d.eggs_reject, 0)
  const totalFeedCostThisMonth = thisMonth.reduce((s, d) => s + d.feed_cost, 0)

  const pendingRevenue = sales
    .filter((s) => s.payment_status !== "paid")
    .reduce((sum, s) => sum + s.total, 0)

  const activeSalting = saltingLogs.filter((s) => s.status === "in_process")
  const hppValue = hpp?.value ?? 0

  return (
    <PageShell
      title="Bebek & Telur"
      description="Produksi, pengasinan, dan penjualan telur bebek"
      actions={
        <div className="flex items-center gap-2">
          <PdfExportButton href={`/api/pdf/bebek?year=${new Date().getFullYear()}&month=${new Date().getMonth() + 1}`} label="Ekspor PDF" />
          <AddSaleDialog customers={customers} />
        </div>
      }
    >
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
        />
        <StatCard
          title="HPP Saat Ini"
          value={formatRupiah(hppValue)}
          subtitle="per butir"
          icon={Bird}
          variant="gold"
        />
      </div>

      <Tabs defaultValue="harian" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="harian">Input Harian</TabsTrigger>
          <TabsTrigger value="pengasinan">Pengasinan</TabsTrigger>
          <TabsTrigger value="penjualan">Penjualan</TabsTrigger>
          <TabsTrigger value="pelanggan">Pelanggan</TabsTrigger>
        </TabsList>

        {/* ─── Harian tab ─────────────────────────────────────── */}
        <TabsContent value="harian" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <DuckDailyForm />
            <div className="lg:col-span-2">
              <ProductionChart data={daily} />
            </div>
          </div>

          {/* Recent table */}
          <Card className="surface-raised">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">30 Hari Terakhir</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead className="text-right">Total Telur</TableHead>
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
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        Belum ada data
                      </TableCell>
                    </TableRow>
                  ) : (
                    daily.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="text-sm font-medium">{d.date}</TableCell>
                        <TableCell className="text-right text-sm">{d.eggs_total.toLocaleString("id-ID")}</TableCell>
                        <TableCell className="text-right text-sm text-red-600">{d.eggs_reject}</TableCell>
                        <TableCell className="text-right text-sm font-semibold text-emerald-700">
                          {(d.eggs_total - d.eggs_reject).toLocaleString("id-ID")}
                        </TableCell>
                        <TableCell className="text-right text-sm">{d.feed_consumed_kg}</TableCell>
                        <TableCell className="text-right text-sm">{formatRupiah(d.feed_cost)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
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
              <CardTitle className="text-base font-semibold">Log Pengasinan</CardTitle>
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
                          <TableCell className="text-right text-sm">{s.quantity.toLocaleString("id-ID")}</TableCell>
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
              <CardTitle className="text-base font-semibold">Transaksi Penjualan</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <SalesTable transactions={sales} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Pelanggan tab ───────────────────────────────────── */}
        <TabsContent value="pelanggan">
          <Card className="surface-raised">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Daftar Pelanggan</CardTitle>
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
                        <TableCell className="text-right text-sm">{formatRupiah(c.price_per_egg)}</TableCell>
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
