import { Document, Page, View, Text } from "@react-pdf/renderer"
import { styles } from "./styles"
import { formatRupiah, formatNumber } from "@/lib/utils/format"

type DuckRow = {
  date: string
  eggs_total: number
  eggs_reject: number
  feed_consumed_kg: number
  feed_cost: number
}

type SaleRow = {
  date: string
  customer_name: string
  product_type: string
  quantity: number
  total: number
  payment_status: string
}

type Props = {
  month: string
  totalEggs: number
  totalReject: number
  totalFeedCost: number
  totalRevenue: number
  hppPerButir: number
  rows: DuckRow[]
  sales: SaleRow[]
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short" })
}

export function BebekReport({ month, totalEggs, totalReject, totalFeedCost, totalRevenue, hppPerButir, rows, sales }: Props) {
  const bersih = totalEggs - totalReject
  const estimasiLaba = totalRevenue - totalFeedCost

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Laporan Bebek & Telur</Text>
            <Text style={styles.subtitle}>Kebun Lamira · Sulawesi Tengah · {month}</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.badgeLabel}>Dicetak</Text>
            <Text style={styles.badgeValue}>{new Date().toLocaleDateString("id-ID")}</Text>
          </View>
        </View>

        {/* KPIs */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Telur Bersih</Text>
            <Text style={styles.kpiValue}>{formatNumber(bersih)}</Text>
            <Text style={styles.kpiSub}>{formatNumber(totalReject)} reject</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Total Biaya Pakan</Text>
            <Text style={styles.kpiValue}>{formatRupiah(totalFeedCost)}</Text>
            <Text style={styles.kpiSub}>HPP: {formatRupiah(hppPerButir)}/butir</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Pendapatan</Text>
            <Text style={styles.kpiValue}>{formatRupiah(totalRevenue)}</Text>
            <Text style={styles.kpiSub}>Laba est.: {formatRupiah(estimasiLaba)}</Text>
          </View>
        </View>

        {/* Production table */}
        <Text style={styles.sectionTitle}>Log Produksi Harian</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>Tanggal</Text>
            <Text style={[styles.tableHeaderCell, { textAlign: "right" }]}>Total</Text>
            <Text style={[styles.tableHeaderCell, { textAlign: "right" }]}>Reject</Text>
            <Text style={[styles.tableHeaderCell, { textAlign: "right" }]}>Bersih</Text>
            <Text style={[styles.tableHeaderCell, { textAlign: "right" }]}>Pakan (kg)</Text>
            <Text style={[styles.tableHeaderCell, { textAlign: "right" }]}>Biaya Pakan</Text>
          </View>
          {rows.map((r, i) => (
            <View key={r.date} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
              <Text style={[styles.tableCell, { flex: 1.2 }]}>{fmt(r.date)}</Text>
              <Text style={styles.tableCellRight}>{formatNumber(r.eggs_total)}</Text>
              <Text style={styles.tableCellRight}>{formatNumber(r.eggs_reject)}</Text>
              <Text style={styles.tableCellRight}>{formatNumber(r.eggs_total - r.eggs_reject)}</Text>
              <Text style={styles.tableCellRight}>{r.feed_consumed_kg}</Text>
              <Text style={styles.tableCellRight}>{formatRupiah(r.feed_cost)}</Text>
            </View>
          ))}
        </View>

        {/* Sales table */}
        {sales.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Transaksi Penjualan</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>Tanggal</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Pelanggan</Text>
                <Text style={styles.tableHeaderCell}>Produk</Text>
                <Text style={[styles.tableHeaderCell, { textAlign: "right" }]}>Qty</Text>
                <Text style={[styles.tableHeaderCell, { textAlign: "right" }]}>Total</Text>
                <Text style={styles.tableHeaderCell}>Status</Text>
              </View>
              {sales.map((s, i) => (
                <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                  <Text style={[styles.tableCell, { flex: 1.2 }]}>{fmt(s.date)}</Text>
                  <Text style={[styles.tableCell, { flex: 1.5 }]}>{s.customer_name}</Text>
                  <Text style={styles.tableCell}>{s.product_type === "fresh" ? "Segar" : "Asin"}</Text>
                  <Text style={styles.tableCellRight}>{formatNumber(s.quantity)}</Text>
                  <Text style={styles.tableCellRight}>{formatRupiah(s.total)}</Text>
                  <Text style={styles.tableCell}>{s.payment_status === "paid" ? "Lunas" : "Belum"}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Lamira Dashboard · Laporan Otomatis</Text>
          <Text style={styles.footerText}>Kebun Lamira, Sulawesi Tengah</Text>
        </View>
      </Page>
    </Document>
  )
}
