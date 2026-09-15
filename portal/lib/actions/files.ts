'use server'

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { logActivity } from './activity'
import { revalidatePath } from 'next/cache'

async function uploadFile(file: File, path: string): Promise<string | null> {
  const service = await createServiceClient()
  const buf = new Uint8Array(await file.arrayBuffer())
  const ext = file.name.includes('.') ? file.name.split('.').pop()!.toLowerCase() : 'bin'
  const full = `${path}.${ext}`
  const { error } = await service.storage
    .from('listing-images')
    .upload(full, buf, { contentType: file.type || 'application/octet-stream', upsert: true })
  if (error) {
    console.error('file upload error:', error)
    return null
  }
  return service.storage.from('listing-images').getPublicUrl(full).data.publicUrl
}

export async function addListingFile(listingId: string, formData: FormData): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized — please sign in again.' }

  const category = (formData.get('category') as string) || 'Other'
  const file = formData.get('file') as File | null
  if (!file || file.size === 0) return { error: 'Choose a file to upload.' }

  const url = await uploadFile(file, `listings/${listingId}/files/${Date.now()}`)
  if (!url) return { error: 'Upload failed — check the storage bucket exists.' }

  const service = await createServiceClient()
  const { error } = await service.from('listing_files').insert({
    listing_id: listingId,
    category,
    name: file.name,
    url,
  })
  if (error) return { error: error.message }

  await logActivity(user.id, `Added file (${category}): ${file.name}`, listingId)
  revalidatePath(`/listings/${listingId}`)
  return {}
}

export async function deleteListingFile(id: string, listingId: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const service = await createServiceClient()
  await service.from('listing_files').delete().eq('id', id)
  await logActivity(user.id, 'Removed a listing file', listingId)
  revalidatePath(`/listings/${listingId}`)
}
