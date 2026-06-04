export function formatPrice(n: number | null | undefined): string {
  if (n == null) return '—'
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(n)
}

export function formatSqm(n: number | null | undefined): string {
  if (n == null) return '—'
  return `${n.toLocaleString()} sqm`
}

export function statusColor(status: string): string {
  switch (status) {
    case 'Available':
      return 'text-green-600 bg-green-50'
    case 'Under contract':
      return 'text-amber-600 bg-amber-50'
    case 'Sold':
      return 'text-red-600 bg-red-50'
    default:
      return 'text-slate-600 bg-slate-50'
  }
}
