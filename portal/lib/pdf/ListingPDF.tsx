import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from '@react-pdf/renderer'
import type { Listing } from '@/types/database'

function formatPrice(n: number | null | undefined): string {
  if (n == null) return '—'
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(n)
}

function formatSqm(n: number | null | undefined): string {
  if (n == null) return '—'
  return `${n.toLocaleString()} sqm`
}

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 11,
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 50,
    color: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
  },
  headerDate: {
    fontSize: 9,
    color: '#64748b',
  },
  propertyTitle: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  propertySubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 16,
  },
  statusBadge: {
    fontSize: 9,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
    backgroundColor: '#f0fdf4',
    color: '#15803d',
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  image: {
    width: '100%',
    height: 200,
    objectFit: 'cover',
    borderRadius: 6,
    marginBottom: 16,
  },
  floorPlanImage: {
    width: '100%',
    height: 180,
    objectFit: 'contain',
    borderRadius: 6,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 16,
  },
  table: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  lastRow: {
    flexDirection: 'row',
  },
  cell: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  cellLabel: {
    fontSize: 9,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  cellValue: {
    fontSize: 11,
    color: '#0f172a',
  },
  highlightValue: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 50,
    right: 50,
    textAlign: 'center',
    fontSize: 8,
    color: '#94a3b8',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 8,
  },
})

interface Props {
  listing: Listing
  generatedDate: string
}

export function ListingPDF({ listing, generatedDate }: Props) {
  const statusColors: Record<string, { bg: string; text: string }> = {
    'Available': { bg: '#f0fdf4', text: '#15803d' },
    'Under contract': { bg: '#fffbeb', text: '#b45309' },
    'Sold': { bg: '#fef2f2', text: '#b91c1c' },
  }
  const sc = statusColors[listing.status] ?? { bg: '#f8fafc', text: '#475569' }

  const rows = [
    { label: 'Suburb', value: listing.suburb },
    { label: 'Estate', value: listing.estate ?? '—' },
    { label: 'Corridor', value: listing.corridor ?? '—' },
    { label: 'Land size', value: formatSqm(listing.land_size_sqm) },
    { label: 'House size', value: formatSqm(listing.house_sqm) },
    { label: 'Builder', value: listing.builder ?? '—' },
    { label: 'House design', value: listing.house_design ?? '—' },
    { label: 'Total package', value: formatPrice(listing.total_package), highlight: true },
    {
      label: 'Est. weekly rent',
      value: listing.weekly_rent_estimate != null ? `${formatPrice(listing.weekly_rent_estimate)}/wk` : '—',
    },
    { label: 'Status', value: listing.status },
  ]

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Investment Stock Portal</Text>
          <Text style={styles.headerDate}>Generated {generatedDate}</Text>
        </View>

        {/* Title */}
        <Text style={styles.propertyTitle}>{listing.suburb}</Text>
        {listing.estate && <Text style={styles.propertySubtitle}>{listing.estate}</Text>}

        {/* Status */}
        <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
          <Text style={{ color: sc.text, fontSize: 9 }}>{listing.status}</Text>
        </View>

        {/* Facade image */}
        {listing.facade_image_url && (
          <Image src={listing.facade_image_url} style={styles.image} />
        )}

        {/* Floor plan */}
        {listing.floor_plan_image_url && (
          <>
            <Text style={styles.sectionTitle}>Floor Plan</Text>
            <Image src={listing.floor_plan_image_url} style={styles.floorPlanImage} />
          </>
        )}

        {/* Details table */}
        <Text style={styles.sectionTitle}>Property Details</Text>
        <View style={styles.table}>
          {rows.map((row, i) => (
            <View key={row.label} style={i < rows.length - 1 ? styles.row : styles.lastRow}>
              <View style={styles.cell}>
                <Text style={styles.cellLabel}>{row.label}</Text>
                <Text style={row.highlight ? styles.highlightValue : styles.cellValue}>{row.value}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Generated {generatedDate} · Confidential — not for distribution
        </Text>
      </Page>
    </Document>
  )
}
