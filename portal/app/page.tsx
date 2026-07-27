'use client'

import { useState } from 'react'
import Link from 'next/link'

const GOLD = '#b08d57'
const CREAM = '#f5f2ec'
const NAVY = '#1e2a32'

const nav = [
  { label: 'Who We Help', href: '#segments' },
  { label: 'Why BOLD', href: '#why' },
  { label: 'Packages', href: '#packages' },
  { label: 'Partners', href: '#partners' },
  { label: 'Contact', href: '#contact' },
]

const promos = [
  {
    title: 'Fixed-Price Certainty',
    body: 'Locked-in build costs and fixed site costs, so the numbers you sign are the numbers you settle on.',
  },
  {
    title: 'Investor-Grade Stock',
    body: 'Dual-income and dual-key designs engineered for yield in high-demand South East Queensland corridors.',
  },
  {
    title: 'Referral Partner Program',
    body: 'Buyers agents, brokers and planners access boutique house & land stock and earn on every settlement.',
  },
]

const segments = [
  { title: 'First-Time Investors', body: 'A guided, low-friction entry into property with cashflow-considered packages and clear numbers.' },
  { title: 'Portfolio Builders', body: 'Repeatable, investment-grade stock across growth corridors to scale a portfolio with confidence.' },
  { title: 'SMSF Buyers', body: 'Straightforward house & land packages structured to suit self-managed super fund strategies.' },
  { title: 'Dual-Income & Co-Living', body: 'Dual-key and rooming-style designs built to maximise rental return from a single title.' },
]

const why = [
  { h: 'South East QLD focus', p: 'We build where the fundamentals stack up — Logan, Ipswich and Moreton Bay growth corridors.' },
  { h: 'Cashflow-first design', p: 'Every package is assessed on real yield, not just capital-growth promises.' },
  { h: 'End-to-end, hands-off', p: 'Land, build, and handover managed for you — a genuinely passive path to a completed asset.' },
  { h: 'Preferred-builder model', p: 'We attach to boutique estates as preferred builder, giving you access to stock others never see.' },
]

export default function Home() {
  const [open, setOpen] = useState(false)

  return (
    <div style={{ backgroundColor: CREAM, color: NAVY }} className="min-h-screen scroll-smooth">
      {/* Fonts (hoisted to head by React) */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Jost:wght@300;400;500&display=swap"
      />
      <style>{`
        .font-display{font-family:'Cormorant Garamond',Georgia,serif;}
        .font-body{font-family:'Jost',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;}
      `}</style>

      <div className="font-body">
        {/* Nav */}
        <header className="sticky top-0 z-50 border-b border-black/5 backdrop-blur" style={{ backgroundColor: 'rgba(245,242,236,0.9)' }}>
          <div className="max-w-6xl mx-auto px-5 h-20 flex items-center justify-between">
            <a href="#top" className="font-display text-2xl tracking-wide">
              <span className="font-semibold">BOLD</span>{' '}
              <span style={{ color: GOLD }} className="font-medium">INVEST</span>
            </a>
            <nav className="hidden md:flex items-center gap-8 text-sm tracking-wide">
              {nav.map((n) => (
                <a key={n.href} href={n.href} className="hover:opacity-60 transition-opacity uppercase">{n.label}</a>
              ))}
              <Link href="/login" className="px-5 py-2 rounded-full text-white text-sm tracking-wide" style={{ backgroundColor: NAVY }}>
                Partner Login
              </Link>
            </nav>
            <button className="md:hidden text-2xl" onClick={() => setOpen(!open)} aria-label="Menu">☰</button>
          </div>
          {open && (
            <div className="md:hidden border-t border-black/5 px-5 py-4 flex flex-col gap-4 text-sm uppercase tracking-wide" style={{ backgroundColor: CREAM }}>
              {nav.map((n) => (
                <a key={n.href} href={n.href} onClick={() => setOpen(false)}>{n.label}</a>
              ))}
              <Link href="/login" className="text-center px-5 py-2 rounded-full text-white" style={{ backgroundColor: NAVY }}>Partner Login</Link>
            </div>
          )}
        </header>

        {/* Hero */}
        <section id="top" className="max-w-6xl mx-auto px-5 pt-16 pb-20 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="uppercase tracking-[0.25em] text-xs mb-6" style={{ color: GOLD }}>Residential Property Investment · SEQ</p>
            <h1 className="font-display text-5xl md:text-6xl leading-[1.05]">
              Property investment,<br />built with <span style={{ color: GOLD }}>certainty.</span>
            </h1>
            <p className="mt-6 text-base leading-relaxed max-w-md opacity-80">
              BOLD Invest delivers investment-grade house &amp; land packages across South East Queensland&apos;s
              strongest growth corridors — fixed-price, cashflow-focused, and built to perform.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <a href="#packages" className="px-7 py-3 rounded-full text-white text-sm tracking-wide" style={{ backgroundColor: NAVY }}>Explore packages</a>
              <a href="#partners" className="px-7 py-3 rounded-full text-sm tracking-wide border" style={{ borderColor: GOLD, color: GOLD }}>Become a referral partner</a>
            </div>
          </div>
          <div className="h-[420px] rounded-2xl shadow-xl" style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #33454f 60%, ${GOLD} 160%)` }} />
        </section>

        {/* Intro */}
        <section className="max-w-4xl mx-auto px-5 py-16 text-center">
          <h2 className="font-display text-4xl md:text-5xl leading-tight">
            More than a builder —<br /><span style={{ color: GOLD }}>your investment partner.</span>
          </h2>
          <p className="mt-6 leading-relaxed opacity-80">
            We&apos;re a South East Queensland residential builder focused on one thing: property that works for investors.
            As a preferred builder on boutique estates, we secure investment-grade land and pair it with dual-income and
            dual-key designs engineered for real-world yield — not just glossy brochures.
          </p>
          <p className="mt-4 leading-relaxed opacity-80">
            From first-time investors to portfolio builders and SMSF buyers, we make owning a completed, tenant-ready asset
            straightforward, transparent and genuinely hands-off.
          </p>
        </section>

        {/* Promo cards */}
        <section id="packages" className="max-w-6xl mx-auto px-5 py-10 grid md:grid-cols-3 gap-6">
          {promos.map((c) => (
            <div key={c.title} className="bg-white rounded-2xl p-8 border border-black/5 flex flex-col">
              <div className="h-40 rounded-xl mb-6" style={{ background: `linear-gradient(135deg, #e9e2d4, ${GOLD}44)` }} />
              <h3 className="font-display text-2xl mb-2" style={{ color: GOLD }}>{c.title}</h3>
              <p className="text-sm leading-relaxed opacity-80 flex-1">{c.body}</p>
              <a href="#contact" className="mt-6 inline-block text-xs uppercase tracking-widest border rounded-full px-5 py-2 self-start" style={{ borderColor: GOLD, color: GOLD }}>Learn more</a>
            </div>
          ))}
        </section>

        {/* Segments */}
        <section id="segments" className="max-w-6xl mx-auto px-5 py-16">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl md:text-5xl">Who we <span style={{ color: GOLD }}>help</span></h2>
            <p className="mt-3 opacity-70 max-w-xl mx-auto">Whatever your strategy, BOLD Invest has stock and structure to match it.</p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {segments.map((s) => (
              <div key={s.title} className="bg-white rounded-2xl overflow-hidden border border-black/5">
                <div className="h-40" style={{ background: `linear-gradient(135deg, ${NAVY}, #445560)` }} />
                <div className="p-6">
                  <h3 className="font-display text-xl mb-2" style={{ color: GOLD }}>{s.title}</h3>
                  <p className="text-sm leading-relaxed opacity-80">{s.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Why BOLD */}
        <section id="why" className="py-20" style={{ backgroundColor: '#efe9dd' }}>
          <div className="max-w-6xl mx-auto px-5">
            <div className="text-center mb-12">
              <h2 className="font-display text-4xl md:text-5xl">Why <span style={{ color: GOLD }}>BOLD Invest</span></h2>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              {why.map((w, i) => (
                <div key={w.h} className="flex gap-5">
                  <div className="font-display text-3xl w-12 shrink-0" style={{ color: GOLD }}>{String(i + 1).padStart(2, '0')}</div>
                  <div>
                    <h3 className="font-display text-2xl mb-1">{w.h}</h3>
                    <p className="text-sm leading-relaxed opacity-80">{w.p}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats / trust band */}
        <section className="py-16" style={{ backgroundColor: NAVY, color: CREAM }}>
          <div className="max-w-5xl mx-auto px-5 grid grid-cols-2 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="font-display text-5xl" style={{ color: GOLD }}><span className="text-red-400">[X]</span>+</div>
              <p className="text-xs uppercase tracking-widest mt-2 opacity-80">Years building <span className="text-red-400">(confirm)</span></p>
            </div>
            <div>
              <div className="font-display text-5xl" style={{ color: GOLD }}>3</div>
              <p className="text-xs uppercase tracking-widest mt-2 opacity-80">SEQ growth corridors</p>
            </div>
            <div>
              <div className="font-display text-5xl" style={{ color: GOLD }}><span className="text-red-400">[X]</span></div>
              <p className="text-xs uppercase tracking-widest mt-2 opacity-80">Packages settled <span className="text-red-400">(confirm)</span></p>
            </div>
          </div>
        </section>

        {/* Partners CTA */}
        <section id="partners" className="max-w-5xl mx-auto px-5 py-20 text-center">
          <h2 className="font-display text-4xl md:text-5xl">Referral <span style={{ color: GOLD }}>partners</span></h2>
          <p className="mt-4 opacity-80 max-w-2xl mx-auto leading-relaxed">
            Buyers agents, mortgage brokers and financial planners — partner with BOLD Invest to give your clients access to
            boutique, investment-grade house &amp; land packages, with transparent commissions paid on settlement.
          </p>
          <Link href="/login" className="mt-8 inline-block px-8 py-3 rounded-full text-white text-sm tracking-wide" style={{ backgroundColor: GOLD }}>
            Access the partner portal
          </Link>
        </section>

        {/* Contact / footer */}
        <footer id="contact" style={{ backgroundColor: NAVY, color: CREAM }} className="pt-16 pb-10">
          <div className="max-w-6xl mx-auto px-5 grid md:grid-cols-3 gap-10">
            <div>
              <div className="font-display text-2xl mb-4"><span className="font-semibold">BOLD</span> <span style={{ color: GOLD }}>INVEST</span></div>
              <p className="text-sm opacity-70 leading-relaxed">Investment-grade residential property across South East Queensland.</p>
            </div>
            <div className="text-sm opacity-80 space-y-2">
              <p className="uppercase tracking-widest text-xs mb-3" style={{ color: GOLD }}>Contact</p>
              <p>0407 020 122</p>
              <p>b.olsen@boldinvest.com.au</p>
              <p>71 Stapylton Street, North Lakes QLD 4509</p>
            </div>
            <div className="text-sm opacity-80 space-y-2">
              <p className="uppercase tracking-widest text-xs mb-3" style={{ color: GOLD }}>Explore</p>
              {nav.map((n) => <a key={n.href} href={n.href} className="block hover:opacity-60">{n.label}</a>)}
              <Link href="/login" className="block hover:opacity-60">Partner Login</Link>
            </div>
          </div>
          <div className="max-w-6xl mx-auto px-5 mt-12 pt-6 border-t border-white/10 text-xs opacity-50 flex flex-col sm:flex-row justify-between gap-2">
            <span>© {new Date().getFullYear()} BOLD Invest. All rights reserved.</span>
            <span>Built for investors across South East Queensland.</span>
          </div>
        </footer>
      </div>
    </div>
  )
}
