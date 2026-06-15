import { PageShell } from "@/components/layout/PageShell"
import { StatCard } from "@/components/shared/StatCard"
import { getProjects } from "./actions"
import { formatRupiah } from "@/lib/utils/format"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { AddProjectDialog } from "@/components/pembangunan/AddProjectDialog"
import { HardHat, Wrench, CheckCircle2, PauseCircle } from "lucide-react"

export const metadata = { title: "Pembangunan" }

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  planning:    { label: "Perencanaan", className: "bg-blue-100 text-blue-800",    icon: <Wrench className="w-3 h-3" /> },
  in_progress: { label: "Berjalan",    className: "bg-amber-100 text-amber-800",  icon: <HardHat className="w-3 h-3" /> },
  on_hold:     { label: "Ditunda",     className: "bg-gray-100 text-gray-700",    icon: <PauseCircle className="w-3 h-3" /> },
  completed:   { label: "Selesai",     className: "bg-emerald-100 text-emerald-800", icon: <CheckCircle2 className="w-3 h-3" /> },
}

export default async function PembangunanPage() {
  const projects = await getProjects()

  const active = projects.filter((p) => p.status === "in_progress")
  const totalBudget = projects.reduce((s: number, p: any) => s + (p.budget ?? 0), 0)
  const totalSpent = projects.reduce((s: number, p: any) => s + (p.actual_total ?? 0), 0)

  return (
    <PageShell
      title="Pembangunan"
      description="Proyek konstruksi, milestone, dan anggaran"
      actions={<AddProjectDialog />}
    >
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Proyek Aktif" value={active.length} subtitle="sedang berjalan" icon={HardHat} variant="forest" />
        <StatCard title="Total Proyek" value={projects.length} subtitle="semua status" icon={Wrench} />
        <StatCard title="Total Anggaran" value={formatRupiah(totalBudget)} subtitle="semua proyek" icon={HardHat} />
        <StatCard title="Total Realisasi" value={formatRupiah(totalSpent)} subtitle="sudah dikeluarkan" icon={CheckCircle2} variant="gold" />
      </div>

      {/* Project cards */}
      {projects.length === 0 ? (
        <Card className="surface-raised">
          <CardContent className="py-16 text-center">
            <HardHat className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">Belum ada proyek. Tambah proyek baru untuk memulai.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {projects.map((p: any) => {
            const cfg = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.planning
            const milestonePct = p.milestone_count > 0
              ? Math.round((p.milestones_done / p.milestone_count) * 100)
              : 0
            const budgetPct = p.budget > 0
              ? Math.min(100, Math.round((p.actual_total / p.budget) * 100))
              : 0
            const isOver = p.actual_total > p.budget

            return (
              <Card key={p.id} className="surface-raised">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-foreground">{p.name}</h3>
                      {p.location && (
                        <p className="text-xs text-muted-foreground mt-0.5">{p.location}</p>
                      )}
                    </div>
                    <Badge className={`${cfg.className} flex items-center gap-1 flex-shrink-0`}>
                      {cfg.icon} {cfg.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Milestone progress */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Progress Milestone</span>
                      <span className="font-medium">{p.milestones_done}/{p.milestone_count} selesai</span>
                    </div>
                    <Progress value={milestonePct} className="h-2 [&>div]:bg-primary" />
                  </div>

                  {/* Budget vs actual */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Realisasi Anggaran</span>
                      <span className={`font-medium ${isOver ? "text-red-600" : ""}`}>
                        {budgetPct}% {isOver ? "⚠ Over Budget" : ""}
                      </span>
                    </div>
                    <Progress
                      value={budgetPct}
                      className={`h-2 ${isOver ? "[&>div]:bg-red-500" : "[&>div]:bg-emerald-500"}`}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Realisasi: {formatRupiah(p.actual_total ?? 0)}</span>
                      <span>Anggaran: {formatRupiah(p.budget ?? 0)}</span>
                    </div>
                  </div>

                  {/* Budget breakdown */}
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    {[
                      { label: "Material", value: p.actual_materials ?? 0 },
                      { label: "Tenaga Kerja", value: p.actual_labor ?? 0 },
                      { label: "Sisa Anggaran", value: p.budget_remaining ?? 0 },
                    ].map(({ label, value }) => (
                      <div key={label} className="text-center p-2 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <p className={`text-xs font-semibold mt-0.5 ${value < 0 ? "text-red-600" : "text-foreground"}`}>
                          {formatRupiah(value)}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </PageShell>
  )
}
