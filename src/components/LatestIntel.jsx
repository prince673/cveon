import { useEffect, useRef, useState } from 'react'
import { fetchLatestCves, getKevRecent } from '../services/api'
import { timeAgo, getSeverity } from '../utils/formatters'
import { ArrowLeftIcon, WarningIcon } from './icons'

// Home-page "Latest intelligence" strip: the newest NVD disclosures and the
// newest CISA KEV additions, side by side. Both feeds load straight from the
// public sources in the visitor's browser and refresh silently every 5
// minutes. Nothing is stored.

const REFRESH_MS = 5 * 60 * 1000
const LIMIT = 5
const NEW_CHIP_MS = 6000

function SeverityDot({ score }) {
  const s = getSeverity(score)
  return (
    <span className={`inline-flex items-center gap-1 shrink-0 ${s.text}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" aria-hidden="true" />
      <span className="text-[10px] font-bold font-mono">{score ?? '—'}</span>
    </span>
  )
}

function FeedSkeleton() {
  return (
    <div className="space-y-1.5 px-1 py-1" role="status" aria-label="Loading feed">
      {[0, 1, 2, 3].map(i => <div key={i} className="skeleton h-10 w-full" />)}
    </div>
  )
}

export default function LatestIntel({ onSelectCve, onOpenKev }) {
  const [nvd, setNvd] = useState(null)        // null = loading
  const [nvdError, setNvdError] = useState(null)
  const [kev, setKev] = useState(null)
  const [kevError, setKevError] = useState(null)
  const [nvdDelta, setNvdDelta] = useState(null)  // "+N new" chip
  const [kevDelta, setKevDelta] = useState(null)
  const prevNvdIdsRef = useRef(null)
  const prevKevIdsRef = useRef(null)
  const nvdChipTimerRef = useRef(null)
  const kevChipTimerRef = useRef(null)

  const [reloadTick, setReloadTick] = useState(0)

  // Compare a fresh feed against the previous one; return how many entries
  // were not present before (0 on first load — that is not "new").
  function countNew(items, prevIdsRef) {
    const ids = items.map(x => x.id ?? x.cve_id)
    const prev = prevIdsRef.current
    prevIdsRef.current = new Set(ids)
    if (!prev) return 0
    return ids.filter(id => !prev.has(id)).length
  }

  function flashDelta(setter, timerRef, delta) {
    if (delta <= 0) return
    setter(delta)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setter(null), NEW_CHIP_MS)
  }

  function retryFeeds() {
    setNvdError(null)
    setKevError(null)
    setReloadTick(t => t + 1)
  }

  useEffect(() => {
    let alive = true

    async function load() {
      try {
        const items = await fetchLatestCves(LIMIT)
        if (!alive) return
        flashDelta(setNvdDelta, nvdChipTimerRef, countNew(items, prevNvdIdsRef))
        setNvd(items)
        setNvdError(null)
      } catch (err) {
        if (!alive) return
        setNvdError(err?.message || 'NVD feed unavailable')
      }
      try {
        const items = await getKevRecent(LIMIT)
        if (!alive) return
        flashDelta(setKevDelta, kevChipTimerRef, countNew(items, prevKevIdsRef))
        setKev(items)
        setKevError(null)
      } catch {
        if (!alive) return
        setKevError('KEV feed unavailable')
      }
    }

    load()
    const interval = setInterval(load, REFRESH_MS)
    const nvdTimer = nvdChipTimerRef
    const kevTimer = kevChipTimerRef
    return () => {
      alive = false
      clearInterval(interval)
      clearTimeout(nvdTimer.current)
      clearTimeout(kevTimer.current)
    }
  }, [reloadTick])

  return (
    <section className="mt-4 grid md:grid-cols-2 gap-4" aria-label="Latest intelligence">
      {/* ── Newest NVD disclosures ── */}
      <div className="card-flat !p-4 flex flex-col animate-fade-up" style={{ animationDelay: '120ms' }}>
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="section-label flex items-center gap-2">
            Newest disclosures · NVD
            {nvdDelta != null && (
              <span className="animate-scale-in inline-flex items-center px-1.5 py-px rounded-md
                               text-[10px] font-bold text-green-400 bg-green-500/10 border border-green-500/40 normal-case tracking-normal">
                feed updated · +{nvdDelta} new
              </span>
            )}
          </span>
          <span className="text-[10px] font-mono text-gray-400">auto-refresh 5 min</span>
        </div>

        {nvdError && nvd == null && (
          <div className="flex-1 min-h-[120px] flex flex-col items-center justify-center gap-2.5 text-center px-4">
            <span className="text-red-400"><WarningIcon size={16} /></span>
            <p className="text-xs text-red-400">{nvdError}</p>
            <button type="button" onClick={retryFeeds} className="btn-ghost text-xs">
              Retry
            </button>
          </div>
        )}
        {nvd == null && !nvdError && <FeedSkeleton />}

        {nvd != null && nvd.length === 0 && (
          <p className="px-1 py-4 text-xs text-gray-500 text-center">No recent disclosures.</p>
        )}

        {nvd != null && nvd.length > 0 && (
          <div className="flex flex-col gap-0.5">
            {nvd.map(c => (
              <button
                key={c.id}
                onClick={() => onSelectCve?.(c.id)}
                className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-left
                           hover:bg-dark-card2 transition-colors group"
              >
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-[#58a6ff] truncate">
                      {c.id}
                    </span>
                    <SeverityDot score={c.score} />
                    <span className="text-[10px] font-mono text-gray-400 shrink-0">
                      {timeAgo(c.published)}
                    </span>
                  </span>
                  <span className="block text-[11px] text-[#8b949e] truncate mt-0.5">
                    {c.description}
                  </span>
                </span>
                <ArrowLeftIcon
                  size={11}
                  className="rotate-180 text-accent-cyan shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Newest KEV additions ── */}
      <div className="card-flat !p-4 flex flex-col animate-fade-up" style={{ animationDelay: '200ms' }}>
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="section-label flex items-center gap-2">
            Newest KEV additions · CISA
            {kevDelta != null && (
              <span className="animate-scale-in inline-flex items-center px-1.5 py-px rounded-md
                               text-[10px] font-bold text-green-400 bg-green-500/10 border border-green-500/40 normal-case tracking-normal">
                feed updated · +{kevDelta} new
              </span>
            )}
          </span>
          <button
            onClick={onOpenKev}
            className="text-[10px] text-[#58a6ff] hover:text-[#79c0ff] transition-colors py-1.5 -my-1.5 px-1 -mx-1"
          >
            Full catalog ↗
          </button>
        </div>

        {kevError && kev == null && (
          <div className="flex-1 min-h-[120px] flex flex-col items-center justify-center gap-2.5 text-center px-4">
            <span className="text-red-400"><WarningIcon size={16} /></span>
            <p className="text-xs text-red-400">{kevError}</p>
            <button type="button" onClick={retryFeeds} className="btn-ghost text-xs">
              Retry
            </button>
          </div>
        )}
        {kev == null && !kevError && <FeedSkeleton />}

        {kev != null && kev.length === 0 && (
          <p className="px-1 py-4 text-xs text-gray-500 text-center">
            KEV catalog could not be loaded right now.
          </p>
        )}

        {kev != null && kev.length > 0 && (
          <div className="flex flex-col gap-0.5">
            {kev.map(e => (
              <button
                key={e.cve_id}
                onClick={() => onSelectCve?.(e.cve_id)}
                className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-left
                           hover:bg-dark-card2 transition-colors group"
              >
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-semibold text-[#58a6ff] truncate">
                      {e.cve_id}
                    </span>
                    {e.known_ransomware_campaign_use && (
                      <span className="shrink-0 text-[9px] font-semibold text-red-400 border border-red-500/40 rounded px-1 py-px">
                        RW
                      </span>
                    )}
                  </span>
                  <span className="block text-[11px] text-[#8b949e] truncate mt-0.5">
                    {[e.vendor, e.product].filter(Boolean).join(' · ') || e.vulnerability_name || '—'}
                  </span>
                </span>
                <span className="shrink-0 text-[10px] font-mono text-gray-400">
                  {timeAgo(e.date_added)}
                </span>
                <ArrowLeftIcon
                  size={11}
                  className="rotate-180 text-accent-cyan shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
