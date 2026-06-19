import { PageShell } from "@/components/layout/PageShell"
import { FeedStockCard } from "@/components/stok-pakan/FeedStockCard"
import { AddPurchaseDialog } from "@/components/stok-pakan/AddPurchaseDialog"
import { AddFeedTypeDialog } from "@/components/stok-pakan/AddFeedTypeDialog"
import { getFeedTypes, getFeedPurchases } from "./actions"
import { formatRupiah, formatDateShort } from "@/lib/utils/format"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertTriangle } from "lucide-react"

export const metadata = { title: "Stok Pakan" }

export default async function StokPakanPage() {
  const [feedTypes, purchases] = await Promise.all([getFeedTypes(), getFeedPurchases()])

  const lowStockItems = feedTypes.filter((f) => f.current_stock_kg <= f.min_stock_threshold)

  return (
    <PageShell
      title="Stok Pakan"
      description="Manajemen inventaris pakan bebek dan riwayat pembelian"
      actions={
        <div className="flex items-center gap-2">
          <AddFeedTypeDialog />
          <AddPurchaseDialog feedTypes={feedTypes} />
        </div>
      }
    >
      {/* Low stock alert banner */}
      {lowStockItems.length > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 mb-6">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Peringatan Stok Rendah</p>
            <p className="text-sm text-amber-700 mt-0.5">
              {lowStockItems.map((f) => f.name).join(", ")} sudah di bawah batas minimum.
            </p>
          </div>
        </div>
      )}

      {/* Stock cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {feedTypes.length === 0 ? (
          <div className="col-span-3 text-center py-12 text-muted-foreground">
            Belum ada data pakan. Tambah jenis pakan terlebih dahulu.
          </div>
        ) : (
          feedTypes.map((ft) => <FeedStockCard key={ft.id} feedType={ft} />)
        )}
      </div>

      {/* Purchase history */}
      <Card className="surface-raised">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Riwayat Pembelian (50 Terakhir)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {purchases.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Belum ada riwayat pembelian
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Jenis Pakan</TableHead>
                  <TableHead className="text-right">Jumlah (kg)</TableHead>
                  <TableHead className="text-right">Harga/kg</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Supplier</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchases.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-sm">{formatDateShort(p.date)}</TableCell>
                    <TableCell className="text-sm font-medium">
                      {p.feed_type?.name ?? "—"}
                    </TableCell>
                    <TableCell className="text-right text-sm">{p.quantity_kg}</TableCell>
                    <TableCell className="text-right text-sm">{formatRupiah(p.price_per_kg)}</TableCell>
                    <TableCell className="text-right text-sm font-semibold">{formatRupiah(p.total_cost)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{p.supplier ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </PageShell>
  )
}
