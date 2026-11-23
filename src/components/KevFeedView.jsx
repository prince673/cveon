import { useEffect, useMemo, useState } from 'react'
import { getKevFeed } from '../services/api'
import { formatDate } from '../utils/formatters'
import { SearchIcon, WarningIcon, ArrowLeftIcon } from './icons'

// #/kev — recent additions to the CISA Known Exploited Vulnerabilities
// catalog, fetched straight from the public feed in the visitor's browser.
// Nothing is cached beyond the in-RAM catalog the app already keeps.

const PAGE = 50

export default function KevFeedView({ onSelectCve }) {
  const [entries, setEntries] = useState(null)
  const [error, setError] = useState(null)
  const [query, setQuery] = useState('')
  const [limit, setLimit] = useState(PAGE)

  useEffect(() => {
    let alive = true
    getKevFeed()
      .then(data => { if (alive) setEntries(data) })
      .catch(err => { if (alive) setError(err?.message || 'Could not load the KEV catalog.') })
    return () => { alive = false }
  }, [])

  const filtered = useMemo(() => {
    if (!entries) return []
    const q = query.trim().toLowerCase()
    const base = q
      ? entries.filter(e =>
          e.cve_id.toLowerCase().includes(q) ||
          (e.vendor || '').toLowerCase().includes(q) ||
          (e.product || '').toLowerCase().includes(q) ||
          (e.vulnerability_name || '').toLowerCase().includes(q))
      : entries
    return base
  }, [entries, query])

  if (error) {
    return (
      <div className="card border-red-500/40 bg-red-500/[0.06]">
        <h3 className="font-semibold text-red-400 text-sm mb-1">KEV feed unavailable</h3>
        <p className="text-gray-400 text-sm">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <header className="flex items-center gap-2.5">
        <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
          <WarningIcon size={15} />
        </span>
        <h2 className="text-base font-semibold text-gray-100">CISA KEV catalog</h2>
        {entries && (
          <span className="text-xs text-gray-500 ml-auto">
            {entries.length} known exploited vulnerabilities
          </span>
        )}
      </header>

      <p className="text-sm text-[#8b949e] leading-relaxed">
        Vulnerabilities with confirmed in-the-wild exploitation, newest additions first,
        fetched live from CISA's public feed. Select any entry for a full analysis.
      </p>

      <div className="relative">
        <SearchIcon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8b949e]" />
        <input
          type="text"
          className="input-field pl-10 h-10"
          value={query}
          onChange={e => { setQuery(e.target.value); setLimit(PAGE) }}
          placeholder="Filter by CVE ID, vendor, product…"
          spellCheck={false}
          autoComplete="off"
          aria-label="Filter KEV catalog"
        />
      </div>

      {!entries && (
        <div className="card space-y-2.5" role="status" aria-label="Loading KEV catalog">
          {[0, 1, 2, 3, 4, 5].map(i => <div key={i} className="skeleton h-9 w-full" />)}
        </div>
      )}

      {entries && (
        <section className="card">
          {entries.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">
              The KEV catalog could not be loaded from CISA's feed right now. Please retry later.
            </p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">No KEV entries match “{query}”.</p>
          ) : (
            <>
              <div className="hidden md:grid grid-cols-[140px_1fr_110px_110px] gap-3 px-3 pb-2
                              border-b border-dark-border text-[11px] uppercase tracking-wide text-gray-500">
                <span>CVE ID</span>
                <span>Vendor · Product</span>
                <span>Added</span>
                <span className="text-right">Due</span>
              </div>
              <div className="flex flex-col gap-0.5 mt-1">
                {filtered.slice(0, limit).map(e => (
                  <button
                    key={e.cve_id}
                    onClick={() => onSelectCve?.(e.cve_id)}
                    className="w-full grid grid-cols-[1fr_90px] md:grid-cols-[140px_1fr_110px_110px] items-center
                               gap-3 px-3 py-2.5 text-left rounded-lg hover:bg-white/[0.03]
                               transition-colors border border-transparent hover:border-dark-border"
                  >
                    <span className="font-mono text-sm text-gray-100 flex items-center gap-1.5 min-w-0">
                      <span className="truncate">{e.cve_id}</span>
                      {e.known_ransomware_campaign_use && (
                        <span className="shrink-0 text-[9px] font-semibold text-red-400 border border-red-500/40 rounded px-1 py-px">
                          Ransomware
                        </span>
                      )}
                    </span>
                    <span className="hidden md:block min-w-0">
                      <span className="block text-xs text-gray-300 truncate">
                        {[e.vendor, e.product].filter(Boolean).join(' · ')}
                      </span>
                      {e.vulnerability_name && (
                        <span className="block text-[11px] text-gray-500 truncate">{e.vulnerability_name}</span>
                      )}
                    </span>
                    <span className="text-xs text-[#8b949e] font-mono">{formatDate(e.date_added)}</span>
                    <span className="text-xs text-gray-500 font-mono text-right flex items-center justify-end gap-1">
                      {e.due_date ? formatDate(e.due_date) : '—'}
                      <ArrowLeftIcon size={11} className="rotate-180 text-accent-cyan hidden md:inline" />
                    </span>
                  </button>
                ))}
              </div>
              {filtered.length > limit && (
                <div className="flex justify-center pt-3">
                  <button onClick={() => setLimit(l => l + PAGE)} className="btn-ghost">
                    Show {Math.min(PAGE, filtered.length - limit)} more
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      )}
    </div>
  )
}
