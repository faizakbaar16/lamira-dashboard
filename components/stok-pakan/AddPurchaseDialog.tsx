"use client"

import { useState, useTransition } from "react"
import type { FeedType } from "@/types"
import { addFeedPurchase } from "@/app/(dashboard)/stok-pakan/actions"
import { todayISO } from "@/lib/utils/format"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus } from "lucide-react"

type Props = { feedTypes: FeedType[] }

export function AddPurchaseDialog({ feedTypes }: Props) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [feedTypeId, setFeedTypeId] = useState("")

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set("feed_type_id", feedTypeId)
    startTransition(async () => {
      try {
        await addFeedPurchase(formData)
        toast.success("Pembelian pakan berhasil dicatat")
        setOpen(false)
      } catch (err) {
        toast.error("Gagal mencatat pembelian", {
          description: err instanceof Error ? err.message : "Terjadi kesalahan",
        })
      }
    })
  }

  const selectedFeed = feedTypes.find((f) => f.id === feedTypeId)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="bg-primary hover:bg-primary/90" />}>
        <Plus className="w-4 h-4 mr-2" />
        Catat Pembelian
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Catat Pembelian Pakan</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label>Jenis Pakan</Label>
            <Select value={feedTypeId} onValueChange={(v) => setFeedTypeId(v ?? "")} required>
              <SelectTrigger>
                <SelectValue placeholder="Pilih jenis pakan..." />
              </SelectTrigger>
              <SelectContent>
                {feedTypes.map((f) => (
                  <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="date">Tanggal Pembelian</Label>
            <Input id="date" name="date" type="date" defaultValue={todayISO()} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="quantity_kg">Jumlah (kg)</Label>
              <Input id="quantity_kg" name="quantity_kg" type="number" min="0.1" step="0.1" placeholder="100" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="price_per_kg">Harga/kg (Rp)</Label>
              <Input
                id="price_per_kg"
                name="price_per_kg"
                type="number"
                min="0"
                defaultValue={selectedFeed?.price_per_kg ?? ""}
                placeholder="8500"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="supplier">Supplier (opsional)</Label>
            <Input id="supplier" name="supplier" placeholder="Nama supplier..." defaultValue={selectedFeed?.supplier ?? ""} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button type="submit" disabled={isPending || !feedTypeId}>
              {isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
