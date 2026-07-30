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

  const p = profile as Profile

  return (
    <div className="min-h-screen bg-[#f5f2ec]">
      <header className="bg-[#1e2a32]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <span className="font-display text-xl tracking-wide text-white">
              BOLD <span className="text-[#b08d57]">INVEST</span>
            </span>
            <div className="flex items-center gap-4">
              <span className="text-sm text-white/60">{p?.email}</span>
              <form action={signOut}>
                <button
                  type="submit"
                  className="text-sm font-medium text-white/70 hover:text-white transition-colors"
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
