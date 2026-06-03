'use server'
import { createServiceClient } from '@/lib/supabase/server'

export async function logActivity(
  userId: string,
  action: string,
  listingId?: string
) {
  const supabase = await createServiceClient()
  await supabase.from('activity_logs').insert({
    user_id: userId,
    action,
    listing_id: listingId ?? null,
  })
}
