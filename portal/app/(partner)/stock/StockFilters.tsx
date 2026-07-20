'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import type { Corridor, ListingStatus } from '@/types/database'

const CORRIDORS: Corridor[] = ['Moreton Bay', 'Ipswich', 'Sunshine Coast', 'Logan', 'Gold Coast']
const STATUSES: ListingStatus[] = ['Available', 'Hold', 'Under contract', 'Sold']

export default function StockFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const corridor = searchParams.get('corridor') ?? ''
  const status = searchParams.get('status') ?? ''
  const search = searchParams.get('search') ?? ''

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      router.push(`/stock?${params.toString()}`)
    },
    [router, searchParams]
  )

  return (
    <div className="flex flex-wrap gap-3">
      <input
        type="text"
        placeholder="Search suburb or estate..."
        value={search}
        onChange={(e) => update('search', e.target.value)}
        className="flex-1 min-w-48 px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
      />
      <select
        value={corridor}
        onChange={(e) => update('corridor', e.target.value)}
        className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
      >
        <option value="">All corridors</option>
        {CORRIDORS.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
      <select
        value={status}
        onChange={(e) => update('status', e.target.value)}
        className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
      >
        <option value="">All statuses</option>
        {STATUSES.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
    </div>
  )
}
