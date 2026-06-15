import { Document, Page, View, Text } from "@react-pdf/renderer"
import { styles } from "./styles"
import { formatRupiah } from "@/lib/utils/format"

type PayrollRow = {
  name: string
  role: string
  type: string
  days_or_hours: number
  gross_pay: number
  deductions: number
  net_pay: number
  status: string
}

type Props = {
  month: string
  year: number
  monthNum: number
  rows: PayrollRow[]
  totalGross: number
  totalNet: number
}

const MONTH_NAMES = ["", "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"]

export function PayrollReport({ month, year, monthNum, rows, totalGross, totalNet }: Props) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Laporan Penggajian</Text>
            <Text style={styles.subtitle}>Kebun Lamira · {MONTH_NAMES[monthNum]} {year}</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.badgeLabel}>Dicetak</Text>
            <Text style={styles.badgeValue}>{new Date().toLocaleDateString("id-ID")}</Text>
          </View>
        </View>

        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Total Karyawan</Text>
            <Text style={styles.kpiValue}>{rows.length}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Total Gaji Kotor</Text>
            <Text style={styles.kpiValue}>{formatRupiah(totalGross)}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Total Gaji Bersih</Text>
            <Text style={styles.kpiValue}>{formatRupiah(totalNet)}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Daftar Gaji Karyawan</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Nama</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>Jabatan</Text>
            <Text style={styles.tableHeaderCell}>Tipe</Text>
            <Text style={[styles.tableHeaderCell, { textAlign: "right" }]}>Kotor</Text>
            <Text style={[styles.tableHeaderCell, { textAlign: "right" }]}>Potongan</Text>
            <Text style={[styles.tableHeaderCell, { textAlign: "right" }]}>Bersih</Text>
            <Text style={styles.tableHeaderCell}>Status</Text>
          </View>
          {rows.map((r, i) => (
            <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
              <Text style={[styles.tableCell, { flex: 1.5 }]}>{r.name}</Text>
              <Text style={[styles.tableCell, { flex: 1.2 }]}>{r.role}</Text>
              <Text style={styles.tableCell}>{r.type}</Text>
              <Text style={styles.tableCellRight}>{formatRupiah(r.gross_pay)}</Text>
              <Text style={styles.tableCellRight}>{formatRupiah(r.deductions)}</Text>
              <Text style={styles.tableCellRight}>{formatRupiah(r.net_pay)}</Text>
              <Text style={styles.tableCell}>{r.status === "paid" ? "Lunas" : "Pending"}</Text>
            </View>
          ))}
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Lamira Dashboard · Laporan Penggajian Otomatis</Text>
          <Text style={styles.footerText}>Konfidensial · Kebun Lamira</Text>
        </View>
      </Page>
    </Document>
  )
}
