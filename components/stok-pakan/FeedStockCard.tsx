import type { FeedType } from "@/types"
import { formatRupiah, formatNumber } from "@/lib/utils/format"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Package, AlertTriangle } from "lucide-react"

type Props = { feedType: FeedType }

export function FeedStockCard({ feedType }: Props) {
  const pct = Math.min(
    100,
    Math.round((feedType.current_stock_kg / Math.max(feedType.min_stock_threshold, 1)) * 100)
  )
  const isLow = feedType.current_stock_kg <= feedType.min_stock_threshold
  const isEmpty = feedType.current_stock_kg <= 0

  return (
    <Card className={`surface-raised border transition-all ${isLow ? "border-red-300 bg-red-50/30" : ""}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isLow ? "bg-red-100" : "bg-primary/10"}`}>
              {isLow
                ? <AlertTriangle className="w-4 h-4 text-red-600" />
                : <Package className="w-4 h-4 text-primary" />
              }
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground">{feedType.name}</p>
              {feedType.supplier && (
                <p className="text-xs text-muted-foreground">{feedType.supplier}</p>
              )}
            </div>
          </div>
          {isEmpty
            ? <Badge variant="destructive">Habis</Badge>
            : isLow
            ? <Badge className="bg-amber-100 text-amber-800 border-amber-200">Stok Rendah</Badge>
            : <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Normal</Badge>
          }
        </div>

        <div className="space-y-1 mb-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Stok saat ini</span>
            <span className={`font-bold ${isLow ? "text-red-600" : "text-foreground"}`}>
              {formatNumber(feedType.current_stock_kg, 1)} kg
            </span>
          </div>
          <Progress
            value={pct}
            className={`h-2 ${isLow ? "[&>div]:bg-red-500" : "[&>div]:bg-emerald-500"}`}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Min: {formatNumber(feedType.min_stock_threshold)} kg</span>
            <span>{pct}% dari batas minimum</span>
          </div>
        </div>

        <div className="pt-3 border-t border-border">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Harga terakhir</span>
            <span className="font-medium">{formatRupiah(feedType.price_per_kg)}/kg</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
