"use client"

import { useTransition } from "react"
import type { SalesTransaction } from "@/types"
import { markPaymentPaid } from "@/app/(dashboard)/bebek/actions"
import { formatRupiah, formatDateShort } from "@/lib/utils/format"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  pending:  { label: "Pending",  className: "bg-amber-100 text-amber-800 border-amber-200" },
  paid:     { label: "Lunas",    className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  overdue:  { label: "Jatuh Tempo", className: "bg-red-100 text-red-800 border-red-200" },
}

type Props = { transactions: SalesTransaction[] }

export function SalesTable({ transactions }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleMarkPaid(id: string) {
    startTransition(async () => {
      try {
        await markPaymentPaid(id)
        toast.success("Pembayaran ditandai lunas")
      } catch {
        toast.error("Gagal memperbarui status")
      }
    })
  }

  if (transactions.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">Belum ada transaksi</p>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Tanggal</TableHead>
          <TableHead>Pelanggan</TableHead>
          <TableHead>Produk</TableHead>
          <TableHead className="text-right">Qty</TableHead>
          <TableHead className="text-right">Harga</TableHead>
          <TableHead className="text-right">Total</TableHead>
          <TableHead>Jatuh Tempo</TableHead>
          <TableHead>Status</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((t) => {
          const badge = STATUS_BADGE[t.payment_status] ?? STATUS_BADGE.pending
          return (
            <TableRow key={t.id}>
              <TableCell className="text-sm">{formatDateShort(t.date)}</TableCell>
              <TableCell className="text-sm font-medium">{t.customer?.name ?? "—"}</TableCell>
              <TableCell className="text-sm capitalize">{t.product_type === "fresh" ? "Segar" : "Asin"}</TableCell>
              <TableCell className="text-right text-sm">{t.quantity.toLocaleString("id-ID")}</TableCell>
              <TableCell className="text-right text-sm">{formatRupiah(t.unit_price)}</TableCell>
              <TableCell className="text-right text-sm font-semibold">{formatRupiah(t.total)}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {t.due_date ? formatDateShort(t.due_date) : "—"}
              </TableCell>
              <TableCell>
                <Badge className={badge.className}>{badge.label}</Badge>
              </TableCell>
              <TableCell>
                {t.payment_status !== "paid" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-7"
                    disabled={isPending}
                    onClick={() => handleMarkPaid(t.id)}
                  >
                    Tandai Lunas
                  </Button>
                )}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
