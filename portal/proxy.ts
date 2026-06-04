import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // Public routes
  if (pathname === '/login' || pathname === '/set-password') {
    if (user) {
      // Redirect logged-in users away from login
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      const dest = profile?.role === 'partner' ? '/stock' : '/dashboard'
      return NextResponse.redirect(new URL(dest, request.url))
    }
    return supabaseResponse
  }

  // All other routes require auth
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_active')
    .eq('id', user.id)
    .single()

  // Deactivated accounts
  if (!profile?.is_active) {
    await supabase.auth.signOut()
    return NextResponse.redirect(new URL('/login?error=deactivated', request.url))
  }

  const role = profile?.role

  // Partner trying to access admin routes
  if (role === 'partner' && (pathname.startsWith('/dashboard') || pathname.startsWith('/listings') || pathname.startsWith('/users') || pathname.startsWith('/logs'))) {
    return NextResponse.redirect(new URL('/stock', request.url))
  }

  // Admin/team trying to access partner-only route
  if ((role === 'admin' || role === 'team') && pathname.startsWith('/stock')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Non-admin accessing admin-only routes
  if (role !== 'admin' && (pathname.startsWith('/users') || pathname.startsWith('/logs'))) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
