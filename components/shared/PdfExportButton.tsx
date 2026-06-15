"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { FileDown } from "lucide-react"

type Props = {
  href: string
  label?: string
  filename?: string
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm"
}

export function PdfExportButton({ href, label = "Ekspor PDF", variant = "outline", size = "sm" }: Props) {
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    setLoading(true)
    try {
      const res = await fetch(href)
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error ?? "Gagal membuat PDF")
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      const disposition = res.headers.get("content-disposition") ?? ""
      const match = disposition.match(/filename="(.+)"/)
      a.download = match?.[1] ?? "laporan.pdf"
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      toast.error("Gagal ekspor PDF", { description: err instanceof Error ? err.message : "" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button size={size} variant={variant} onClick={handleExport} disabled={loading}>
      <FileDown className="w-4 h-4 mr-2" />
      {loading ? "Memproses..." : label}
    </Button>
  )
}
