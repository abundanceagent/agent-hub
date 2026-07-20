import { Suspense } from 'react'
import { createServiceClient } from '@/lib/supabase/server'
import { formatPrice, formatSqm, statusColor, isPdfUrl } from '@/lib/utils'
import type { Corridor, ListingStatus } from '@/types/database'
import StockFilters from './StockFilters'
import PrintButton from './PrintButton'

interface PageProps {
  searchParams: Promise<{ corridor?: string; status?: string; search?: string }>
}

export default async function StockPage({ searchParams }: PageProps) {
  const { corridor, status, search } = await searchParams

  const supabase = await createServiceClient()
  const showPrices = true

  let query = supabase.from('listings_partner_view').select('*')

  if (corridor) {
    query = query.eq('corridor', corridor as Corridor)
  }
  if (status) {
    query = query.eq('status', status as ListingStatus)
  }

  const { data: listings } = await query.order('created_at', { ascending: false })

  const filtered = (listings ?? []).filter((l) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      l.suburb.toLowerCase().includes(q) ||
      (l.estate?.toLowerCase().includes(q) ?? false)
    )
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Investment Stock</h1>
        <p className="text-sm text-slate-500">{filtered.length} listing{filtered.length !== 1 ? 's' : ''} available</p>
      </div>

      <div className="mb-6">
        <Suspense>
          <StockFilters />
        </Suspense>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <svg className="w-12 h-12 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <p className="text-slate-500 font-medium">No listings found</p>
          <p className="text-sm text-slate-400 mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((listing) => (
            <div key={listing.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              {/* Facade image */}
              <div className="h-48 bg-slate-100 relative overflow-hidden">
                {listing.facade_image_url && !isPdfUrl(listing.facade_image_url) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={listing.facade_image_url}
                    alt={`${listing.suburb} facade`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Card content */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h2 className="font-semibold text-slate-900">{listing.suburb}</h2>
                    {listing.estate && <p className="text-sm text-slate-500">{listing.estate}</p>}
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${statusColor(listing.status)}`}>
                    {listing.status}
                  </span>
                </div>

                {listing.corridor && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 mb-3">
                    {listing.corridor}
                  </span>
                )}

                <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Land</p>
                    <p className="text-slate-700 font-medium">{formatSqm(listing.land_size_sqm)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">House</p>
                    <p className="text-slate-700 font-medium">{formatSqm(listing.house_sqm)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Weekly Rent Est.</p>
                    <p className="text-slate-700 font-medium">
                      {listing.weekly_rent_estimate != null ? `${formatPrice(listing.weekly_rent_estimate)}/wk` : '—'}
                    </p>
                  </div>
                  {showPrices && (
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Total Package</p>
                      <p className="text-slate-900 font-bold">{formatPrice(listing.total_package)}</p>
                    </div>
                  )}
                </div>

                <PrintButton />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
