import { useState, useEffect } from 'react'
import { getDashboardAnalytics } from '../services/api'
import { ChartIcon } from './icons'

function BarRow({ label, value, max, color }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-400 w-36 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-dark-bg overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs text-gray-500 w-8 text-right">{value}</span>
    </div>
  )
}

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    getDashboardAnalytics()
      .then(data => { if (!cancelled) setAnalytics(data) })
      .catch(() => { if (!cancelled) setAnalytics(null) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 rounded-full border-2 border-dark-border" />
          <div className="absolute inset-0 rounded-full border-2 border-t-accent-cyan animate-spin-slow" />
        </div>
        <p className="text-sm animate-pulse">Loading analytics…</p>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="card text-center py-10">
        <p className="text-sm text-gray-500">Analytics are unavailable right now.</p>
      </div>
    )
  }

  const totalCVEs = analytics.totalCVEs || 0
  const cveBars = [
    { label: 'P1 (critical)', value: analytics.p1Count || 0, color: '#e5484d' },
    { label: 'P2 (high)', value: analytics.p2Count || 0, color: '#f76808' },
    { label: 'Critical risk', value: analytics.criticalCVEs || 0, color: '#a855f7' },
    { label: 'High risk', value: analytics.highCVEs || 0, color: '#e7a008' },
  ]
  const cveMax = Math.max(...cveBars.map(b => b.value), 1)

  const intelBars = [
    { label: 'KEV catalog', value: analytics.kevEntries || 0, color: '#e5484d' },
    { label: 'Exploit sources', value: analytics.exploitCount || 0, color: '#f76808' },
    { label: 'Open remediations', value: analytics.openRemediations || 0, color: '#e7a008' },
    { label: 'Unread alerts', value: analytics.unreadAlerts || 0, color: '#8b5cf6' },
  ]
  const intelMax = Math.max(...intelBars.map(b => b.value), 1)

  return (
    <div className="space-y-5">
      <header className="flex items-center gap-2.5">
        <span className="flex items-center justify-center w-7 h-7 rounded-lg
                         bg-white/[0.06] border border-dark-border text-gray-400">
          <ChartIcon size={15} />
        </span>
        <h2 className="text-base font-semibold text-white">Analytics</h2>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'CVEs indexed', value: totalCVEs, accent: 'text-accent-cyan' },
          { label: 'Critical risk', value: analytics.criticalCVEs || 0, accent: 'text-red-400' },
          { label: 'High risk', value: analytics.highCVEs || 0, accent: 'text-orange-400' },
          { label: 'KEV entries', value: analytics.kevEntries || 0, accent: 'text-purple-400' },
        ].map(s => (
          <div key={s.label} className="card text-center py-4">
            <div className={`text-2xl font-semibold ${s.accent}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="card">
          <h3 className="section-label mb-4">CVE intelligence</h3>
          <div className="space-y-2.5">
            {cveBars.map(b => <BarRow key={b.label} {...b} max={cveMax} />)}
          </div>
        </div>
        <div className="card">
          <h3 className="section-label mb-4">Threat landscape</h3>
          <div className="space-y-2.5">
            {intelBars.map(b => <BarRow key={b.label} {...b} max={intelMax} />)}
          </div>
        </div>
      </div>
    </div>
  )
}