import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/types/database'
import Link from 'next/link'

async function signOut() {
  'use server'
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || !profile.is_active) redirect('/login')
  if (profile.role === 'partner') redirect('/stock')

  const p = profile as Profile
  const isAdmin = p.role === 'admin'

  const linkCls =
    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors'

  return (
    <div className="min-h-screen bg-[#f5f2ec] flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:flex-col w-64 bg-[#1e2a32] min-h-screen">
        {/* Logo */}
        <div className="px-6 py-6 border-b border-white/10">
          <span className="font-display text-2xl tracking-wide text-white">
            BOLD <span className="text-[#b08d57]">INVEST</span>
          </span>
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 mt-1">Stock Portal</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          <Link href="/dashboard" className={linkCls}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Dashboard
          </Link>
          {isAdmin && (
            <>
              <Link href="/users" className={linkCls}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Users
              </Link>
              <Link href="/logs" className={linkCls}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Activity Logs
              </Link>
            </>
          )}
        </nav>

        {/* User + Sign out */}
        <div className="px-3 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            <div className="w-8 h-8 bg-[#b08d57] rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-medium">
                {p?.name?.[0]?.toUpperCase() ?? p?.email?.[0]?.toUpperCase() ?? '?'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{p?.name ?? 'User'}</p>
              <p className="text-xs text-white/50 truncate capitalize">{p?.role}</p>
            </div>
          </div>
          <form action={signOut}>
            <button type="submit" className={linkCls + ' w-full'}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="md:hidden bg-[#1e2a32] px-4 py-3 flex items-center justify-between">
          <span className="font-display text-lg tracking-wide text-white">
            BOLD <span className="text-[#b08d57]">INVEST</span>
          </span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-white/70">{p?.name ?? p?.email}</span>
            <form action={signOut}>
              <button type="submit" className="text-white/60 hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </form>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto pb-20 md:pb-0">
          {children}
        </main>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex items-center justify-around px-2 py-2 z-10">
          <Link href="/dashboard" className="flex flex-col items-center gap-1 px-3 py-1 text-slate-600 hover:text-[#b08d57]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs">Home</span>
          </Link>
          {isAdmin && (
            <>
              <Link href="/users" className="flex flex-col items-center gap-1 px-3 py-1 text-slate-600 hover:text-[#b08d57]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <span className="text-xs">Users</span>
              </Link>
              <Link href="/logs" className="flex flex-col items-center gap-1 px-3 py-1 text-slate-600 hover:text-[#b08d57]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span className="text-xs">Logs</span>
              </Link>
            </>
          )}
        </nav>
      </div>
    </div>
  )
}
