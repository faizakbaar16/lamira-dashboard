"use client"

import { useState, useTransition } from "react"
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ClipboardList } from "lucide-react"
import { toast } from "sonner"
import { addDuckDaily } from "@/app/(dashboard)/bebek/actions"
import type { DuckBatch, FeedType } from "@/types"
import { todayISO } from "@/lib/utils/format"

const FEED_KG_PER_DUCK = 0.13

type Props = {
  batches: DuckBatch[]
  feedTypes: FeedType[]
}

export function AddDailyLogDialog({ batches, feedTypes }: Props) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [batchId, setBatchId] = useState("")
  const [feedTypeId, setFeedTypeId] = useState("")

  const selectedBatch = batches.find((b) => b.id === batchId)
  const suggestedFeedKg = selectedBatch
    ? (selectedBatch.population * FEED_KG_PER_DUCK).toFixed(1)
    : ""

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        await addDuckDaily(fd)
        toast.success("Log harian berhasil disimpan")
        setOpen(false)
        setBatchId("")
        setFeedTypeId("")
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Gagal menyimpan")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        <ClipboardList className="w-4 h-4 mr-2" />
        Catat Log Harian
      </DialogTrigger>
      <DialogContent className="max-w-md">
          <DialogTitle>Log Harian Produksi</DialogTitle>
          <DialogDescription>Catat produksi telur dan konsumsi pakan per kandang.</DialogDescription>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="date">Tanggal</Label>
                <Input id="date" name="date" type="date" defaultValue={todayISO()} required />
              </div>
              <div className="space-y-1.5">
                <Label>Kandang</Label>
                <Select name="batch_id" value={batchId} onValueChange={(v) => setBatchId(v ?? "")}>
                  <SelectTrigger><SelectValue placeholder="Pilih kandang" /></SelectTrigger>
                  <SelectContent>
                    {batches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.code} — {b.population} ekor
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedBatch && (
              <div className="rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{selectedBatch.name}</span>
                {" · "}Populasi {selectedBatch.population} ekor
                {" · "}Kebutuhan pakan ≈{" "}
                <span className="font-semibold text-foreground">{suggestedFeedKg} kg</span>
                {" "}(@ {FEED_KG_PER_DUCK * 1000}g/ekor)
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="eggs_total">Telur Diproduksi (butir)</Label>
                <Input id="eggs_total" name="eggs_total" type="number" min={0} placeholder="0" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="eggs_reject">Telur Reject (butir)</Label>
                <Input id="eggs_reject" name="eggs_reject" type="number" min={0} defaultValue={0} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Jenis Pakan</Label>
                <Select name="feed_type_id" value={feedTypeId} onValueChange={(v) => setFeedTypeId(v ?? "")}>
                  <SelectTrigger><SelectValue placeholder="Pilih pakan" /></SelectTrigger>
                  <SelectContent>
                    {feedTypes.map((f) => (
                      <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="feed_consumed_kg">
                  Pakan Dikonsumsi (kg)
                </Label>
                <Input
                  id="feed_consumed_kg"
                  name="feed_consumed_kg"
                  type="number"
                  step="0.1"
                  min={0}
                  placeholder={suggestedFeedKg || "0"}
                  defaultValue={suggestedFeedKg || undefined}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes">Catatan</Label>
              <Textarea id="notes" name="notes" rows={2} placeholder="Kondisi khusus, observasi, dll..." />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
              <Button type="submit" disabled={pending} className="bg-primary hover:bg-primary/90">
                {pending ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </form>
      </DialogContent>
    </Dialog>
  )
}
