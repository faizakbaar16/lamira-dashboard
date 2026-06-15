"use client"

import { useState, useTransition } from "react"
import type { Plant } from "@/types"
import { addWorkLog } from "@/app/(dashboard)/tanaman/actions"
import { todayISO } from "@/lib/utils/format"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ClipboardList } from "lucide-react"

const WORK_TYPES = [
  { value: "pemupukan",     label: "Pemupukan" },
  { value: "penyemprotan",  label: "Penyemprotan" },
  { value: "pemangkasan",   label: "Pemangkasan" },
  { value: "penyiraman",    label: "Penyiraman" },
  { value: "panen",         label: "Panen" },
  { value: "penanaman_baru",label: "Penanaman Baru" },
  { value: "inspeksi",      label: "Inspeksi" },
  { value: "lainnya",       label: "Lainnya" },
]

type Props = { plants: Plant[] }

export function AddWorkLogDialog({ plants }: Props) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [plantId, setPlantId] = useState("")
  const [workType, setWorkType] = useState("")

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set("plant_id", plantId)
    formData.set("work_type", workType)
    const form = e.currentTarget
    startTransition(async () => {
      try {
        await addWorkLog(formData)
        toast.success("Log pekerjaan berhasil disimpan")
        setOpen(false)
        setPlantId("")
        setWorkType("")
        form.reset()
      } catch (err) {
        toast.error("Gagal menyimpan", { description: err instanceof Error ? err.message : "" })
      }
    })
  }

  // Group plants by block for the select
  const byBlock = plants.reduce<Record<string, Plant[]>>((acc, p) => {
    const key = `Blok ${p.block}`
    if (!acc[key]) acc[key] = []
    acc[key].push(p)
    return acc
  }, {})

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="bg-primary hover:bg-primary/90" />}>
        <ClipboardList className="w-4 h-4 mr-2" />
        Catat Pekerjaan
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Catat Log Pekerjaan</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="date">Tanggal</Label>
            <Input id="date" name="date" type="date" defaultValue={todayISO()} required />
          </div>

          <div className="space-y-1.5">
            <Label>Tanaman / Blok</Label>
            <Select value={plantId} onValueChange={(v) => setPlantId(v ?? "")} required>
              <SelectTrigger>
                <SelectValue placeholder="Pilih tanaman..." />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(byBlock).map(([block, blockPlants]) => (
                  <div key={block}>
                    <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">{block}</div>
                    {blockPlants.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.species}{p.variety ? ` (${p.variety})` : ""} — {p.quantity} pohon
                      </SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Jenis Pekerjaan</Label>
            <Select value={workType} onValueChange={(v) => setWorkType(v ?? "")} required>
              <SelectTrigger>
                <SelectValue placeholder="Pilih jenis pekerjaan..." />
              </SelectTrigger>
              <SelectContent>
                {WORK_TYPES.map((wt) => (
                  <SelectItem key={wt.value} value={wt.value}>{wt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="worker_names">Pekerja (pisah koma)</Label>
            <Input id="worker_names" name="worker_names" placeholder="Ahmad, Budi, Citra" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Catatan</Label>
            <Textarea id="notes" name="notes" rows={2} placeholder="Detail pekerjaan, kondisi tanaman..." />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button type="submit" disabled={isPending || !plantId || !workType}>
              {isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
