import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from '@react-pdf/renderer'
import type { Listing } from '@/types/database'

const NAVY = '#1e2a32'
const GOLD = '#b08d57'
const CREAM = '#f5f2ec'
const MUTED = '#6b7280'
const LINE = '#e6e0d4'

function fmtPrice(n: number | null | undefined): string {
  if (n == null) return '—'
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(n)
}
function fmtSqm(n: number | null | undefined): string {
  if (n == null) return '—'
  return `${n.toLocaleString()} sqm`
}
function isPdf(u: string | null | undefined): boolean {
  return !!u && u.toLowerCase().endsWith('.pdf')
}

const s = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 10, color: NAVY, paddingBottom: 70 },
  header: {
    backgroundColor: NAVY,
    paddingHorizontal: 40,
    paddingVertical: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brand: { fontFamily: 'Times-Bold', fontSize: 18, color: '#ffffff', letterSpacing: 1 },
  brandGold: { color: GOLD },
  headerRight: { fontSize: 8, color: '#c9c3b6', textTransform: 'uppercase', letterSpacing: 1 },
  body: { paddingHorizontal: 40, paddingTop: 22 },
  facade: { width: '100%', height: 230, objectFit: 'cover', borderRadius: 4, marginBottom: 18 },
  title: { fontFamily: 'Times-Bold', fontSize: 24, color: NAVY },
  subtitle: { fontSize: 12, color: MUTED, marginTop: 2, marginBottom: 12 },
  badgeRow: { flexDirection: 'row', gap: 6, marginBottom: 18 },
  badge: { fontSize: 8, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99, letterSpacing: 0.5 },
  sectionTitle: {
    fontSize: 9, fontFamily: 'Helvetica-Bold', color: GOLD, textTransform: 'uppercase',
    letterSpacing: 1, marginBottom: 8, marginTop: 6,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '50%', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: LINE },
  cellLabel: { fontSize: 8, color: MUTED, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  cellValue: { fontSize: 11, color: NAVY },
  totalBox: {
    backgroundColor: CREAM, borderRadius: 6, padding: 14, marginTop: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  totalLabel: { fontSize: 9, color: MUTED, textTransform: 'uppercase', letterSpacing: 1 },
  totalValue: { fontFamily: 'Times-Bold', fontSize: 22, color: NAVY },
  rentValue: { fontSize: 12, color: GOLD, fontFamily: 'Helvetica-Bold' },
  floorPlan: { width: '100%', height: 220, objectFit: 'contain', marginTop: 6, borderWidth: 1, borderColor: LINE, borderRadius: 4 },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: NAVY,
    paddingHorizontal: 40, paddingVertical: 14,
  },
  footerBrand: { fontFamily: 'Times-Bold', fontSize: 11, color: '#ffffff', marginBottom: 4 },
  footerLine: { fontSize: 8, color: '#c9c3b6' },
})

const statusColors: Record<string, { bg: string; fg: string }> = {
  'Available': { bg: '#e8f3ec', fg: '#256b45' },
  'Hold': { bg: '#eaf0f8', fg: '#1d4ed8' },
  'Under contract': { bg: '#faf1e2', fg: '#a3671a' },
  'Sold': { bg: '#f8ecec', fg: '#a33131' },
}

interface Props {
  listing: Listing
  generatedDate: string
}

export function ListingPDF({ listing, generatedDate }: Props) {
  const sc = statusColors[listing.status] ?? { bg: '#eee', fg: NAVY }
  const pkg = listing.package_type ?? 'House & Land'

  const rows = [
    { label: 'Package type', value: pkg },
    { label: 'Corridor', value: listing.corridor ?? '—' },
    { label: 'Land size', value: fmtSqm(listing.land_size_sqm) },
    { label: 'House size', value: fmtSqm(listing.house_sqm) },
    { label: 'Builder', value: listing.builder ?? '—' },
    { label: 'House design', value: listing.house_design ?? '—' },
    { label: 'Land price', value: fmtPrice(listing.land_price) },
    { label: 'Build price', value: fmtPrice(listing.build_price) },
  ]

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <Text style={s.brand}>BOLD <Text style={s.brandGold}>INVEST</Text></Text>
          <Text style={s.headerRight}>Investment Property Package</Text>
        </View>

        <View style={s.body}>
          {listing.facade_image_url && !isPdf(listing.facade_image_url) && (
            <Image src={listing.facade_image_url} style={s.facade} />
          )}

          <Text style={s.title}>{listing.suburb}</Text>
          {listing.estate ? <Text style={s.subtitle}>{listing.estate}</Text> : <View style={{ height: 8 }} />}

          <View style={s.badgeRow}>
            <Text style={[s.badge, { backgroundColor: sc.bg, color: sc.fg }]}>{listing.status}</Text>
            <Text style={[s.badge, { backgroundColor: '#efe9dd', color: '#7a5c2e' }]}>{pkg}</Text>
            {listing.corridor ? (
              <Text style={[s.badge, { backgroundColor: '#eceae4', color: MUTED }]}>{listing.corridor}</Text>
            ) : null}
          </View>

          <Text style={s.sectionTitle}>Property details</Text>
          <View style={s.grid}>
            {rows.map((r) => (
              <View key={r.label} style={s.cell}>
                <Text style={s.cellLabel}>{r.label}</Text>
                <Text style={s.cellValue}>{r.value}</Text>
              </View>
            ))}
          </View>

          <View style={s.totalBox}>
            <View>
              <Text style={s.totalLabel}>Total package</Text>
              <Text style={s.totalValue}>{fmtPrice(listing.total_package)}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={s.totalLabel}>Est. weekly rent</Text>
              <Text style={s.rentValue}>
                {listing.weekly_rent_estimate != null ? `${fmtPrice(listing.weekly_rent_estimate)}/wk` : '—'}
              </Text>
            </View>
          </View>

          {listing.floor_plan_image_url && !isPdf(listing.floor_plan_image_url) && (
            <>
              <Text style={[s.sectionTitle, { marginTop: 18 }]}>Floor plan</Text>
              <Image src={listing.floor_plan_image_url} style={s.floorPlan} />
            </>
          )}
        </View>

        <View style={s.footer} fixed>
          <Text style={s.footerBrand}>BOLD INVEST</Text>
          <Text style={s.footerLine}>0407 020 122  ·  b.olsen@boldinvest.com.au  ·  71 Stapylton Street, North Lakes QLD 4509</Text>
          <Text style={[s.footerLine, { marginTop: 3 }]}>Generated {generatedDate}  ·  Confidential — not for public distribution</Text>
        </View>
      </Page>
    </Document>
  )
}
