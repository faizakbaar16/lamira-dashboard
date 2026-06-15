"use client"

import { useState, useTransition } from "react"
import { addProject } from "@/app/(dashboard)/pembangunan/actions"
import { todayISO } from "@/lib/utils/format"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus } from "lucide-react"

export function AddProjectDialog() {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const form = e.currentTarget
    startTransition(async () => {
      try {
        await addProject(formData)
        toast.success("Proyek berhasil ditambahkan")
        setOpen(false)
        form.reset()
      } catch (err) {
        toast.error("Gagal menambah proyek", { description: err instanceof Error ? err.message : "" })
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="bg-primary hover:bg-primary/90" />}>
        <Plus className="w-4 h-4 mr-2" />
        Tambah Proyek
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Tambah Proyek Baru</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nama Proyek</Label>
            <Input id="name" name="name" placeholder="Contoh: Kandang Bebek Baru" required />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea id="description" name="description" rows={2} placeholder="Deskripsi singkat proyek..." />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="location">Lokasi di Kebun</Label>
            <Input id="location" name="location" placeholder="Contoh: Area Selatan, Blok A" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="start_date">Mulai</Label>
              <Input id="start_date" name="start_date" type="date" defaultValue={todayISO()} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="target_date">Target Selesai</Label>
              <Input id="target_date" name="target_date" type="date" required />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="budget">Anggaran (Rp)</Label>
            <Input id="budget" name="budget" type="number" min="0" placeholder="50000000" required />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Menyimpan..." : "Simpan Proyek"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
