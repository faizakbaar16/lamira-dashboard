"use client"

import { useState, useTransition } from "react"
import type { Customer } from "@/types"
import { addSalesTransaction } from "@/app/(dashboard)/bebek/actions"
import { todayISO } from "@/lib/utils/format"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ShoppingCart } from "lucide-react"

type Props = { customers: Customer[] }

export function AddSaleDialog({ customers }: Props) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [customerId, setCustomerId] = useState("")
  const [productType, setProductType] = useState("")

  const selectedCustomer = customers.find((c) => c.id === customerId)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set("customer_id", customerId)
    formData.set("product_type", productType)
    startTransition(async () => {
      try {
        await addSalesTransaction(formData)
        toast.success("Transaksi berhasil disimpan")
        setOpen(false)
        setCustomerId("")
        setProductType("")
      } catch (err) {
        toast.error("Gagal menyimpan transaksi", {
          description: err instanceof Error ? err.message : "Terjadi kesalahan",
        })
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        <ShoppingCart className="w-4 h-4 mr-2" />
        Catat Penjualan
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Catat Transaksi Penjualan</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="date">Tanggal</Label>
            <Input id="date" name="date" type="date" defaultValue={todayISO()} required />
          </div>

          <div className="space-y-1.5">
            <Label>Pelanggan</Label>
            <Select value={customerId} onValueChange={(v) => setCustomerId(v ?? "")} required>
              <SelectTrigger>
                <SelectValue placeholder="Pilih pelanggan..." />
              </SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Jenis Produk</Label>
            <Select value={productType} onValueChange={(v) => setProductType(v ?? "")} required>
              <SelectTrigger>
                <SelectValue placeholder="Pilih jenis..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fresh">Telur Segar</SelectItem>
                <SelectItem value="salted">Telur Asin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="quantity">Jumlah (butir)</Label>
              <Input id="quantity" name="quantity" type="number" min="1" placeholder="100" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="unit_price">Harga/butir (Rp)</Label>
              <Input
                id="unit_price"
                name="unit_price"
                type="number"
                min="0"
                defaultValue={selectedCustomer?.price_per_egg ?? ""}
                placeholder="3000"
                required
              />
            </div>
          </div>

          {selectedCustomer && (
            <p className="text-xs text-muted-foreground">
              Pembayaran: <strong>{selectedCustomer.payment_terms.toUpperCase()}</strong>
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button type="submit" disabled={isPending || !customerId || !productType}>
              {isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
