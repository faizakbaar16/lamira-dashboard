import { PageShell } from "@/components/layout/PageShell"
import { getPlants, getWorkLogs, getCareSchedules, refreshScheduleStatuses } from "./actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AddWorkLogDialog } from "@/components/tanaman/AddWorkLogDialog"
import { Sprout, TreePine, CalendarClock, AlertTriangle } from "lucide-react"
import { StatCard } from "@/components/shared/StatCard"
import type { PlantBlock } from "@/types"

export const metadata = { title: "Tanaman" }

const BLOCK_INFO: Record<PlantBlock, { label: string; color: string }> = {
  A: { label: "Blok A — Mangga",     color: "bg-emerald-100 text-emerald-800" },
  B: { label: "Blok B — Durian",     color: "bg-yellow-100 text-yellow-800" },
  C: { label: "Blok C — Lemon",      color: "bg-lime-100 text-lime-800" },
  D: { label: "Blok D — Kelapa",     color: "bg-amber-100 text-amber-800" },
  E: { label: "Blok E — Jeruk Bali", color: "bg-orange-100 text-orange-800" },
  F: { label: "Blok F — Sawo",       color: "bg-red-100 text-red-800" },
  G: { label: "Blok G — Pete",       color: "bg-teal-100 text-teal-800" },
}

const STATUS_SCHEDULE: Record<string, { label: string; className: string }> = {
  upcoming:  { label: "Mendatang",   className: "bg-blue-100 text-blue-800" },
  due_today: { label: "Hari Ini",    className: "bg-amber-100 text-amber-800" },
  overdue:   { label: "Terlambat",   className: "bg-red-100 text-red-800" },
}

const WORK_LABELS: Record<string, string> = {
  pemupukan: "Pemupukan", penyemprotan: "Penyemprotan",
  pemangkasan: "Pemangkasan", penyiraman: "Penyiraman",
  panen: "Panen", penanaman_baru: "Penanaman Baru",
  inspeksi: "Inspeksi", lainnya: "Lainnya",
}

export default async function TanamanPage() {
  await refreshScheduleStatuses()
  const [plants, workLogs, schedules] = await Promise.all([
    getPlants(), getWorkLogs(), getCareSchedules(),
  ])

  const overdueCount = schedules.filter((s) => s.status === "overdue").length
  const dueTodayCount = schedules.filter((s) => s.status === "due_today").length
  const totalPlants = plants.reduce((s, p) => s + p.quantity, 0)

  // Group plants by block
  const byBlock = plants.reduce<Record<string, typeof plants>>((acc, p) => {
    if (!acc[p.block]) acc[p.block] = []
    acc[p.block].push(p)
    return acc
  }, {})

  return (
    <PageShell
      title="Tanaman"
      description="Inventaris tanaman, jadwal perawatan, dan log pekerjaan"
      actions={<AddWorkLogDialog plants={plants} />}
    >
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Tanaman" value={totalPlants.toLocaleString("id-ID")} subtitle={`${plants.length} varietas`} icon={TreePine} variant="forest" />
        <StatCard title="Blok Aktif" value="7 blok" subtitle="A – G" icon={Sprout} />
        <StatCard title="Jadwal Hari Ini" value={dueTodayCount} subtitle="perlu dikerjakan" icon={CalendarClock} />
        <StatCard title="Jadwal Terlambat" value={overdueCount} subtitle="segera tangani" icon={AlertTriangle} variant={overdueCount > 0 ? "gold" : "default"} />
      </div>

      <Tabs defaultValue="inventaris" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="inventaris">Inventaris</TabsTrigger>
          <TabsTrigger value="jadwal">
            Jadwal Perawatan
            {overdueCount > 0 && (
              <span className="ml-2 px-1.5 py-0.5 rounded-full text-xs bg-red-500 text-white">{overdueCount}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="log">Log Pekerjaan</TabsTrigger>
        </TabsList>

        {/* ─── Inventaris ─────────────────────────────────────── */}
        <TabsContent value="inventaris">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {(Object.keys(BLOCK_INFO) as PlantBlock[]).map((block) => {
              const blockPlants = byBlock[block] ?? []
              const totalQty = blockPlants.reduce((s, p) => s + p.quantity, 0)
              const info = BLOCK_INFO[block]
              return (
                <Card key={block} className="surface-raised">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <Badge className={info.color}>{info.label}</Badge>
                      <span className="text-lg font-bold text-foreground" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
                        {totalQty.toLocaleString("id-ID")}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-1.5">
                    {blockPlants.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Tidak ada data</p>
                    ) : (
                      blockPlants.map((p) => (
                        <div key={p.id} className="flex justify-between items-center text-xs">
                          <span className="text-muted-foreground">
                            {p.species}{p.variety ? ` (${p.variety})` : ""}
                          </span>
                          <span className="font-medium">{p.quantity.toLocaleString("id-ID")} pohon</span>
                        </div>
                      ))
                    )}
                    {blockPlants[0]?.planting_year && (
                      <p className="text-xs text-muted-foreground pt-1 border-t border-border">
                        Tanam: {blockPlants[0].planting_year}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* ─── Jadwal ─────────────────────────────────────────── */}
        <TabsContent value="jadwal">
          <Card className="surface-raised">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Jadwal Perawatan Aktif</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanaman</TableHead>
                    <TableHead>Blok</TableHead>
                    <TableHead>Jenis Pekerjaan</TableHead>
                    <TableHead>Terakhir Dikerjakan</TableHead>
                    <TableHead>Jatuh Tempo</TableHead>
                    <TableHead>Frekuensi</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedules.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        Tidak ada jadwal aktif
                      </TableCell>
                    </TableRow>
                  ) : (
                    schedules.map((s) => {
                      const badge = STATUS_SCHEDULE[s.status] ?? STATUS_SCHEDULE.upcoming
                      return (
                        <TableRow key={s.id}>
                          <TableCell className="text-sm font-medium">{s.plant?.species ?? "—"}</TableCell>
                          <TableCell>
                            <Badge variant="outline">Blok {s.plant?.block}</Badge>
                          </TableCell>
                          <TableCell className="text-sm">{WORK_LABELS[s.work_type] ?? s.work_type}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{s.last_done ?? "Belum pernah"}</TableCell>
                          <TableCell className="text-sm font-medium">{s.next_due}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">Setiap {s.frequency_days} hari</TableCell>
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

        {/* ─── Log Pekerjaan ──────────────────────────────────── */}
        <TabsContent value="log">
          <Card className="surface-raised">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Log Pekerjaan (50 Terakhir)</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Tanaman</TableHead>
                    <TableHead>Blok</TableHead>
                    <TableHead>Jenis Pekerjaan</TableHead>
                    <TableHead>Pekerja</TableHead>
                    <TableHead>Catatan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        Belum ada log pekerjaan
                      </TableCell>
                    </TableRow>
                  ) : (
                    workLogs.map((l) => (
                      <TableRow key={l.id}>
                        <TableCell className="text-sm">{l.date}</TableCell>
                        <TableCell className="text-sm font-medium">{l.plant?.species ?? "—"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">Blok {l.plant?.block}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">{WORK_LABELS[l.work_type] ?? l.work_type}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{l.worker_names.join(", ") || "—"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{l.notes ?? "—"}</TableCell>
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
