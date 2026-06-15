"use client"

import type { DuckDaily } from "@/types"
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDateShort } from "@/lib/utils/format"

type Props = { data: DuckDaily[] }

export function ProductionChart({ data }: Props) {
  const chartData = [...data]
    .reverse()
    .slice(-30)
    .map((d) => ({
      date: formatDateShort(d.date),
      bersih: d.eggs_total - d.eggs_reject,
      reject: d.eggs_reject,
      total: d.eggs_total,
    }))

  if (chartData.length === 0) {
    return (
      <Card className="surface-raised">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Grafik Produksi (30 Hari)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-12">
            Belum ada data produksi
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="surface-raised">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Grafik Produksi (30 Hari Terakhir)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: 12,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="bersih" name="Telur Bersih" fill="#2d5c42" radius={[3, 3, 0, 0]} />
            <Bar dataKey="reject" name="Reject" fill="#f87171" radius={[3, 3, 0, 0]} />
            <Line
              type="monotone"
              dataKey="total"
              name="Total"
              stroke="#c9a227"
              strokeWidth={2}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
