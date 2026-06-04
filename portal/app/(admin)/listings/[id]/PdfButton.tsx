'use client'

import dynamic from 'next/dynamic'
import type { Listing } from '@/types/database'

// Dynamically import to avoid SSR issues with @react-pdf/renderer
const PDFDownloadLinkDynamic = dynamic(
  () => import('@react-pdf/renderer').then((mod) => {
    const { PDFDownloadLink } = mod
    return function WrappedLink({ listing }: { listing: Listing }) {
      const { ListingPDF } = require('@/lib/pdf/ListingPDF')
      const generatedDate = new Date().toLocaleDateString('en-AU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
      const fileName = `${listing.suburb}${listing.estate ? `-${listing.estate}` : ''}-listing.pdf`
        .toLowerCase()
        .replace(/\s+/g, '-')

      return (
        <PDFDownloadLink
          document={<ListingPDF listing={listing} generatedDate={generatedDate} />}
          fileName={fileName}
        >
          {({ loading }) => (
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
  }),
  { ssr: false }
)

interface Props {
  listing: Listing
}

export default function PdfButton({ listing }: Props) {
  return <PDFDownloadLinkDynamic listing={listing} />
}
