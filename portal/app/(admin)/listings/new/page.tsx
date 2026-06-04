import Link from 'next/link'
import { createListing } from '@/lib/actions/listings'
import ListingForm from '../ListingForm'

export default function NewListingPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link href="/dashboard" className="text-sm text-slate-500 hover:text-slate-900">← Back to dashboard</Link>
        <h1 className="text-2xl font-bold text-slate-900 mt-2">Add listing</h1>
      </div>

      <ListingForm
        action={createListing}
        submitLabel="Create listing"
      />
    </div>
  )
}
