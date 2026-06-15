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
        "surface-raised border transition-shadow hover:surface-elevated",
        isForest && "bg-[#1a3a2a] border-[#2d5c42] text-white",
        isGold && "bg-[#c9a227] border-[#b8911f] text-[#1a3a2a]",
        className
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p
              className={cn(
                "text-xs font-medium uppercase tracking-wider truncate",
                isForest && "text-white/60",
                isGold && "text-[#1a3a2a]/70",
                !isForest && !isGold && "text-muted-foreground"
              )}
            >
              {title}
            </p>
            <p
              className={cn(
                "text-2xl font-bold mt-1 leading-none",
                isForest && "text-[#c9a227]",
                isGold && "text-[#1a3a2a]",
                !isForest && !isGold && "text-foreground"
              )}
              style={{ fontFamily: "var(--font-plus-jakarta)" }}
            >
              {value}
            </p>
            {subtitle && (
              <p
                className={cn(
                  "text-xs mt-1.5",
                  isForest && "text-white/50",
                  isGold && "text-[#1a3a2a]/60",
                  !isForest && !isGold && "text-muted-foreground"
                )}
              >
                {subtitle}
              </p>
            )}
            {trend && (
              <div
                className={cn(
                  "flex items-center gap-1 mt-2 text-xs font-medium",
                  trend.value >= 0 ? "text-emerald-500" : "text-red-500",
                  isForest && trend.value >= 0 && "text-emerald-400",
                  isGold && "text-[#1a3a2a]/80"
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
                "flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center",
                isForest && "bg-white/10",
                isGold && "bg-[#1a3a2a]/15",
                !isForest && !isGold && "bg-primary/10"
              )}
            >
              <Icon
                className={cn(
                  "w-5 h-5",
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
