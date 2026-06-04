import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { Database } from '@/types/database'

export async function GET() {
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Step 1: force-set the password
  const { error: updateError } = await admin.auth.admin.updateUserById(
    'eeb527e5-a94e-4704-ae84-57ca62cae864',
    { password: 'TempLogin99!' }
  )
  if (updateError) return NextResponse.json({ step: 'update', error: updateError.message }, { status: 500 })

  // Step 2: sign in with that password using the SSR client so cookies are set
  const cookieStore = await cookies()
  const response = NextResponse.redirect(
    new URL('/stock', process.env.NEXT_PUBLIC_SITE_URL ?? 'https://agent-hub-ruddy-seven.vercel.app')
  )

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: 'b.olsen@boldinvest.com.au',
    password: 'TempLogin99!',
  })
  if (signInError) return NextResponse.json({ step: 'signin', error: signInError.message }, { status: 500 })

  return response
}
