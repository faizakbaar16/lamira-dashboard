"use client"

import { useState, useMemo } from "react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3 } from "lucide-react"

type RawRecord = {
  date: string
  batch_code: string
  eggs_total: number
  productivity_pct: number
}

type Props = { data: RawRecord[] }

const RANGES = [
  { label: "7H", days: 7 },
  { label: "1B", days: 30 },
  { label: "3B", days: 90 },
  { label: "6B", days: 180 },
  { label: "1T", days: 365 },
] as const

const BATCH_COLORS: Record<string, string> = {
  P1:    "#1a3a2a",
  P2:    "#2d5c42",
  P3_K1: "#c9a227",
  P3_K2: "#e8a000",
  P3_K3: "#8b6914",
  P3_K4: "#5a8a6a",
}

type ViewMode = "total" | "per_batch" | "productivity"

export function ProductionChart({ data }: Props) {
  const [rangeDays, setRangeDays] = useState(30)
  const [viewMode, setViewMode] = useState<ViewMode>("total")

  const batches = useMemo(() => [...new Set(data.map((r) => r.batch_code))].sort(), [data])

  const cutoff = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() - rangeDays)
    return d.toISOString().split("T")[0]
  }, [rangeDays])

  const chartData = useMemo(() => {
    const byDate = new Map<string, Record<string, number | string>>()
    for (const r of data) {
      if (r.date < cutoff) continue
      if (!byDate.has(r.date)) byDate.set(r.date, { date: r.date })
      const row = byDate.get(r.date)!
      row[r.batch_code] = (Number(row[r.batch_code]) || 0) + r.eggs_total
      row[`${r.batch_code}_pct`] = r.productivity_pct
      row["total"] = (Number(row["total"]) || 0) + r.eggs_total
    }
    return [...byDate.values()].sort((a, b) => String(a.date) < String(b.date) ? -1 : 1)
  }, [data, cutoff])

  const xFormatter = (date: string) => {
    const d = new Date(date + "T00:00:00")
    if (rangeDays <= 30) return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" })
    return d.toLocaleDateString("id-ID", { month: "short", year: "2-digit" })
  }

  if (data.length === 0) {
    return (
      <Card className="surface-raised">
        <CardContent className="flex items-center justify-center h-48">
          <p className="text-sm text-muted-foreground">Belum ada data produksi</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="surface-raised">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            Grafik Produksi Telur
          </CardTitle>
          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="flex rounded-lg border text-xs overflow-hidden">
              {(["total", "per_batch", "productivity"] as ViewMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setViewMode(m)}
                  className={`px-2.5 py-1 transition-colors ${viewMode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
                >
                  {m === "total" ? "Total" : m === "per_batch" ? "Per Kandang" : "Produktifitas"}
                </button>
              ))}
            </div>
            <div className="flex rounded-lg border text-xs overflow-hidden">
              {RANGES.map(({ label, days }) => (
                <button
                  key={days}
                  onClick={() => setRangeDays(days)}
                  className={`px-2.5 py-1 transition-colors ${rangeDays === days ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              {batches.map((b) => (
                <linearGradient key={b} id={`grad_${b}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={BATCH_COLORS[b] ?? "#888"} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={BATCH_COLORS[b] ?? "#888"} stopOpacity={0.02} />
                </linearGradient>
              ))}
              <linearGradient id="grad_total" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1a3a2a" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#1a3a2a" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
            <XAxis
              dataKey="date"
              tickFormatter={xFormatter}
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              tickLine={false}
              axisLine={false}
              unit={viewMode === "productivity" ? "%" : ""}
            />
            <Tooltip
              contentStyle={{
                fontSize: 11,
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--card)",
                color: "var(--foreground)",
              }}
              labelFormatter={(v) =>
                new Date(String(v) + "T00:00:00").toLocaleDateString("id-ID", {
                  weekday: "short", day: "numeric", month: "long",
                })
              }
              formatter={(value: unknown, name: unknown) => {
                const numVal = Number(value)
                const isPercent = String(name).endsWith("_pct")
                return [
                  `${numVal.toLocaleString("id-ID")}${isPercent ? "%" : " butir"}`,
                  String(name).replace("_pct", " (%)"),
                ]
              }}
            />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />

            {viewMode === "total" && (
              <Area
                type="monotone"
                dataKey="total"
                name="Total"
                stroke="#1a3a2a"
                fill="url(#grad_total)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            )}

            {viewMode === "per_batch" && batches.map((b) => (
              <Area
                key={b}
                type="monotone"
                dataKey={b}
                name={b}
                stroke={BATCH_COLORS[b] ?? "#888"}
                fill={`url(#grad_${b})`}
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 3 }}
              />
            ))}

            {viewMode === "productivity" && batches.map((b) => (
              <Area
                key={b}
                type="monotone"
                dataKey={`${b}_pct`}
                name={b}
                stroke={BATCH_COLORS[b] ?? "#888"}
                fill={`url(#grad_${b})`}
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 3 }}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
