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
        background: "#1a3a2a",
        borderRight: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {/* Logo */}
      <div className="mb-4 flex items-center justify-center w-10 h-10 rounded-xl bg-[#c9a227]/20 border border-[#c9a227]/30">
        <Leaf className="w-5 h-5 text-[#c9a227]" />
      </div>

      <div className="w-8 h-px bg-white/10 mb-2" />

      {/* Nav items */}
      <nav className="flex flex-col items-center gap-1 flex-1">
        {NAV_ITEMS.map(({ href, icon: Icon, label, exact }) => {
          const active = isActive(pathname, href, exact)
          return (
            <Tooltip key={href}>
              <TooltipTrigger
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-150 cursor-pointer",
                  active
                    ? "bg-[#c9a227] text-[#1a3a2a]"
                    : "text-white/50 hover:text-white hover:bg-white/10"
                )}
                render={
                  <Link href={href}>
                    <Icon className="w-5 h-5" />
                  </Link>
                }
              />
              <TooltipContent side="right" className="font-medium">
                {label}
              </TooltipContent>
            </Tooltip>
          )
        })}
      </nav>

      {/* Bottom actions */}
      <div className="flex flex-col items-center gap-1 mt-auto">
        <Tooltip>
          <TooltipTrigger
            className={cn(
              "flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-150 cursor-pointer",
              isActive(pathname, "/pengaturan")
                ? "bg-[#c9a227] text-[#1a3a2a]"
                : "text-white/50 hover:text-white hover:bg-white/10"
            )}
            render={
              <Link href="/pengaturan">
                <Settings className="w-5 h-5" />
              </Link>
            }
          />
          <TooltipContent side="right">Pengaturan</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger
            onClick={handleLogout}
            className="flex items-center justify-center w-10 h-10 rounded-xl text-white/50 hover:text-red-400 hover:bg-red-400/10 transition-all duration-150 cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
          </TooltipTrigger>
          <TooltipContent side="right">Keluar</TooltipContent>
        </Tooltip>
      </div>
    </aside>
  )
}
