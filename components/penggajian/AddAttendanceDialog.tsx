"use client"

import { useState, useTransition } from "react"
import type { Employee } from "@/types"
import { addAttendance } from "@/app/(dashboard)/penggajian/actions"
import { todayISO } from "@/lib/utils/format"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { CalendarCheck } from "lucide-react"

type Props = { employees: Employee[] }

export function AddAttendanceDialog({ employees }: Props) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [employeeId, setEmployeeId] = useState("")

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set("employee_id", employeeId)
    const form = e.currentTarget
    startTransition(async () => {
      try {
        await addAttendance(formData)
        toast.success("Presensi berhasil dicatat")
        setOpen(false)
        setEmployeeId("")
        form.reset()
      } catch (err) {
        toast.error("Gagal mencatat presensi", { description: err instanceof Error ? err.message : "" })
      }
    })
  }

  const selectedEmp = employees.find((e) => e.id === employeeId)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        <CalendarCheck className="w-4 h-4 mr-2" />
        Catat Presensi
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Catat Presensi Karyawan</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="date">Tanggal</Label>
            <Input id="date" name="date" type="date" defaultValue={todayISO()} required />
          </div>
          <div className="space-y-1.5">
            <Label>Karyawan</Label>
            <Select value={employeeId} onValueChange={(v) => setEmployeeId(v ?? "")} required>
              <SelectTrigger><SelectValue placeholder="Pilih karyawan..." /></SelectTrigger>
              <SelectContent>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={e.id}>{e.name} — {e.role}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="hours_or_days">
              {selectedEmp?.type === "harian" ? "Jumlah Hari" : "Jumlah Jam"}
            </Label>
            <Input
              id="hours_or_days"
              name="hours_or_days"
              type="number"
              min="0.5"
              step="0.5"
              defaultValue="1"
              required
            />
            {selectedEmp && (
              <p className="text-xs text-muted-foreground">
                Tarif: Rp {selectedEmp.base_rate.toLocaleString("id-ID")} / {selectedEmp.type === "harian" ? "hari" : "jam"}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="module">Modul Pekerjaan</Label>
            <Select name="module">
              <SelectTrigger><SelectValue placeholder="Pilih modul..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="bebek">Bebek & Telur</SelectItem>
                <SelectItem value="tanaman">Tanaman</SelectItem>
                <SelectItem value="pembangunan">Pembangunan</SelectItem>
                <SelectItem value="umum">Umum</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button type="submit" disabled={isPending || !employeeId}>
              {isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
