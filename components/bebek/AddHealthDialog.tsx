"use client"

import { useState, useTransition } from "react"
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Syringe } from "lucide-react"
import { toast } from "sonner"
import { addDuckHealthRecord } from "@/app/(dashboard)/bebek/actions"
import type { DuckBatch } from "@/types"
import { todayISO } from "@/lib/utils/format"

type Props = { batches: DuckBatch[] }

export function AddHealthDialog({ batches }: Props) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [batchId, setBatchId] = useState("all")
  const [recordType, setRecordType] = useState("")

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    fd.set("batch_id", batchId === "all" ? "" : batchId)
    startTransition(async () => {
      try {
        await addDuckHealthRecord(fd)
        toast.success("Catatan kesehatan berhasil disimpan")
        setOpen(false)
        setBatchId("all")
        setRecordType("")
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Gagal menyimpan")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        <Syringe className="w-4 h-4 mr-2" />
        Catat Obat / Vitamin
      </DialogTrigger>
      <DialogContent className="max-w-md">
          <DialogTitle>Catatan Kesehatan Bebek</DialogTitle>
          <DialogDescription>Input pemberian obat, vitamin, atau vaksinasi.</DialogDescription>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="date">Tanggal</Label>
                <Input id="date" name="date" type="date" defaultValue={todayISO()} required />
              </div>
              <div className="space-y-1.5">
                <Label>Kandang</Label>
                <Select value={batchId} onValueChange={(v) => setBatchId(v ?? "all")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Kandang</SelectItem>
                    {batches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.code} — {b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Jenis</Label>
                <Select name="record_type" value={recordType} onValueChange={(v) => setRecordType(v ?? "")}>
                  <SelectTrigger><SelectValue placeholder="Pilih jenis" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="obat">Obat</SelectItem>
                    <SelectItem value="vitamin">Vitamin</SelectItem>
                    <SelectItem value="vaksin">Vaksin</SelectItem>
                    <SelectItem value="lainnya">Lainnya</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="product_name">Nama Produk</Label>
                <Input id="product_name" name="product_name" placeholder="Nama obat/vitamin..." required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="dosage">Dosis</Label>
                <Input id="dosage" name="dosage" placeholder="cth: 10ml/liter air" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="total_cost">Total Biaya (Rp)</Label>
                <Input id="total_cost" name="total_cost" type="number" min={0} defaultValue={0} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes">Catatan</Label>
              <Textarea id="notes" name="notes" rows={2} placeholder="Kondisi, reaksi, dosis lanjutan..." />
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
