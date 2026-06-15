"use client"

import { useState, useTransition } from "react"
import { addDuckDaily } from "@/app/(dashboard)/bebek/actions"
import { todayISO } from "@/lib/utils/format"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bird } from "lucide-react"

export function DuckDailyForm() {
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const form = e.currentTarget
    startTransition(async () => {
      try {
        await addDuckDaily(formData)
        toast.success("Data produksi berhasil disimpan")
        form.reset()
      } catch (err) {
        toast.error("Gagal menyimpan", {
          description: err instanceof Error ? err.message : "Terjadi kesalahan",
        })
      }
    })
  }

  return (
    <Card className="surface-raised">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Bird className="w-4 h-4 text-primary" />
          Input Harian
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="date">Tanggal</Label>
            <Input id="date" name="date" type="date" defaultValue={todayISO()} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="eggs_total">Total Telur (butir)</Label>
              <Input id="eggs_total" name="eggs_total" type="number" min="0" placeholder="0" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="eggs_reject">Telur Reject</Label>
              <Input id="eggs_reject" name="eggs_reject" type="number" min="0" defaultValue="0" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="feed_consumed_kg">Pakan Dikonsumsi (kg)</Label>
            <Input id="feed_consumed_kg" name="feed_consumed_kg" type="number" min="0" step="0.1" placeholder="0" required />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Catatan</Label>
            <Textarea id="notes" name="notes" placeholder="Kondisi bebek, cuaca, dll..." rows={2} />
          </div>

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "Menyimpan..." : "Simpan Data Harian"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
