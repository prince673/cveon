import { useEffect, useRef, useState } from 'react'
import { getKevCount, getKevRecent } from '../services/api'
import { formatDate } from '../utils/formatters'
import { ArrowLeftIcon } from './icons'

// Header threat ticker: live count of CISA KEV entries.
//  - Count-up animation on first load (easeOutCubic, rAF-driven)
//  - Re-checks the live feed every 5 minutes (and when the tab regains
//    visibility) by busting the in-RAM catalog cache
//  - When the count grows, the number rolls up from the old value and a
//    "+N new" chip flashes for a few seconds
//  - Hover/focus opens a dropdown with the 5 most recently added entries,
//    each clickable into a full analysis
// Clicking the button itself opens the #/kev feed.

const DURATION_MS = 1400
const POLL_MS = 5 * 60 * 1000
const NEW_CHIP_MS = 6000
const RECENT_LIMIT = 5

export default function ThreatTicker({ onClick, onSelectCve }) {
  const [count, setCount] = useState(null)       // loaded target value
  const [display, setDisplay] = useState(0)      // animated value
  const [failed, setFailed] = useState(false)
  const [newDelta, setNewDelta] = useState(null) // "+N new" chip
  const [open, setOpen] = useState(false)
  const [recent, setRecent] = useState(null)     // newest entries for dropdown
  const [recentLoading, setRecentLoading] = useState(false)
  const prevCountRef = useRef(null)
  const rafRef = useRef(null)
  const chipTimerRef = useRef(null)
  const wrapRef = useRef(null)

  // Fetch once now, then poll the live feed periodically. Each refresh
  // re-fetches the catalog (cache-busted) — still anonymous, still RAM-only.
  useEffect(() => {
    let alive = true

    async function check({ refresh = false } = {}) {
      try {
        const c = await getKevCount({ refresh })
        if (!alive) return
        setFailed(false)
        setCount(prev => {
          if (prev != null && c > prev) {
            setNewDelta(c - prev)
            clearTimeout(chipTimerRef.current)
            chipTimerRef.current = setTimeout(() => setNewDelta(null), NEW_CHIP_MS)
          }
          return c
        })
      } catch {
        // A failed refresh keeps the last good number on display; only the
        // very first load surfaces the failure state.
        if (alive && prevCountRef.current == null) setFailed(true)
      }
    }

    check()
    const interval = setInterval(() => check({ refresh: true }), POLL_MS)
    const onVisible = () => {
      if (document.visibilityState === 'visible') check({ refresh: true })
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      alive = false
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
      clearTimeout(chipTimerRef.current)
    }
  }, [])

  // Animate display from the previous value to the new target.
  useEffect(() => {
    if (count == null) return
    const from = prevCountRef.current ?? 0

    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      // No animation for reduced-motion users — still set asynchronously
      // to keep the effect free of synchronous setState.
      rafRef.current = requestAnimationFrame(() => {
        prevCountRef.current = count
        setDisplay(count)
      })
      return
    }

    const start = performance.now()
    const tick = now => {
      const t = Math.min((now - start) / DURATION_MS, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(Math.round(from + (count - from) * eased))
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        prevCountRef.current = count
      }
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [count])

  // Close the dropdown on outside click / Escape.
  useEffect(() => {
    if (!open) return
    function onDocClick(e) {
      if (!wrapRef.current?.contains(e.target)) setOpen(false)
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  async function openDropdown() {
    setOpen(true)
    if (recentLoading) return
    setRecentLoading(true)
    try {
      // Cheap: reads the same in-RAM cache the poll keeps fresh.
      const entries = await getKevRecent(RECENT_LIMIT)
      setRecent(entries)
    } catch {
      setRecent([])
    } finally {
      setRecentLoading(false)
    }
  }

  function pick(cveId) {
    setOpen(false)
    onSelectCve?.(cveId)
  }

  return (
    <div ref={wrapRef} className="relative hidden md:block"
         onMouseEnter={openDropdown}
         onMouseLeave={() => setOpen(false)}>

      <button
        onClick={onClick}
        disabled={failed}
        aria-expanded={open}
        aria-haspopup="true"
        className={`flex items-center gap-2 h-8 px-2.5 rounded-md text-xs border transition-all duration-200 ${
          failed
            ? 'border-dark-border text-gray-500 cursor-default'
            : 'border-red-500/30 bg-red-500/[0.07] text-red-300 hover:border-red-500/55 hover:bg-red-500/[0.13] hover:shadow-[0_0_16px_rgba(248,81,73,0.25)]'
        }`}
        title={failed
          ? 'KEV catalog unavailable'
          : 'CISA Known Exploited Vulnerabilities — live count, re-checked every 5 minutes. Click to browse the catalog.'}
        aria-label={`CISA KEV catalog: ${count == null ? 'loading' : count} known exploited vulnerabilities${
          newDelta ? `, ${newDelta} newly added` : ''
        }`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${failed ? 'bg-gray-600' : 'bg-red-500 animate-pulse-dot'}`}
          aria-hidden="true"
        />
        <span
          className={`font-mono font-bold tabular-nums transition-colors duration-300 ${
            newDelta ? 'text-green-400' : 'text-red-400'
          }`}
        >
          {failed ? '—' : count == null ? '…' : display.toLocaleString()}
        </span>

        {newDelta != null && (
          <span
            className="animate-scale-in inline-flex items-center px-1.5 py-px rounded-md
                       text-[10px] font-bold text-green-400 bg-green-500/10 border border-green-500/40"
          >
            +{newDelta} new
          </span>
        )}

        <span className="hidden lg:inline text-[10px] uppercase tracking-wider text-[#8b949e]">
          known exploited
        </span>
      </button>

      {/* Newest additions dropdown */}
      {open && !failed && (
        <div
          className="absolute right-0 top-full mt-2 w-[340px] card-flat !p-1.5 animate-scale-in z-50"
          role="region"
          aria-label="Newest KEV additions"
        >
          <div className="flex items-center justify-between px-2 py-1">
            <span className="section-label">Newest KEV additions</span>
            <button
              onClick={() => { setOpen(false); onClick?.() }}
              className="text-[10px] text-[#58a6ff] hover:text-[#79c0ff] transition-colors"
            >
              Full catalog ↗
            </button>
          </div>

          {recentLoading && recent == null && (
            <div className="space-y-1.5 px-1 py-1" role="status" aria-label="Loading latest entries">
              {[0, 1, 2].map(i => <div key={i} className="skeleton h-9 w-full" />)}
            </div>
          )}

          {recent != null && recent.length === 0 && (
            <p className="px-2 py-3 text-center text-xs text-gray-500">
              Catalog entries unavailable right now.
            </p>
          )}

          {recent != null && recent.length > 0 && (
            <div className="flex flex-col gap-0.5">
              {recent.map(e => (
                <button
                  key={e.cve_id}
                  onClick={() => pick(e.cve_id)}
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
                    <span className="block text-[11px] text-[#8b949e] truncate">
                      {[e.vendor, e.product].filter(Boolean).join(' · ') || e.vulnerability_name || '—'}
                    </span>
                  </span>
                  <span className="shrink-0 text-[10px] font-mono text-gray-400">
                    {formatDate(e.date_added)}
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
      )}
    </div>
  )
}
