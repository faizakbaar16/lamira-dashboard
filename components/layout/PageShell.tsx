import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

type PageShellProps = {
  title: string
  description?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
}

export function PageShell({
  title,
  description,
  actions,
  children,
  className,
}: PageShellProps) {
  return (
    <div className={cn("flex flex-col min-h-full", className)}>
      {/* Page header */}
      <header className="flex items-start justify-between gap-4 px-6 pt-6 pb-5">
        <div className="page-enter">
          <h1 className="text-[22px] font-bold tracking-tight text-foreground leading-tight">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 flex-shrink-0 pt-0.5 page-enter">
            {actions}
          </div>
        )}
      </header>

      {/* Divider */}
      <div className="mx-6 h-px bg-border/60" />

      {/* Content */}
      <main className="flex-1 px-6 py-5 pb-10">{children}</main>
    </div>
  )
}
