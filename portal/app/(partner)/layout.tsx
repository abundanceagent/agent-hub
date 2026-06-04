import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/types/database'

async function signOut() {
  'use server'
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export default async function PartnerLayout({ children }: { children: React.ReactNode }) {
  const p = { email: 'partner', role: 'partner' } as Profile

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-bold">IS</span>
              </div>
              <span className="font-semibold text-slate-900">Investment Stock Portal</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-500">{p?.email}</span>
              <form action={signOut}>
                <button
                  type="submit"
                  className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}
