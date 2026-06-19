"use client"

import { useTransition, useState } from "react"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"
import { deleteFeedType } from "@/app/(dashboard)/stok-pakan/actions"

type Props = { id: string; name: string }

export function DeleteFeedTypeButton({ id, name }: Props) {
  const [pending, startTransition] = useTransition()
  const [confirm, setConfirm] = useState(false)

  function handleClick() {
    if (!confirm) {
      setConfirm(true)
      setTimeout(() => setConfirm(false), 3000)
      return
    }
    startTransition(async () => {
      try {
        await deleteFeedType(id)
        toast.success(`Pakan "${name}" dihapus`)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Gagal menghapus")
        setConfirm(false)
      }
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className={`flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-colors ${
        confirm
          ? "bg-red-100 text-red-700 font-semibold"
          : "text-muted-foreground hover:text-red-600 hover:bg-red-50"
      }`}
    >
      <Trash2 className="w-3 h-3" />
      {pending ? "..." : confirm ? "Yakin hapus?" : "Hapus"}
    </button>
  )
}
