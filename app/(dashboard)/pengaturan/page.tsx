import { PageShell } from "@/components/layout/PageShell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Settings, FileSpreadsheet } from "lucide-react"
import { SyncPanel } from "@/components/pengaturan/SyncPanel"
import { createClient } from "@/lib/supabase/server"
import type { SyncLog } from "@/types"

export const metadata = { title: "Pengaturan" }

async function getSyncLogs(): Promise<SyncLog[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("sync_log")
    .select("*")
    .order("synced_at", { ascending: false })
    .limit(10)
  return (data ?? []) as SyncLog[]
}

export default async function PengaturanPage() {
  const syncLogs = await getSyncLogs()
  const sheetsConfigured = !!(process.env.GOOGLE_SPREADSHEET_ID && process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL)

  return (
    <PageShell title="Pengaturan" description="Konfigurasi aplikasi dan integrasi">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SyncPanel logs={syncLogs} configured={sheetsConfigured} />

        <Card className="surface-raised">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Settings className="w-4 h-4 text-primary" />
              Informasi Sistem
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {[
              { label: "Aplikasi", value: "Lamira Dashboard" },
              { label: "Kebun", value: "Kebun Lamira, Sulawesi Tengah" },
              { label: "Luas", value: "±35 Hektar" },
              { label: "Database", value: "Supabase PostgreSQL" },
              { label: "Google Sheets", value: sheetsConfigured ? "Terhubung ✓" : "Belum dikonfigurasi" },
              { label: "Versi", value: "1.0.0" },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between">
                <span className="text-muted-foreground">{label}</span>
                <span className={`font-medium ${value.includes("✓") ? "text-emerald-700" : "text-foreground"}`}>{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  )
}
