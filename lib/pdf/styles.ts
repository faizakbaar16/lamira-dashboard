import { StyleSheet, Font } from "@react-pdf/renderer"

// Use system fonts to avoid network calls
const FOREST = "#1a3a2a"
const GOLD = "#c9a227"
const CREAM = "#f7f3ec"
const MUTED = "#6b7280"
const BORDER = "#e5e7eb"

export const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    padding: 36,
    backgroundColor: "#ffffff",
    color: "#111827",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: FOREST,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: FOREST,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 10,
    color: MUTED,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  badgeLabel: {
    fontSize: 8,
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  badgeValue: {
    fontSize: 10,
    color: FOREST,
    fontFamily: "Helvetica-Bold",
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: FOREST,
    marginBottom: 8,
    marginTop: 16,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  kpiRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: CREAM,
    borderRadius: 6,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: FOREST,
  },
  kpiLabel: {
    fontSize: 8,
    color: MUTED,
    marginBottom: 3,
    textTransform: "uppercase",
  },
  kpiValue: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: FOREST,
  },
  kpiSub: {
    fontSize: 8,
    color: MUTED,
    marginTop: 2,
  },
  table: {
    width: "100%",
    marginTop: 4,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: FOREST,
    borderRadius: 4,
    padding: "4 6",
  },
  tableHeaderCell: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    flex: 1,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    padding: "4 6",
  },
  tableRowAlt: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    padding: "4 6",
    backgroundColor: CREAM,
  },
  tableCell: {
    fontSize: 8,
    color: "#374151",
    flex: 1,
  },
  tableCellRight: {
    fontSize: 8,
    color: "#374151",
    flex: 1,
    textAlign: "right",
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 36,
    right: 36,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 6,
  },
  footerText: {
    fontSize: 7,
    color: MUTED,
  },
  goldAccent: {
    color: GOLD,
  },
})
