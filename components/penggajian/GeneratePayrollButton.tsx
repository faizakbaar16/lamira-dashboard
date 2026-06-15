"use client"

import { useTransition } from "react"
import { generatePayroll } from "@/app/(dashboard)/penggajian/actions"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Calculator } from "lucide-react"

type Props = { year: number; month: number }

export function GeneratePayrollButton({ year, month }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleGenerate() {
    startTransition(async () => {
      try {
        await generatePayroll(year, month)
        toast.success("Gaji berhasil dihitung dari presensi")
      } catch (err) {
        toast.error("Gagal menghitung gaji", { description: err instanceof Error ? err.message : "" })
      }
    })
  }

  return (
    <Button size="sm" variant="outline" onClick={handleGenerate} disabled={isPending}>
      <Calculator className="w-4 h-4 mr-2" />
      {isPending ? "Menghitung..." : "Hitung Gaji"}
    </Button>
  )
}
