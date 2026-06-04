import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: 'b.olsen@boldinvest.com.au',
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Redirect directly to the magic link — logs user in without email
  return NextResponse.redirect(data.properties.action_link)
}
