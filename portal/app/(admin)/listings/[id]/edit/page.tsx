import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { updateListing, deleteListing } from '@/lib/actions/listings'
import type { Profile, Listing } from '@/types/database'
import ListingForm from '../../ListingForm'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditListingPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const p = profile as Profile | null
  const isAdmin = p?.role === 'admin'

  const { data: listing } = await supabase.from('listings').select('*').eq('id', id).single()
  if (!listing) notFound()

  const updateWithId = updateListing.bind(null, id)
  const deleteWithId = deleteListing.bind(null, id)

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link href={`/listings/${id}`} className="text-sm text-slate-500 hover:text-slate-900">← Back to listing</Link>
        <h1 className="text-2xl font-bold text-slate-900 mt-2">Edit listing</h1>
        <p className="text-sm text-slate-500">{listing.suburb}{listing.estate ? ` — ${listing.estate}` : ''}</p>
      </div>

      <ListingForm
        listing={listing as Listing}
        action={updateWithId}
        submitLabel="Save changes"
        deleteAction={isAdmin ? deleteWithId : null}
        isAdmin={isAdmin}
      />
    </div>
  )
}
