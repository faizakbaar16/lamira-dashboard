import { PageShell } from "@/components/layout/PageShell"
import { StatCard } from "@/components/shared/StatCard"
import { getEmployees, getAttendanceByMonth, getPayrollRecords } from "./actions"
import { formatRupiah, formatMonthYear } from "@/lib/utils/format"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AddEmployeeDialog } from "@/components/penggajian/AddEmployeeDialog"
import { AddAttendanceDialog } from "@/components/penggajian/AddAttendanceDialog"
import { GeneratePayrollButton } from "@/components/penggajian/GeneratePayrollButton"
import { PdfExportButton } from "@/components/shared/PdfExportButton"
import { Users, CalendarCheck, Wallet, UserCheck } from "lucide-react"

export const metadata = { title: "Penggajian" }

export default async function PenggajianPage() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  const [employees, attendance, payroll] = await Promise.all([
    getEmployees(),
    getAttendanceByMonth(year, month),
    getPayrollRecords(year, month),
  ])

  const activeEmployees = employees.filter((e) => e.active)
  const totalPayroll = payroll.reduce((s, p) => s + p.net, 0)
  const paidCount = payroll.filter((p) => p.paid_at).length

  const TYPE_LABELS: Record<string, string> = {
    harian: "Harian", mingguan: "Mingguan", bulanan: "Bulanan",
  }

  return (
    <PageShell
      title="Penggajian"
      description={`Periode: ${formatMonthYear(month, year)}`}
      actions={
        <div className="flex items-center gap-2">
          <PdfExportButton href={`/api/pdf/penggajian?year=${year}&month=${month}`} label="Ekspor PDF" />
          <AddAttendanceDialog employees={activeEmployees} />
          <AddEmployeeDialog />
        </div>
      }
    >
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Karyawan Aktif" value={activeEmployees.length} subtitle="orang" icon={Users} variant="forest" />
        <StatCard title="Total Gaji Bulan Ini" value={formatRupiah(totalPayroll)} subtitle={formatMonthYear(month, year)} icon={Wallet} />
        <StatCard title="Log Presensi" value={attendance.length} subtitle="entri bulan ini" icon={CalendarCheck} />
        <StatCard title="Sudah Dibayar" value={`${paidCount}/${payroll.length}`} subtitle="karyawan" icon={UserCheck} variant="gold" />
      </div>

      <Tabs defaultValue="payroll" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="payroll">Penggajian Bulan Ini</TabsTrigger>
          <TabsTrigger value="presensi">Presensi</TabsTrigger>
          <TabsTrigger value="karyawan">Karyawan</TabsTrigger>
        </TabsList>

        {/* ─── Payroll tab ─────────────────────────────────────── */}
        <TabsContent value="payroll">
          <Card className="surface-raised">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold">
                Gaji {formatMonthYear(month, year)}
              </CardTitle>
              <GeneratePayrollButton year={year} month={month} />
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Jabatan</TableHead>
                    <TableHead className="text-right">Gaji Kotor</TableHead>
                    <TableHead className="text-right">Potongan</TableHead>
                    <TableHead className="text-right">Gaji Bersih</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payroll.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        Klik "Hitung Gaji" untuk menghitung gaji bulan ini berdasarkan presensi
                      </TableCell>
                    </TableRow>
                  ) : (
                    payroll.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="text-sm font-medium">{p.employee?.name ?? "—"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{p.employee?.role ?? "—"}</TableCell>
                        <TableCell className="text-right text-sm">{formatRupiah(p.gross)}</TableCell>
                        <TableCell className="text-right text-sm text-red-600">{formatRupiah(p.deductions)}</TableCell>
                        <TableCell className="text-right text-sm font-bold">{formatRupiah(p.net)}</TableCell>
                        <TableCell>
                          {p.paid_at
                            ? <Badge className="bg-emerald-100 text-emerald-800">Lunas</Badge>
                            : <Badge className="bg-amber-100 text-amber-800">Belum Bayar</Badge>
                          }
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              {payroll.length > 0 && (
                <div className="flex justify-between items-center px-4 py-3 border-t border-border bg-muted/30">
                  <span className="text-sm font-semibold text-foreground">Total Gaji Bersih</span>
                  <span className="text-base font-bold text-primary">{formatRupiah(totalPayroll)}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Presensi tab ─────────────────────────────────────── */}
        <TabsContent value="presensi">
          <Card className="surface-raised">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Log Presensi Bulan Ini</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Modul</TableHead>
                    <TableHead className="text-right">Hari/Jam</TableHead>
                    <TableHead>Catatan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendance.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        Belum ada presensi bulan ini
                      </TableCell>
                    </TableRow>
                  ) : (
                    attendance.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="text-sm">{a.date}</TableCell>
                        <TableCell className="text-sm font-medium">{a.employee?.name ?? "—"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground capitalize">{a.module ?? "—"}</TableCell>
                        <TableCell className="text-right text-sm">{a.hours_or_days}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{a.notes ?? "—"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Karyawan tab ─────────────────────────────────────── */}
        <TabsContent value="karyawan">
          <Card className="surface-raised">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Data Karyawan</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Jabatan</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead className="text-right">Tarif Dasar</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        Belum ada karyawan
                      </TableCell>
                    </TableRow>
                  ) : (
                    employees.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell className="text-sm font-medium">{e.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{e.role}</TableCell>
                        <TableCell className="text-sm">{TYPE_LABELS[e.type] ?? e.type}</TableCell>
                        <TableCell className="text-right text-sm">{formatRupiah(e.base_rate)}</TableCell>
                        <TableCell>
                          {e.active
                            ? <Badge className="bg-emerald-100 text-emerald-800">Aktif</Badge>
                            : <Badge variant="outline" className="text-muted-foreground">Nonaktif</Badge>
                          }
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageShell>
  )
}
