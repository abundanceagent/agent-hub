import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/types/database'

const PAGE_SIZE = 20

interface PageProps {
  searchParams: Promise<{ user?: string; from?: string; to?: string; page?: string }>
}

export default async function LogsPage({ searchParams }: PageProps) {
  const { user: filterUser, from, to, page: pageStr } = await searchParams
  const page = Math.max(1, parseInt(pageStr ?? '1', 10))

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const p = profile as Profile | null
  if (p?.role !== 'admin') redirect('/dashboard')

  // Fetch all users for filter dropdown
  const { data: profilesData } = await supabase.from('profiles').select('id, name, email').order('name')
  const allUsers = (profilesData ?? []) as Pick<Profile, 'id' | 'name' | 'email'>[]

  // Build query
  let query = supabase
    .from('activity_logs')
    .select('*', { count: 'exact' })
    .order('timestamp', { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

  if (filterUser) {
    query = query.eq('user_id', filterUser)
  }
  if (from) {
    query = query.gte('timestamp', from)
  }
  if (to) {
    // include the full day
    query = query.lte('timestamp', `${to}T23:59:59`)
  }

  const { data: logs, count } = await query

  // Fetch profiles for the users in this page
  const userIds = [...new Set((logs ?? []).map((l) => l.user_id).filter(Boolean))] as string[]
  const { data: pageProfiles } = userIds.length > 0
    ? await supabase.from('profiles').select('id, name, email').in('id', userIds)
    : { data: [] }
  const profileMap = new Map((pageProfiles ?? []).map((p) => [p.id, p as Pick<Profile, 'id' | 'name' | 'email'>]))

  // Fetch listings for the logs that have listing_id
  const listingIds = [...new Set((logs ?? []).map((l) => l.listing_id).filter(Boolean))] as string[]
  const { data: listingsData } = listingIds.length > 0
    ? await supabase.from('listings').select('id, suburb, estate').in('id', listingIds)
    : { data: [] }
  const listingMap = new Map((listingsData ?? []).map((l) => [l.id, l as { id: string; suburb: string; estate: string | null }]))

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  function buildUrl(params: Record<string, string | undefined>) {
    const p = new URLSearchParams()
    const merged = { user: filterUser, from, to, ...params }
    for (const [k, v] of Object.entries(merged)) {
      if (v) p.set(k, v)
    }
    return `/logs?${p.toString()}`
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Activity Logs</h1>
        <p className="text-sm text-slate-500 mt-0.5">{count ?? 0} total events</p>
      </div>

      {/* Filters */}
      <form method="GET" action="/logs" className="flex flex-wrap gap-3 mb-6">
        <select
          name="user"
          defaultValue={filterUser ?? ''}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
        >
          <option value="">All users</option>
          {allUsers.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name ?? u.email ?? u.id}
            </option>
          ))}
        </select>
        <input
          type="date"
          name="from"
          defaultValue={from ?? ''}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
        />
        <input
          type="date"
          name="to"
          defaultValue={to ?? ''}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
        />
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
        >
          Filter
        </button>
        {(filterUser || from || to) && (
          <Link
            href="/logs"
            className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Clear
          </Link>
        )}
      </form>

      {(!logs || logs.length === 0) ? (
        <div className="text-center py-20 bg-white border border-slate-200 rounded-xl">
          <svg className="w-10 h-10 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-slate-500">No activity logs found</p>
        </div>
      ) : (
        <>
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Timestamp</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">User</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Action</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Listing</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => {
                  const u = log.user_id ? profileMap.get(log.user_id) : null
                  const listing = log.listing_id ? listingMap.get(log.listing_id) : null
                  return (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString('en-AU', { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {u ? (u.name ?? u.email ?? log.user_id) : (log.user_id ?? '—')}
                      </td>
                      <td className="px-4 py-3 text-slate-700">{log.action}</td>
                      <td className="px-4 py-3">
                        {listing ? (
                          <Link
                            href={`/listings/${listing.id}`}
                            className="text-slate-900 hover:underline font-medium"
                          >
                            {listing.suburb}{listing.estate ? ` — ${listing.estate}` : ''}
                          </Link>
                        ) : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              {page > 1 && (
                <Link
                  href={buildUrl({ page: String(page - 1) })}
                  className="px-3 py-1.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  ← Prev
                </Link>
              )}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((n) => Math.abs(n - page) <= 2 || n === 1 || n === totalPages)
                .map((n, idx, arr) => (
                  <>
                    {idx > 0 && arr[idx - 1] !== n - 1 && (
                      <span key={`ellipsis-${n}`} className="text-slate-400 px-1">…</span>
                    )}
                    <Link
                      key={n}
                      href={buildUrl({ page: String(n) })}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors ${
                        n === page
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {n}
                    </Link>
                  </>
                ))}
              {page < totalPages && (
                <Link
                  href={buildUrl({ page: String(page + 1) })}
                  className="px-3 py-1.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  Next →
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
