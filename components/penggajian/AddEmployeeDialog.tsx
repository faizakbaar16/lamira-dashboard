"use client"

import { useState, useTransition } from "react"
import { addEmployee } from "@/app/(dashboard)/penggajian/actions"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { UserPlus } from "lucide-react"

export function AddEmployeeDialog() {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [type, setType] = useState("")

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set("type", type)
    const form = e.currentTarget
    startTransition(async () => {
      try {
        await addEmployee(formData)
        toast.success("Karyawan berhasil ditambahkan")
        setOpen(false)
        setType("")
        form.reset()
      } catch (err) {
        toast.error("Gagal menambah karyawan", { description: err instanceof Error ? err.message : "" })
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="bg-primary hover:bg-primary/90" />}>
        <UserPlus className="w-4 h-4 mr-2" />
        Tambah Karyawan
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Tambah Karyawan Baru</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nama Lengkap</Label>
            <Input id="name" name="name" placeholder="Nama karyawan" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="role">Jabatan / Peran</Label>
            <Input id="role" name="role" placeholder="Contoh: Penjaga Bebek, Tukang Kebun" required />
          </div>
          <div className="space-y-1.5">
            <Label>Tipe Karyawan</Label>
            <Select value={type} onValueChange={(v) => setType(v ?? "")} required>
              <SelectTrigger><SelectValue placeholder="Pilih tipe..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="harian">Harian</SelectItem>
                <SelectItem value="mingguan">Mingguan</SelectItem>
                <SelectItem value="bulanan">Bulanan</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="base_rate">Tarif Dasar (Rp)</Label>
            <Input id="base_rate" name="base_rate" type="number" min="0" placeholder="100000" required />
            <p className="text-xs text-muted-foreground">Per hari / per minggu / per bulan sesuai tipe</p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button type="submit" disabled={isPending || !type}>
              {isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
