import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

type Breadcrumb = {
  label: string
  href?: string
}

type PageShellProps = {
  title: string
  description?: string
  breadcrumbs?: Breadcrumb[]
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
    <div className={cn("flex flex-col gap-6 p-6 pb-10", className)}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-bold tracking-tight text-foreground"
            style={{ fontFamily: "var(--font-plus-jakarta)" }}
          >
            {title}
          </h1>
          {description && (
            <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {/* Content */}
      <div className="flex-1">{children}</div>
    </div>
  )
}
