import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AppSidebar } from "@/components/layout/AppSidebar"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <div className="flex h-full min-h-screen">
      <AppSidebar />
      <main className="flex-1 ml-16 min-h-screen overflow-auto bg-background">
        {children}
      </main>
    </div>
  )
}
