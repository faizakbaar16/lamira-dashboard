"use client"

import { useState, useTransition } from "react"
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ClipboardList, Plus, X } from "lucide-react"
import { toast } from "sonner"
import { addDuckDaily, addFeedType } from "@/app/(dashboard)/bebek/actions"
import type { DuckBatch, FeedType } from "@/types"
import { todayISO } from "@/lib/utils/format"

const FEED_KG_PER_DUCK = 0.13
const NEW_FEED_SENTINEL = "__new__"

type Props = {
  batches: DuckBatch[]
  feedTypes: FeedType[]
}

export function AddDailyLogDialog({ batches, feedTypes: initialFeedTypes }: Props) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [batchId, setBatchId] = useState("")
  const [feedTypeId, setFeedTypeId] = useState("")
  const [feedTypes, setFeedTypes] = useState<FeedType[]>(initialFeedTypes)
  const [showNewFeed, setShowNewFeed] = useState(false)
  const [newFeedName, setNewFeedName] = useState("")
  const [newFeedPrice, setNewFeedPrice] = useState("")
  const [savingFeed, startSavingFeed] = useTransition()

  const selectedBatch = batches.find((b) => b.id === batchId)
  const suggestedFeedKg = selectedBatch
    ? (selectedBatch.population * FEED_KG_PER_DUCK).toFixed(1)
    : ""

  function handleFeedTypeChange(v: string | null) {
    if (v === NEW_FEED_SENTINEL) {
      setShowNewFeed(true)
      setFeedTypeId("")
    } else {
      setFeedTypeId(v ?? "")
      setShowNewFeed(false)
    }
  }

  function handleSaveNewFeed() {
    if (!newFeedName.trim()) return
    const fd = new FormData()
    fd.set("name", newFeedName.trim())
    fd.set("price_per_kg", newFeedPrice || "0")
    startSavingFeed(async () => {
      try {
        const created = await addFeedType(fd)
        setFeedTypes((prev) => [...prev, created as FeedType])
        setFeedTypeId(created.id)
        setShowNewFeed(false)
        setNewFeedName("")
        setNewFeedPrice("")
        toast.success(`Jenis pakan "${created.name}" ditambahkan`)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Gagal menyimpan pakan")
      }
    })
  }

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
        setShowNewFeed(false)
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
                <input type="hidden" name="feed_type_id" value={feedTypeId} />
                <Select value={feedTypeId || (showNewFeed ? NEW_FEED_SENTINEL : "")} onValueChange={handleFeedTypeChange}>
                  <SelectTrigger><SelectValue placeholder="Pilih pakan" /></SelectTrigger>
                  <SelectContent>
                    {feedTypes.map((f) => (
                      <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                    ))}
                    <SelectItem value={NEW_FEED_SENTINEL}>
                      <span className="flex items-center gap-1.5 text-primary font-medium">
                        <Plus className="w-3.5 h-3.5" />
                        Tambah jenis baru...
                      </span>
                    </SelectItem>
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

            {showNewFeed && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-primary">Tambah Jenis Pakan Baru</p>
                  <button
                    type="button"
                    onClick={() => { setShowNewFeed(false); setNewFeedName(""); setNewFeedPrice("") }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Nama Pakan</Label>
                    <Input
                      value={newFeedName}
                      onChange={(e) => setNewFeedName(e.target.value)}
                      placeholder="cth: Konsentrat 511"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Harga / kg (Rp)</Label>
                    <Input
                      value={newFeedPrice}
                      onChange={(e) => setNewFeedPrice(e.target.value)}
                      type="number"
                      min={0}
                      placeholder="0"
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSaveNewFeed}
                  disabled={savingFeed || !newFeedName.trim()}
                  className="h-7 text-xs"
                >
                  {savingFeed ? "Menyimpan..." : "Simpan & Pilih"}
                </Button>
              </div>
            )}

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
