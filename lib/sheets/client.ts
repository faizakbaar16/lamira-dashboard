"use server"

import { createClient } from "@/lib/supabase/server"

const SHEETS_BASE = "https://sheets.googleapis.com/v4/spreadsheets"

async function getAccessToken(): Promise<string> {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const rawKey = process.env.GOOGLE_PRIVATE_KEY

  if (!email || !rawKey) {
    throw new Error("Google service account credentials not configured")
  }

  const privateKey = rawKey.replace(/\\n/g, "\n")
  const now = Math.floor(Date.now() / 1000)
  const header = { alg: "RS256", typ: "JWT" }
  const payload = {
    iss: email,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  }

  const encode = (obj: object) =>
    Buffer.from(JSON.stringify(obj)).toString("base64url")

  const unsigned = `${encode(header)}.${encode(payload)}`

  const keyData = privateKey
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s/g, "")

  const binaryKey = Buffer.from(keyData, "base64")
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  )

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    Buffer.from(unsigned)
  )
  const jwt = `${unsigned}.${Buffer.from(signature).toString("base64url")}`

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  })

  if (!tokenRes.ok) {
    const err = await tokenRes.text()
    throw new Error(`Failed to get Google access token: ${err}`)
  }

  const { access_token } = await tokenRes.json()
  return access_token
}

async function sheetsRequest(
  path: string,
  method: "GET" | "PUT" | "POST" = "GET",
  body?: object
) {
  const token = await getAccessToken()
  const res = await fetch(`${SHEETS_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Sheets API error: ${err}`)
  }
  return res.json()
}

export async function writeSheetTab(
  spreadsheetId: string,
  tabName: string,
  headers: string[],
  rows: (string | number | null)[][]
) {
  // Ensure tab exists
  const meta = await sheetsRequest(`/${spreadsheetId}`)
  const sheetExists = meta.sheets?.some(
    (s: any) => s.properties.title === tabName
  )

  if (!sheetExists) {
    await sheetsRequest(`/${spreadsheetId}:batchUpdate`, "POST", {
      requests: [{ addSheet: { properties: { title: tabName } } }],
    })
  }

  const values = [headers, ...rows]
  await sheetsRequest(
    `/${spreadsheetId}/values/${encodeURIComponent(tabName)}!A1?valueInputOption=RAW`,
    "PUT",
    { values }
  )
}

export async function syncModuleToSheet(module: string) {
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID
  if (!spreadsheetId) throw new Error("GOOGLE_SPREADSHEET_ID not configured")

  const supabase = await createClient()

  if (module === "bebek") {
    const { data } = await supabase
      .from("duck_daily")
      .select("date,eggs_total,eggs_reject,feed_consumed_kg,feed_cost,notes")
      .order("date", { ascending: false })
      .limit(90)

    await writeSheetTab(
      spreadsheetId,
      "Produksi Bebek",
      ["Tanggal", "Telur Total", "Reject", "Pakan (kg)", "Biaya Pakan", "Catatan"],
      (data ?? []).map((r) => [r.date, r.eggs_total, r.eggs_reject, r.feed_consumed_kg, r.feed_cost, r.notes ?? ""])
    )

    const { data: sales } = await supabase
      .from("sales_transactions")
      .select("date,product_type,quantity,unit_price,total,payment_status,customer:customers(name)")
      .order("date", { ascending: false })
      .limit(200)

    await writeSheetTab(
      spreadsheetId,
      "Penjualan Telur",
      ["Tanggal", "Pelanggan", "Produk", "Jumlah", "Harga/butir", "Total", "Status Bayar"],
      (sales ?? []).map((r: any) => [r.date, r.customer?.name ?? "", r.product_type, r.quantity, r.unit_price, r.total, r.payment_status])
    )
  }

  if (module === "tanaman") {
    const { data } = await supabase
      .from("work_logs")
      .select("date,work_type,notes,plant:plants(name,block,variety)")
      .order("date", { ascending: false })
      .limit(200)

    await writeSheetTab(
      spreadsheetId,
      "Log Tanaman",
      ["Tanggal", "Tanaman", "Blok", "Varietas", "Jenis Pekerjaan", "Catatan"],
      (data ?? []).map((r: any) => [r.date, r.plant?.name ?? "", r.plant?.block ?? "", r.plant?.variety ?? "", r.work_type, r.notes ?? ""])
    )
  }

  if (module === "pembangunan") {
    const { data } = await supabase
      .from("construction_logs")
      .select("date,description,cost,project:projects(name)")
      .order("date", { ascending: false })
      .limit(200)

    await writeSheetTab(
      spreadsheetId,
      "Log Pembangunan",
      ["Tanggal", "Proyek", "Deskripsi", "Biaya"],
      (data ?? []).map((r: any) => [r.date, r.project?.name ?? "", r.description, r.cost ?? 0])
    )
  }

  if (module === "penggajian") {
    const { data } = await supabase
      .from("payroll_records")
      .select("year,month,gross_pay,deductions,net_pay,status,employee:employees(name,role)")
      .order("year", { ascending: false })
      .limit(200)

    await writeSheetTab(
      spreadsheetId,
      "Penggajian",
      ["Tahun", "Bulan", "Nama", "Jabatan", "Gaji Kotor", "Potongan", "Gaji Bersih", "Status"],
      (data ?? []).map((r: any) => [r.year, r.month, r.employee?.name ?? "", r.employee?.role ?? "", r.gross_pay, r.deductions, r.net_pay, r.status])
    )
  }

  if (module === "stok-pakan") {
    const { data } = await supabase
      .from("feed_purchases")
      .select("date,quantity_kg,price_per_kg,total_cost,supplier,feed_type:feed_types(name)")
      .order("date", { ascending: false })
      .limit(200)

    await writeSheetTab(
      spreadsheetId,
      "Stok Pakan",
      ["Tanggal", "Jenis Pakan", "Jumlah (kg)", "Harga/kg", "Total", "Supplier"],
      (data ?? []).map((r: any) => [r.date, r.feed_type?.name ?? "", r.quantity_kg, r.price_per_kg, r.total_cost, r.supplier ?? ""])
    )
  }
}
