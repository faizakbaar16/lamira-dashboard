import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown } from "lucide-react"

type StatCardProps = {
  title: string
  value: string | number
  subtitle?: string
  icon?: LucideIcon
  trend?: { value: number; label: string }
  variant?: "default" | "forest" | "gold"
  className?: string
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = "default",
  className,
}: StatCardProps) {
  const isForest = variant === "forest"
  const isGold = variant === "gold"

  return (
    <Card
      className={cn(
        "relative overflow-hidden border card-hover surface-raised cursor-default select-none",
        isForest && "border-[#2d5c42] text-white",
        isGold && "border-[#b8911f] text-[#1a3a2a]",
        !isForest && !isGold && "bg-card",
        className
      )}
      style={
        isForest
          ? { background: "linear-gradient(145deg, #1a3a2a 0%, #2d5c42 100%)" }
          : isGold
          ? { background: "linear-gradient(145deg, #c9a227 0%, #e8bc2d 60%, #c9a227 100%)" }
          : undefined
      }
    >
      {/* Subtle noise texture for depth */}
      {(isForest || isGold) && (
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          }}
        />
      )}

      <CardContent className="p-5 relative z-10">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p
              className={cn(
                "text-[10px] font-semibold uppercase tracking-widest truncate",
                isForest && "text-white/50",
                isGold && "text-[#1a3a2a]/60",
                !isForest && !isGold && "text-muted-foreground"
              )}
            >
              {title}
            </p>
            <p
              className={cn(
                "text-2xl font-bold mt-1.5 leading-none tabular-nums",
                isForest && "text-[#c9a227]",
                isGold && "text-[#1a3a2a]",
                !isForest && !isGold && "text-foreground"
              )}
            >
              {value}
            </p>
            {subtitle && (
              <p
                className={cn(
                  "text-xs mt-1.5 leading-snug",
                  isForest && "text-white/45",
                  isGold && "text-[#1a3a2a]/55",
                  !isForest && !isGold && "text-muted-foreground"
                )}
              >
                {subtitle}
              </p>
            )}
            {trend && (
              <div
                className={cn(
                  "inline-flex items-center gap-1 mt-2.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-md",
                  trend.value >= 0
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-red-50 text-red-600",
                  isForest &&
                    (trend.value >= 0
                      ? "bg-white/10 text-emerald-300"
                      : "bg-white/10 text-red-400"),
                  isGold && "bg-[#1a3a2a]/12 text-[#1a3a2a]/80"
                )}
              >
                {trend.value >= 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                <span>
                  {trend.value >= 0 ? "+" : ""}
                  {trend.value}% {trend.label}
                </span>
              </div>
            )}
          </div>

          {Icon && (
            <div
              className={cn(
                "flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-200",
                isForest && "bg-white/10",
                isGold && "bg-[#1a3a2a]/15",
                !isForest && !isGold && "bg-primary/8 ring-1 ring-primary/10"
              )}
            >
              <Icon
                className={cn(
                  "w-[18px] h-[18px]",
                  isForest && "text-[#c9a227]",
                  isGold && "text-[#1a3a2a]",
                  !isForest && !isGold && "text-primary"
                )}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
