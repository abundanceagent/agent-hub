'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

const CORRIDORS = ['Moreton Bay', 'Ipswich', 'Sunshine Coast', 'Logan', 'Gold Coast']
const STATUSES = ['Available', 'Hold', 'Under contract', 'Sold']

export default function FilterBar() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const corridor = searchParams.get('corridor') ?? ''
  const status = searchParams.get('status') ?? ''
  const q = searchParams.get('q') ?? ''

  const update = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`${pathname}?${params.toString()}`)
  }, [router, pathname, searchParams])

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <input
        type="text"
        placeholder="Search suburb, estate, builder..."
        value={q}
        onChange={e => update('q', e.target.value)}
        className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
      />
      <select
        value={corridor}
        onChange={e => update('corridor', e.target.value)}
        className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
      >
        <option value="">All corridors</option>
        {CORRIDORS.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
      <select
        value={status}
        onChange={e => update('status', e.target.value)}
        className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
      >
        <option value="">All statuses</option>
        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
    </div>
  )
}
