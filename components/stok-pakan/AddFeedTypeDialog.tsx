"use client"

import { useState, useTransition } from "react"
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Layers } from "lucide-react"
import { toast } from "sonner"
import { addFeedType } from "@/app/(dashboard)/stok-pakan/actions"

export function AddFeedTypeDialog() {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        await addFeedType(fd)
        toast.success("Jenis pakan berhasil ditambahkan")
        setOpen(false)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Gagal menyimpan")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        <Layers className="w-4 h-4 mr-2" />
        Tambah Jenis Pakan
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogTitle>Tambah Jenis Pakan</DialogTitle>
        <DialogDescription>Daftarkan jenis pakan baru ke inventaris.</DialogDescription>
        <form onSubmit={handleSubmit} className="space-y-4 mt-3">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nama Pakan</Label>
            <Input id="name" name="name" placeholder="cth: Konsentrat 511" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="price_per_kg">Harga / kg (Rp)</Label>
              <Input id="price_per_kg" name="price_per_kg" type="number" min={0} defaultValue={0} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="min_stock_threshold">Min. Stok (kg)</Label>
              <Input id="min_stock_threshold" name="min_stock_threshold" type="number" min={0} defaultValue={100} required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="supplier">Supplier (opsional)</Label>
            <Input id="supplier" name="supplier" placeholder="Nama supplier..." />
          </div>
          <div className="flex justify-end gap-2 pt-1">
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
