'use server'

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { logActivity } from './activity'
import { revalidatePath } from 'next/cache'
import type { Role } from '@/types/database'

export async function updateUserRole(userId: string, role: Role) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const service = await createServiceClient()
  await service.from('profiles').update({ role }).eq('id', userId)

  await logActivity(user.id, `Changed role of user ${userId} to ${role}`)
  revalidatePath('/users')
}

export async function toggleUserActive(userId: string, isActive: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const service = await createServiceClient()
  await service.from('profiles').update({ is_active: isActive }).eq('id', userId)

  await logActivity(user.id, `${isActive ? 'Activated' : 'Deactivated'} user ${userId}`)
  revalidatePath('/users')
}

export async function inviteUser(formData: FormData): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized — please sign in again.' }

  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const role = formData.get('role') as Role
  const company = formData.get('company') as string | null

  const service = await createServiceClient()

  // Create the auth user + send the invite email.
  const { data: invited, error } = await service.auth.admin.inviteUserByEmail(email, {
    data: { name, role },
  })

  if (error || !invited?.user) {
    return { error: `Could not send invite: ${error?.message ?? 'unknown error from Supabase Auth'}` }
  }

  // Upsert so a DB trigger that auto-creates the profile row doesn't cause a duplicate-key failure.
  const { error: profileError } = await service.from('profiles').upsert({
    id: invited.user.id,
    name,
    email,
    role,
    company: company || null,
    invited_by: user.id,
    invite_date: new Date().toISOString(),
    is_active: true,
    show_prices: false,
  })

  if (profileError) {
    return { error: `Invite email sent, but saving the profile failed: ${profileError.message}` }
  }

  await logActivity(user.id, `Invited user ${email} as ${role}`)
  revalidatePath('/users')
  return {}
}
