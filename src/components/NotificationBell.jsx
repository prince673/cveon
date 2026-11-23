import { useEffect, useRef, useState } from 'react'
import { BellIcon } from './icons'
import LatestCvePopup from './LatestCvePopup'

// Only show CVEs published in the last 60 days to avoid ancient CVEs
// that were recently re-imported/modified. NVD API defaults to pubDate desc,
// but we add explicit params for clarity and a pubStartDate filter.
function buildNvdRecentUrl() {
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];
  return (
    'https://services.nvd.nist.gov/rest/json/cves/2.0?' +
    new URLSearchParams({
      resultsPerPage: '8',
      startIndex: '0',
      sortBy: 'pubDate',
      sortOrder: 'desc',
      pubStartDate: sixtyDaysAgo,
    })
  );
}

function severityColor(severity) {
  if (!severity) return 'bg-gray-500'
  const s = severity.toUpperCase()
  if (s === 'CRITICAL') return 'bg-red-500'
  if (s === 'HIGH') return 'bg-orange-500'
  if (s === 'MEDIUM') return 'bg-yellow-500'
  return 'bg-green-500'
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export default function NotificationBell({ onSelectCve }) {
  const [open, setOpen] = useState(false)
  const [cves, setCves] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [hasNew, setHasNew] = useState(false)
  const [latestCve, setLatestCve] = useState(null)
  const [showPopup, setShowPopup] = useState(false)
  const panelRef = useRef(null)
  const lastSeenRef = useRef(sessionStorage.getItem('cveon_last_seen_cve') || '')

  useEffect(() => {
    let cancelled = false

    async function fetchLatest() {
      setLoading(true)
      setError(null)
      try {
        const resp = await fetch(buildNvdRecentUrl(), {
          headers: { Accept: 'application/json' },
        })
        if (!resp.ok) throw new Error('NVD unavailable')
        const data = await resp.json()
        const items = (data.vulnerabilities || []).map(v => {
          const cve = v.cve || {}
          const desc =
            (cve.descriptions || []).find(d => d.lang === 'en')?.value ||
            'No description.'
          const metrics = cve.metrics || {}
          const cvss =
            metrics.cvssMetricV31?.[0] ||
            metrics.cvssMetricV40?.[0] ||
            metrics.cvssMetricV30?.[0] ||
            null
          const score = cvss?.cvssData?.baseScore ?? null
          const severity = cvss?.cvssData?.baseSeverity || null
          return {
            id: cve.id,
            description: desc.length > 120 ? desc.slice(0, 117) + '…' : desc,
            published: cve.published,
            score,
            severity,
          }
        })
        if (!cancelled) {
          setCves(items)
          if (items.length > 0) {
            const top = items[0]
            setLatestCve(top)
            if (top.id !== lastSeenRef.current) {
              setHasNew(true)
              setShowPopup(true)
            }
          }
        }
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchLatest()
    const interval = setInterval(fetchLatest, 5 * 60 * 1000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  function markLastSeen(id) {
    lastSeenRef.current = id
    // sessionStorage (not localStorage): erased when the tab closes, keeping
    // the app's zero-persistence privacy promise.
    sessionStorage.setItem('cveon_last_seen_cve', id)
  }

  function handleOpen() {
    setOpen(prev => !prev)
    if (!open && cves.length > 0) {
      setHasNew(false)
      markLastSeen(cves[0].id)
    }
    setShowPopup(false)
  }

  function handleSelect(cveId) {
    setOpen(false)
    onSelectCve?.(cveId)
  }

  function handleDismiss() {
    setShowPopup(false)
    if (latestCve) {
      setHasNew(false)
      markLastSeen(latestCve.id)
    }
  }

  function handlePopupSelect(cveId) {
    setShowPopup(false)
    setHasNew(false)
    markLastSeen(cveId)
    onSelectCve?.(cveId)
  }

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={handleOpen}
        className="relative flex items-center justify-center w-8 h-8 rounded-md
                   text-[#8b949e] hover:text-gray-100 hover:bg-dark-card2
                   transition-colors duration-150"
        aria-label="Latest CVE notifications"
      >
        <BellIcon size={15} />
        {hasNew && (
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#58a6ff]
                           animate-pulse" />
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className="absolute right-0 top-10 w-80 sm:w-96 max-h-[420px] overflow-y-auto
                     rounded-lg border border-dark-border bg-[#161b22] shadow-2xl z-50"
        >
          {/* Header */}
          <div className="sticky top-0 bg-[#161b22] border-b border-dark-border px-4 py-3
                          flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-100">Latest CVEs</span>
            <span className="text-[10px] text-[#8b949e] font-mono">NVD Live</span>
          </div>

          {loading && cves.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-[#8b949e]">
              <span className="inline-block animate-spin mr-2">⟳</span>
              Fetching latest vulnerabilities…
            </div>
          )}

          {error && cves.length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-red-400">
              {error}
            </div>
          )}

          {cves.map((cve, idx) => (
            <button
              key={cve.id}
              onClick={() => handleSelect(cve.id)}
              className={`w-full text-left px-4 py-3 flex flex-col gap-1
                         hover:bg-dark-card2 transition-colors duration-100
                         ${idx < cves.length - 1 ? 'border-b border-dark-border' : ''}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13px] font-mono font-semibold text-[#58a6ff]">
                  {cve.id}
                </span>
                <div className="flex items-center gap-2">
                  {cve.score !== null && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded
                                  text-white ${severityColor(cve.severity)}`}
                    >
                      {cve.score}
                    </span>
                  )}
                  <span className="text-[10px] text-[#8b949e] whitespace-nowrap">
                    {timeAgo(cve.published)}
                  </span>
                </div>
              </div>
              <p className="text-[12px] text-[#8b949e] leading-relaxed line-clamp-2">
                {cve.description}
              </p>
            </button>
          ))}

          {cves.length > 0 && (
            <div className="px-4 py-2.5 border-t border-dark-border text-center">
              <span className="text-[10px] text-[#8b949e]">
                Auto-refreshes every 5 min · Click a CVE to analyze
              </span>
            </div>
          )}
        </div>
      )}

      {/* Latest CVE alert popup — pops when a fresh CVE lands in the feed */}
      {hasNew && latestCve && showPopup && (
        <LatestCvePopup
          cve={latestCve}
          onClose={handleDismiss}
          onSelectCve={handlePopupSelect}
        />
      )}
    </div>
  )
}
