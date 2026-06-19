"use client"

import { useState, useTransition } from "react"
import { SlidersHorizontal, Minus, Plus, Check, X } from "lucide-react"
import { toast } from "sonner"
import { adjustFeedStock } from "@/app/(dashboard)/stok-pakan/actions"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

type Mode = "set" | "subtract" | "add"

type Props = {
  id: string
  currentStock: number
}

export function AdjustStockPanel({ id, currentStock }: Props) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<Mode>("subtract")
  const [amount, setAmount] = useState("")
  const [pending, startTransition] = useTransition()

  const preview = (() => {
    const n = Number(amount)
    if (!amount || isNaN(n) || n <= 0) return null
    if (mode === "subtract") return Math.max(0, currentStock - n)
    if (mode === "add") return currentStock + n
    return n
  })()

  function handleSave() {
    const n = Number(amount)
    if (!amount || isNaN(n) || n < 0) return
    startTransition(async () => {
      try {
        await adjustFeedStock(id, mode, n)
        toast.success("Stok berhasil diperbarui")
        setOpen(false)
        setAmount("")
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Gagal memperbarui stok")
      }
    })
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted px-2 py-1 rounded-md transition-colors"
      >
        <SlidersHorizontal className="w-3 h-3" />
        Atur Stok
      </button>
    )
  }

  return (
    <div className="mt-3 pt-3 border-t border-border space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-foreground">Atur Stok Manual</p>
        <button
          type="button"
          onClick={() => { setOpen(false); setAmount("") }}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Mode toggle */}
      <div className="flex rounded-lg border text-xs overflow-hidden w-full">
        {([
          { key: "subtract" as Mode, label: "Kurangi", icon: Minus },
          { key: "add"      as Mode, label: "Tambah",  icon: Plus },
          { key: "set"      as Mode, label: "Set Langsung", icon: Check },
        ]).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => { setMode(key); setAmount("") }}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 transition-colors ${
              mode === key
                ? "bg-primary text-primary-foreground font-semibold"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <Icon className="w-3 h-3" />
            {label}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          type="number"
          min={0}
          step={0.1}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={mode === "set" ? `Stok baru (kg)` : `Jumlah (kg)`}
          className="h-8 text-sm"
        />
        <Button
          type="button"
          size="sm"
          onClick={handleSave}
          disabled={pending || !amount || Number(amount) < 0}
          className="h-8 px-3 text-xs shrink-0"
        >
          {pending ? "..." : "Simpan"}
        </Button>
      </div>

      {preview !== null && (
        <p className="text-xs text-muted-foreground">
          Stok setelah:{" "}
          <span className="font-semibold text-foreground">{preview.toLocaleString("id-ID", { maximumFractionDigits: 1 })} kg</span>
        </p>
      )}
    </div>
  )
}
