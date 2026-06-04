import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const origin = new URL(request.url).origin

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: 'b.olsen@boldinvest.com.au',
    options: { redirectTo: `${origin}/auth/callback` },
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.redirect(data.properties.action_link)
}
