"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Bird,
  Sprout,
  HardHat,
  Users,
  Package,
  LayoutDashboard,
  Settings,
  LogOut,
  Leaf,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"

const NAV_ITEMS = [
  { href: "/", icon: LayoutDashboard, label: "Beranda", exact: true },
  { href: "/bebek", icon: Bird, label: "Bebek & Telur" },
  { href: "/tanaman", icon: Sprout, label: "Tanaman" },
  { href: "/pembangunan", icon: HardHat, label: "Pembangunan" },
  { href: "/penggajian", icon: Users, label: "Penggajian" },
  { href: "/stok-pakan", icon: Package, label: "Stok Pakan" },
]

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href
  return pathname === href || pathname.startsWith(href + "/")
}

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success("Berhasil keluar")
    router.push("/login")
  }

  return (
    <aside
      className="fixed left-0 top-0 h-full w-16 flex flex-col items-center py-4 gap-1 z-50"
      style={{
        background: "linear-gradient(180deg, #1a3a2a 0%, #162e22 100%)",
        borderRight: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Logo mark */}
      <Link
        href="/"
        className="mb-4 flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 pressable"
        style={{
          background: "rgba(201, 162, 39, 0.15)",
          border: "1px solid rgba(201, 162, 39, 0.25)",
          boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
        }}
        aria-label="Kebun Lamira"
      >
        <Leaf className="w-5 h-5 text-[#c9a227]" />
      </Link>

      <div className="w-8 h-px mb-2" style={{ background: "rgba(255,255,255,0.08)" }} />

      {/* Main nav */}
      <nav className="flex flex-col items-center gap-0.5 flex-1">
        {NAV_ITEMS.map(({ href, icon: Icon, label, exact }) => {
          const active = isActive(pathname, href, exact)
          return (
            <Tooltip key={href}>
              <TooltipTrigger
                className={cn(
                  "relative flex items-center justify-center w-10 h-10 rounded-xl",
                  "transition-all duration-200 cursor-pointer outline-none",
                  "focus-visible:ring-2 focus-visible:ring-[#c9a227]/60",
                  active
                    ? "bg-[#c9a227] text-[#1a3a2a] shadow-md"
                    : "text-white/45 hover:text-white/90 hover:bg-white/8"
                )}
                style={
                  active
                    ? { boxShadow: "0 2px 8px rgba(201,162,39,0.35)" }
                    : undefined
                }
                render={
                  <Link href={href}>
                    <Icon className={cn("w-[18px] h-[18px]", active && "drop-shadow-sm")} />
                  </Link>
                }
              />
              <TooltipContent side="right" className="font-medium text-xs">
                {label}
              </TooltipContent>
            </Tooltip>
          )
        })}
      </nav>

      {/* Bottom actions */}
      <div className="flex flex-col items-center gap-0.5 mt-auto">
        <div className="w-8 h-px mb-1" style={{ background: "rgba(255,255,255,0.08)" }} />

        <Tooltip>
          <TooltipTrigger
            className={cn(
              "flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 cursor-pointer",
              "focus-visible:ring-2 focus-visible:ring-[#c9a227]/60 outline-none",
              isActive(pathname, "/pengaturan")
                ? "bg-[#c9a227] text-[#1a3a2a]"
                : "text-white/45 hover:text-white/90 hover:bg-white/8"
            )}
            render={
              <Link href="/pengaturan">
                <Settings className="w-[18px] h-[18px]" />
              </Link>
            }
          />
          <TooltipContent side="right" className="text-xs">Pengaturan</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger
            onClick={handleLogout}
            className={cn(
              "flex items-center justify-center w-10 h-10 rounded-xl cursor-pointer transition-all duration-200",
              "text-white/35 hover:text-red-400 hover:bg-red-400/10",
              "focus-visible:ring-2 focus-visible:ring-red-400/50 outline-none"
            )}
          >
            <LogOut className="w-[18px] h-[18px]" />
          </TooltipTrigger>
          <TooltipContent side="right" className="text-xs">Keluar</TooltipContent>
        </Tooltip>
      </div>
    </aside>
  )
}
