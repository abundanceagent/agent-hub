import { Suspense } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatPrice, formatSqm, statusColor } from '@/lib/utils'
import type { Listing } from '@/types/database'
import FilterBar from './FilterBar'

interface PageProps {
  searchParams: Promise<{ corridor?: string; status?: string; q?: string }>
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const params = await searchParams
  const supabase = await createClient()

  // Fetch all listings
  let query = supabase.from('listings').select('*').order('created_at', { ascending: false })

  if (params.corridor) {
    query = query.eq('corridor', params.corridor as NonNullable<Listing['corridor']>)
  }
  if (params.status) {
    query = query.eq('status', params.status as Listing['status'])
  }
  if (params.q) {
    const q = `%${params.q}%`
    query = query.or(`suburb.ilike.${q},estate.ilike.${q},builder.ilike.${q}`)
  }

  const { data: listings } = await query

  // Stats (always unfiltered)
  const { data: allListings } = await supabase.from('listings').select('status')
  const total = allListings?.length ?? 0
  const available = allListings?.filter(l => l.status === 'Available').length ?? 0
  const underContract = allListings?.filter(l => l.status === 'Under contract').length ?? 0
  const sold = allListings?.filter(l => l.status === 'Sold').length ?? 0

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Investment property listings</p>
        </div>
        <Link
          href="/listings/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add listing
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{total}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-medium text-green-600 uppercase tracking-wide">Available</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{available}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-medium text-amber-600 uppercase tracking-wide">Under Contract</p>
          <p className="text-3xl font-bold text-amber-600 mt-1">{underContract}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-medium text-red-600 uppercase tracking-wide">Sold</p>
          <p className="text-3xl font-bold text-red-600 mt-1">{sold}</p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="mb-6">
        <Suspense fallback={null}>
          <FilterBar />
        </Suspense>
      </div>

      {/* Listings grid */}
      {!listings || listings.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
          <svg className="w-12 h-12 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <p className="text-slate-500 text-sm">No listings found</p>
          <Link href="/listings/new" className="mt-3 inline-block text-sm font-medium text-slate-900 underline">
            Add your first listing
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {listings.map((listing) => (
            <Link
              key={listing.id}
              href={`/listings/${listing.id}`}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md hover:border-slate-300 transition-all group"
            >
              {/* Image */}
              <div className="relative h-44 bg-slate-100">
                {listing.facade_image_url ? (
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

              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="font-semibold text-slate-900 group-hover:text-slate-700">
                      {listing.suburb}
                    </p>
                    {listing.estate && (
                      <p className="text-sm text-slate-500">{listing.estate}</p>
                    )}
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${statusColor(listing.status)}`}>
                    {listing.status}
                  </span>
                </div>

                {listing.corridor && (
                  <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-md mb-3">
                    {listing.corridor}
                  </span>
                )}

                <div className="flex items-center justify-between">
                  <p className="text-lg font-bold text-slate-900">{formatPrice(listing.total_package)}</p>
                  <div className="text-xs text-slate-500 text-right">
                    {listing.land_size_sqm && <span>{formatSqm(listing.land_size_sqm)} land</span>}
                    {listing.land_size_sqm && listing.house_sqm && <span> · </span>}
                    {listing.house_sqm && <span>{formatSqm(listing.house_sqm)} house</span>}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
