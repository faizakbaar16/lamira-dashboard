import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { syncModuleToSheet } from "@/lib/sheets/client"

const VALID_MODULES = ["bebek", "tanaman", "pembangunan", "penggajian", "stok-pakan"]

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ module: string }> }
) {
  const { module } = await params

  if (!VALID_MODULES.includes(module)) {
    return NextResponse.json({ error: "Invalid module" }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const startedAt = new Date().toISOString()

  try {
    await syncModuleToSheet(module)

    await supabase.from("sync_log").insert({
      module,
      status: "success",
      synced_at: startedAt,
      records_synced: null,
      error_message: null,
    })

    return NextResponse.json({ ok: true, module, synced_at: startedAt })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"

    await supabase.from("sync_log").insert({
      module,
      status: "error",
      synced_at: startedAt,
      records_synced: null,
      error_message: message,
    })

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
