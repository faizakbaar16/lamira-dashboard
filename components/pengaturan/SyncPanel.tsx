"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileSpreadsheet, RefreshCw, CheckCircle2, XCircle } from "lucide-react"
import type { SyncLog } from "@/types"

const MODULES = [
  { id: "bebek", label: "Bebek & Telur" },
  { id: "tanaman", label: "Tanaman" },
  { id: "pembangunan", label: "Pembangunan" },
  { id: "penggajian", label: "Penggajian" },
  { id: "stok-pakan", label: "Stok Pakan" },
]

type Props = { logs: SyncLog[]; configured: boolean }

export function SyncPanel({ logs, configured }: Props) {
  const [syncing, setSyncing] = useState<string | null>(null)

  async function handleSync(moduleId: string) {
    setSyncing(moduleId)
    try {
      const res = await fetch(`/api/sync/${moduleId}`, { method: "POST" })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Gagal sinkronisasi")
      toast.success(`${MODULES.find((m) => m.id === moduleId)?.label} berhasil disinkronkan`)
    } catch (err) {
      toast.error("Sinkronisasi gagal", { description: err instanceof Error ? err.message : "" })
    } finally {
      setSyncing(null)
    }
  }

  async function handleSyncAll() {
    setSyncing("all")
    let failed = 0
    for (const m of MODULES) {
      try {
        const res = await fetch(`/api/sync/${m.id}`, { method: "POST" })
        if (!res.ok) failed++
      } catch {
        failed++
      }
    }
    setSyncing(null)
    if (failed === 0) toast.success("Semua modul berhasil disinkronkan")
    else toast.warning(`Selesai — ${failed} modul gagal`)
  }

  return (
    <Card className="surface-raised">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          Google Sheets Sync
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!configured && (
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800 space-y-2">
            <p className="font-medium">Belum dikonfigurasi</p>
            <p className="text-xs">Tambahkan environment variables berikut ke Vercel:</p>
            <div className="font-mono text-xs space-y-0.5 text-amber-900">
              <p>GOOGLE_SERVICE_ACCOUNT_EMAIL</p>
              <p>GOOGLE_PRIVATE_KEY</p>
              <p>GOOGLE_SPREADSHEET_ID</p>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {MODULES.map((m) => {
            const lastLog = logs.find((l) => l.module === m.id)
            return (
              <div key={m.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{m.label}</p>
                  {lastLog && (
                    <p className="text-xs text-muted-foreground">
                      {lastLog.status === "success" ? "✓" : "✗"}{" "}
                      {new Date(lastLog.synced_at).toLocaleString("id-ID")}
                    </p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!configured || syncing !== null}
                  onClick={() => handleSync(m.id)}
                  className="h-7 text-xs"
                >
                  {syncing === m.id ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3 h-3" />
                  )}
                  <span className="ml-1.5">Sync</span>
                </Button>
              </div>
            )
          })}
        </div>

        <Button
          className="w-full bg-primary hover:bg-primary/90"
          disabled={!configured || syncing !== null}
          onClick={handleSyncAll}
          size="sm"
        >
          {syncing === "all" ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Sinkronkan Semua
        </Button>

        {/* Recent log */}
        {logs.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-xs font-medium text-muted-foreground mb-2">Log Terakhir</p>
            <div className="space-y-1">
              {logs.slice(0, 5).map((log, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  {log.status === "success" ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="w-3 h-3 text-red-500 shrink-0" />
                  )}
                  <span className="text-muted-foreground capitalize">{log.module}</span>
                  <span className="text-muted-foreground ml-auto">
                    {new Date(log.synced_at).toLocaleDateString("id-ID")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
