'use client'

import { useState } from 'react'
import { FILE_CATEGORIES, type ListingFile } from '@/types/database'
import { addListingFile, deleteListingFile } from '@/lib/actions/files'

export default function ListingFiles({
  listingId,
  files,
  canManage,
}: {
  listingId: string
  files: ListingFile[]
  canManage: boolean
}) {
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleAdd(formData: FormData) {
    setBusy(true)
    setError(null)
    const res = await addListingFile(listingId, formData)
    if (res?.error) setError(res.error)
    setBusy(false)
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
      <h2 className="text-sm font-semibold text-slate-900 mb-3">Documents &amp; files</h2>

      {files.length === 0 ? (
        <p className="text-sm text-slate-400 mb-4">No files yet.</p>
      ) : (
        <ul className="divide-y divide-slate-100 mb-4">
          {files.map((f) => (
            <li key={f.id} className="py-2 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="inline-block text-[11px] uppercase tracking-wide text-[#7a5c2e] bg-[#efe9dd] rounded px-2 py-0.5 mr-2">{f.category}</span>
                <a href={f.url} target="_blank" rel="noopener noreferrer" className="text-sm text-slate-700 hover:text-slate-900 underline break-all">{f.name}</a>
              </div>
              {canManage && (
                <button
                  type="button"
                  onClick={() => deleteListingFile(f.id, listingId)}
                  className="text-xs text-red-600 hover:text-red-700 flex-shrink-0"
                >
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {canManage && (
        <form action={handleAdd} className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Category</label>
            <select name="category" className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-slate-900">
              {FILE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-600 mb-1">File</label>
            <input type="file" name="file" required className="w-full text-sm text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200" />
          </div>
          <button type="submit" disabled={busy} className="px-4 py-2 bg-[#1e2a32] text-white text-sm font-medium rounded-lg hover:bg-[#24303a] disabled:opacity-60">
            {busy ? 'Uploading…' : 'Add file'}
          </button>
        </form>
      )}
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  )
}
