import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatPrice, formatSqm, statusColor, isPdfUrl } from '@/lib/utils'
import type { Profile, ActivityLog } from '@/types/database'
import PdfButton from './PdfButton'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ListingDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const p = profile as Profile | null
  const isAdmin = p?.role === 'admin'
  const isAdminOrTeam = p?.role === 'admin' || p?.role === 'team'

  const { data: listing } = await supabase.from('listings').select('*').eq('id', id).single()

  if (!listing) notFound()

  // Activity logs (admin only)
  let activityLogs: ActivityLog[] = []
  if (isAdmin) {
    const { data: logs } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('listing_id', id)
      .order('timestamp', { ascending: false })
      .limit(50)
    activityLogs = (logs ?? []) as ActivityLog[]
  }

  return (
    <div className="max-w-5xl mx-auto pb-12">
      {/* Breadcrumb */}
      <div className="px-6 pt-6 pb-2">
        <Link href="/dashboard" className="text-sm text-slate-500 hover:text-slate-900">← Back to dashboard</Link>
      </div>

      {/* Facade image */}
      <div className="relative h-80 bg-slate-100 mx-6 rounded-xl overflow-hidden mb-6">
        {listing.facade_image_url && !isPdfUrl(listing.facade_image_url) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={listing.facade_image_url}
            alt={`${listing.suburb} facade`}
            className="w-full h-full object-cover"
          />
        ) : listing.facade_image_url ? (
          <a href={listing.facade_image_url} target="_blank" rel="noopener noreferrer" className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-500 hover:text-slate-900">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
            <span className="text-sm font-medium">Open document (PDF)</span>
          </a>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-16 h-16 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
        )}
      </div>

      <div className="px-6">
        {/* Title + actions */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{listing.suburb}</h1>
            {listing.estate && <p className="text-slate-500">{listing.estate}</p>}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <PdfButton listing={listing} />
            {isAdminOrTeam && (
              <Link
                href={`/listings/${listing.id}/edit`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </Link>
            )}
          </div>
        </div>

        {/* Main content: floor plan + details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Floor plan */}
          <div>
            {listing.floor_plan_image_url && isPdfUrl(listing.floor_plan_image_url) ? (
              <div className="rounded-xl overflow-hidden border border-slate-200">
                <iframe src={listing.floor_plan_image_url} title="Floor plan" className="w-full h-96 bg-white" />
                <a href={listing.floor_plan_image_url} target="_blank" rel="noopener noreferrer" className="block text-center text-sm text-slate-600 underline py-2">Open floor plan (PDF)</a>
              </div>
            ) : listing.floor_plan_image_url ? (
              <div className="rounded-xl overflow-hidden border border-slate-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={listing.floor_plan_image_url}
                  alt="Floor plan"
                  className="w-full object-contain bg-white"
                />
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 h-48 flex items-center justify-center">
                <p className="text-sm text-slate-400">No floor plan uploaded</p>
              </div>
            )}
          </div>

          {/* Details grid */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor(listing.status)}`}>
                {listing.status}
              </span>
              {listing.corridor && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                  {listing.corridor}
                </span>
              )}
            </div>

            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              <div>
                <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Package</dt>
                <dd className="mt-0.5 text-lg font-bold text-slate-900">{formatPrice(listing.total_package)}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Weekly Rent Est.</dt>
                <dd className="mt-0.5 text-sm font-semibold text-slate-900">
                  {listing.weekly_rent_estimate != null ? `${formatPrice(listing.weekly_rent_estimate)}/wk` : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Land Price</dt>
                <dd className="mt-0.5 text-sm text-slate-900">{formatPrice(listing.land_price)}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Build Price</dt>
                <dd className="mt-0.5 text-sm text-slate-900">{formatPrice(listing.build_price)}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Land Size</dt>
                <dd className="mt-0.5 text-sm text-slate-900">{formatSqm(listing.land_size_sqm)}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">House Size</dt>
                <dd className="mt-0.5 text-sm text-slate-900">{formatSqm(listing.house_sqm)}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Builder</dt>
                <dd className="mt-0.5 text-sm text-slate-900">{listing.builder ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">House Design</dt>
                <dd className="mt-0.5 text-sm text-slate-900">{listing.house_design ?? '—'}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Listed</dt>
                <dd className="mt-0.5 text-sm text-slate-900">
                  {new Date(listing.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Notes (admin/team only) */}
        {isAdminOrTeam && listing.notes && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <h3 className="text-sm font-semibold text-amber-800 mb-1">Notes</h3>
            <p className="text-sm text-amber-700 whitespace-pre-wrap">{listing.notes}</p>
          </div>
        )}

        {/* Activity log (admin only) */}
        {isAdmin && activityLogs.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">Activity</h2>
            <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
              {activityLogs.map((log) => (
                <div key={log.id} className="px-4 py-3 flex items-start justify-between gap-4">
                  <p className="text-sm text-slate-700">{log.action}</p>
                  <time className="text-xs text-slate-400 flex-shrink-0">
                    {new Date(log.timestamp).toLocaleString('en-AU', { dateStyle: 'short', timeStyle: 'short' })}
                  </time>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
