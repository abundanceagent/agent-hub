'use client'

import { useState, useEffect } from 'react'
import type { Listing } from '@/types/database'

interface Props {
  listing: Listing
}

export default function PdfButton({ listing }: Props) {
  const [Component, setComponent] = useState<React.ComponentType<{ listing: Listing }> | null>(null)

  useEffect(() => {
    Promise.all([
      import('@react-pdf/renderer'),
      import('@/lib/pdf/ListingPDF'),
    ]).then(([{ PDFDownloadLink }, { ListingPDF }]) => {
      const generatedDate = new Date().toLocaleDateString('en-AU', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
      const fileName = `${listing.suburb}${listing.estate ? `-${listing.estate}` : ''}-listing.pdf`
        .toLowerCase().replace(/\s+/g, '-')

      function DownloadLink({ listing }: { listing: Listing }) {
        return (
          <PDFDownloadLink
            document={<ListingPDF listing={listing} generatedDate={generatedDate} />}
            fileName={fileName}
          >
            {({ loading }: { loading: boolean }) => (
              <span className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {loading ? 'Preparing...' : 'Export PDF'}
              </span>
            )}
          </PDFDownloadLink>
        )
      }

      setComponent(() => DownloadLink)
    })
  }, [listing.suburb, listing.estate])

  if (!Component) {
    return (
      <span className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-400 text-sm font-medium rounded-lg">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Export PDF
      </span>
    )
  }

  return <Component listing={listing} />
}
