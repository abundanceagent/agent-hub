'use client'

import { useRef } from 'react'
import type { Listing } from '@/types/database'
import { isPdfUrl } from '@/lib/utils'

const CORRIDORS = ['Moreton Bay', 'Ipswich', 'Sunshine Coast', 'Logan', 'Gold Coast'] as const
const STATUSES = ['Available', 'Hold', 'Under contract', 'Sold'] as const

interface ListingFormProps {
  listing?: Listing | null
  action: (formData: FormData) => Promise<void>
  submitLabel?: string
  deleteAction?: (() => Promise<void>) | null
  isAdmin?: boolean
}

export default function ListingForm({
  listing,
  action,
  submitLabel = 'Save listing',
  deleteAction,
  isAdmin = false,
}: ListingFormProps) {
  const formRef = useRef<HTMLFormElement>(null)

  return (
    <form ref={formRef} action={action} className="space-y-6">
      {/* Basic info */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Property details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Suburb <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="suburb"
              required
              defaultValue={listing?.suburb ?? ''}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Estate</label>
            <input
              type="text"
              name="estate"
              defaultValue={listing?.estate ?? ''}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Corridor</label>
            <select
              name="corridor"
              defaultValue={listing?.corridor ?? ''}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
            >
              <option value="">Select corridor</option>
              {CORRIDORS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Status</label>
            <select
              name="status"
              defaultValue={listing?.status ?? 'Available'}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
            >
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Pricing</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Land price ($)</label>
            <input
              type="number"
              onWheel={(e) => e.currentTarget.blur()}
              name="land_price"
              min={0}
              step={100}
              defaultValue={listing?.land_price ?? ''}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Build price ($)</label>
            <input
              type="number"
              onWheel={(e) => e.currentTarget.blur()}
              name="build_price"
              min={0}
              step={100}
              defaultValue={listing?.build_price ?? ''}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Weekly rent estimate ($)</label>
            <input
              type="number"
              onWheel={(e) => e.currentTarget.blur()}
              name="weekly_rent_estimate"
              min={0}
              defaultValue={listing?.weekly_rent_estimate ?? ''}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Build details */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Build details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Land size (sqm)</label>
            <input
              type="number"
              onWheel={(e) => e.currentTarget.blur()}
              name="land_size_sqm"
              min={0}
              defaultValue={listing?.land_size_sqm ?? ''}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">House size (sqm)</label>
            <input
              type="number"
              onWheel={(e) => e.currentTarget.blur()}
              name="house_sqm"
              min={0}
              defaultValue={listing?.house_sqm ?? ''}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Builder</label>
            <input
              type="text"
              name="builder"
              defaultValue={listing?.builder ?? ''}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">House design</label>
            <input
              type="text"
              name="house_design"
              defaultValue={listing?.house_design ?? ''}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Images */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Images</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Facade image</label>
            {listing?.facade_image_url && (
              isPdfUrl(listing.facade_image_url) ? (
                <a href={listing.facade_image_url} target="_blank" rel="noopener noreferrer" className="mb-2 flex items-center gap-2 text-sm text-slate-600 underline">
                  View current file (PDF)
                </a>
              ) : (
                <div className="mb-2 rounded-lg overflow-hidden border border-slate-200 h-32">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={listing.facade_image_url} alt="Current facade" className="w-full h-full object-cover" />
                </div>
              )
            )}
            <input
              type="file"
              name="facade_image"
              accept="image/png,image/jpeg,image/webp,application/pdf"
              className="w-full text-sm text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Floor plan image</label>
            {listing?.floor_plan_image_url && (
              isPdfUrl(listing.floor_plan_image_url) ? (
                <a href={listing.floor_plan_image_url} target="_blank" rel="noopener noreferrer" className="mb-2 flex items-center gap-2 text-sm text-slate-600 underline">
                  View current floor plan (PDF)
                </a>
              ) : (
                <div className="mb-2 rounded-lg overflow-hidden border border-slate-200 h-32">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={listing.floor_plan_image_url} alt="Current floor plan" className="w-full h-full object-contain bg-white" />
                </div>
              )
            )}
            <input
              type="file"
              name="floor_plan_image"
              accept="image/png,image/jpeg,image/webp,application/pdf"
              className="w-full text-sm text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
            />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Notes</h2>
        <textarea
          name="notes"
          rows={4}
          defaultValue={listing?.notes ?? ''}
          placeholder="Internal notes (visible to admin and team only)..."
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent resize-none"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-4">
        {isAdmin && deleteAction ? (
          <button
            type="submit"
            formAction={deleteAction}
            className="inline-flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors"
            onClick={(e) => {
              if (!confirm('Delete this listing? This cannot be undone.')) {
                e.preventDefault()
              }
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete listing
          </button>
        ) : <div />}

        <button
          type="submit"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  )
}
