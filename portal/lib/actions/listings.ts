'use server'

import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { logActivity } from '@/lib/actions/activity'

export async function createListing(formData: FormData) {
  const supabase = await createClient()
  const service = await createServiceClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const suburb = formData.get('suburb') as string
  const estate = formData.get('estate') as string | null
  const corridor = (formData.get('corridor') as string) || null
  const status = (formData.get('status') as string) || 'Available'
  const land_size_sqm = formData.get('land_size_sqm') ? Number(formData.get('land_size_sqm')) : null
  const land_price = formData.get('land_price') ? Number(formData.get('land_price')) : null
  const builder = (formData.get('builder') as string) || null
  const house_design = (formData.get('house_design') as string) || null
  const house_sqm = formData.get('house_sqm') ? Number(formData.get('house_sqm')) : null
  const build_price = formData.get('build_price') ? Number(formData.get('build_price')) : null
  const weekly_rent_estimate = formData.get('weekly_rent_estimate') ? Number(formData.get('weekly_rent_estimate')) : null
  const notes = (formData.get('notes') as string) || null

  const total_package = (land_price && build_price) ? land_price + build_price : null

  const { data: listing, error } = await service.from('listings').insert({
    suburb,
    estate: estate || null,
    corridor: corridor as 'Moreton Bay' | 'Ipswich' | 'Sunshine Coast' | 'Logan' | 'Gold Coast' | null,
    status: status as 'Available' | 'Under contract' | 'Sold',
    land_size_sqm,
    land_price,
    builder,
    house_design,
    house_sqm,
    build_price,
    total_package,
    weekly_rent_estimate,
    notes,
    created_by: user.id,
  }).select().single()

  if (error || !listing) {
    throw new Error(error?.message ?? 'Failed to create listing')
  }

  // Handle image uploads
  const facadeFile = formData.get('facade_image') as File | null
  const floorPlanFile = formData.get('floor_plan_image') as File | null

  let facade_image_url: string | null = null
  let floor_plan_image_url: string | null = null

  if (facadeFile && facadeFile.size > 0) {
    facade_image_url = await uploadImage(facadeFile, `listings/${listing.id}/${Date.now()}-facade`)
  }
  if (floorPlanFile && floorPlanFile.size > 0) {
    floor_plan_image_url = await uploadImage(floorPlanFile, `listings/${listing.id}/${Date.now()}-floorplan`)
  }

  // Update image URLs after upload
  if (facade_image_url || floor_plan_image_url) {
    await service.from('listings').update({
      ...(facade_image_url ? { facade_image_url } : {}),
      ...(floor_plan_image_url ? { floor_plan_image_url } : {}),
    }).eq('id', listing.id)
  }

  await logActivity(user.id, `Created listing: ${suburb}${estate ? ` – ${estate}` : ''}`, listing.id)

  redirect(`/listings/${listing.id}`)
}

export async function updateListing(id: string, formData: FormData) {
  const supabase = await createClient()
  const service = await createServiceClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const suburb = formData.get('suburb') as string
  const estate = (formData.get('estate') as string) || null
  const corridor = (formData.get('corridor') as string) || null
  const status = (formData.get('status') as string) || 'Available'
  const land_size_sqm = formData.get('land_size_sqm') ? Number(formData.get('land_size_sqm')) : null
  const land_price = formData.get('land_price') ? Number(formData.get('land_price')) : null
  const builder = (formData.get('builder') as string) || null
  const house_design = (formData.get('house_design') as string) || null
  const house_sqm = formData.get('house_sqm') ? Number(formData.get('house_sqm')) : null
  const build_price = formData.get('build_price') ? Number(formData.get('build_price')) : null
  const weekly_rent_estimate = formData.get('weekly_rent_estimate') ? Number(formData.get('weekly_rent_estimate')) : null
  const notes = (formData.get('notes') as string) || null

  const total_package = (land_price && build_price) ? land_price + build_price : null

  // Handle image uploads
  const facadeFile = formData.get('facade_image') as File | null
  const floorPlanFile = formData.get('floor_plan_image') as File | null

  let facade_image_url: string | undefined
  let floor_plan_image_url: string | undefined

  if (facadeFile && facadeFile.size > 0) {
    facade_image_url = await uploadImage(facadeFile, `listings/${id}/${Date.now()}-facade`) ?? undefined
  }
  if (floorPlanFile && floorPlanFile.size > 0) {
    floor_plan_image_url = await uploadImage(floorPlanFile, `listings/${id}/${Date.now()}-floorplan`) ?? undefined
  }

  const { error } = await service.from('listings').update({
    suburb,
    estate,
    corridor: corridor as 'Moreton Bay' | 'Ipswich' | 'Sunshine Coast' | 'Logan' | 'Gold Coast' | null,
    status: status as 'Available' | 'Under contract' | 'Sold',
    land_size_sqm,
    land_price,
    builder,
    house_design,
    house_sqm,
    build_price,
    total_package,
    weekly_rent_estimate,
    notes,
    ...(facade_image_url !== undefined ? { facade_image_url } : {}),
    ...(floor_plan_image_url !== undefined ? { floor_plan_image_url } : {}),
  }).eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  await logActivity(user.id, `Updated listing: ${suburb}${estate ? ` – ${estate}` : ''}`, id)

  redirect(`/listings/${id}`)
}

export async function deleteListing(id: string) {
  const supabase = await createClient()
  const service = await createServiceClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get listing details for activity log
  const { data: listing } = await service.from('listings').select('suburb').eq('id', id).single()

  const { error } = await service.from('listings').delete().eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  await logActivity(user.id, `Deleted listing: ${listing?.suburb ?? id}`, undefined)

  redirect('/dashboard')
}

export async function uploadImage(file: File, path: string): Promise<string | null> {
  const service = await createServiceClient()

  const arrayBuffer = await file.arrayBuffer()
  const buffer = new Uint8Array(arrayBuffer)

  const { error } = await service.storage
    .from('listing-images')
    .upload(path, buffer, { contentType: file.type, upsert: true })

  if (error) {
    console.error('Image upload error:', error)
    return null
  }

  const { data } = service.storage.from('listing-images').getPublicUrl(path)
  return data.publicUrl
}
