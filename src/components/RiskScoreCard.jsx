const PRIORITY_STYLES = {
  P1: { text: 'text-red-400', border: 'border-red-500/40', ring: '#e5484d' },
  P2: { text: 'text-orange-400', border: 'border-orange-500/40', ring: '#f76808' },
  P3: { text: 'text-yellow-400', border: 'border-yellow-500/40', ring: '#e7a008' },
  P4: { text: 'text-green-400', border: 'border-green-500/40', ring: '#30a46c' },
}

function SignalBar({ signal }) {
  const pct = signal.max > 0 ? Math.min(100, (signal.value / signal.max) * 100) : 0
  const ratio = signal.max > 0 ? signal.value / signal.max : 0
  const barColor = ratio >= 0.7 ? '#e5484d' : ratio >= 0.4 ? '#f76808' : ratio >= 0.2 ? '#e7a008' : '#30a46c'
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-400 w-24 shrink-0 truncate">{signal.label}</span>
        <div className="flex-1 h-1.5 rounded-full bg-dark-bg overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: barColor }} />
        </div>
        <span className="text-xs text-gray-500 w-12 text-right">{signal.value}/{signal.max}</span>
        <span className="text-[10px] text-gray-600 w-10 text-right shrink-0">{signal.weight}</span>
      </div>
      {signal.reason && (
        <div className="pl-24 text-[11px] text-gray-500">{signal.reason}</div>
      )}
    </div>
  )
}

function TrendIndicator({ trends }) {
  if (!trends) return null
  const { epss_delta } = trends
  if (epss_delta == null) return null
  const deltaLabel = `${Math.abs(epss_delta) * 100 >= 1 ? Math.round(Math.abs(epss_delta) * 100) : '<1'}`
  const rising = epss_delta > 0.01
  const falling = epss_delta < -0.01
  return (
    <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${
      rising
        ? 'text-red-400 border-red-500/40 bg-red-500/[0.07]'
        : falling
          ? 'text-green-400 border-green-500/40 bg-green-500/[0.07]'
          : 'text-gray-500 border-dark-border bg-dark-bg'
    }`}>
      <span>{rising ? '▲' : falling ? '▼' : '◆'}</span>
      <span>EPSS {rising ? `+${deltaLabel}%` : falling ? `−${deltaLabel}%` : 'stable'}</span>
    </div>
  )
}

export default function RiskScoreCard({ risk }) {
  if (!risk) return null

  const pStyle = PRIORITY_STYLES[risk.priority] || PRIORITY_STYLES.P4
  const circumference = 2 * Math.PI * 34

  return (
    <div className="card mb-5">
      <div className="flex flex-wrap items-start gap-6 mb-5">

        <div className="flex flex-col items-center">
          <div className="relative w-24 h-24">
            <svg className="w-24 h-24 -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="34" fill="none" stroke="#232a36" strokeWidth="5" />
              <circle
                cx="40" cy="40" r="34" fill="none"
                stroke={pStyle.ring}
                strokeWidth="5"
                strokeDasharray={`${(risk.score / 100) * circumference} ${circumference}`}
                strokeLinecap="round"
                className="transition-all duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-semibold" style={{ color: pStyle.ring }}>{risk.score}</span>
              <span className="text-[10px] text-gray-500 -mt-0.5">/ 100</span>
            </div>
          </div>
          <span className={`mt-2.5 text-sm font-semibold px-3 py-0.5 rounded-full border ${pStyle.text} ${pStyle.border}`}>
            {risk.priority}
          </span>
          <span className="text-[10px] text-gray-600 mt-1 uppercase tracking-widest">{risk.level} risk</span>
          <div className="mt-2">
            <TrendIndicator trends={risk.trends} />
          </div>
        </div>

        <div className="flex-1 min-w-0 space-y-2.5">
          <div className="section-label mb-2">Signal breakdown</div>
          {risk.signals?.map((s, i) => (
            <SignalBar key={i} signal={s} />
          ))}
        </div>
      </div>

      {risk.reasons?.length > 0 && (
        <div className="mb-4 p-4 bg-dark-bg rounded-lg border border-dark-border/70">
          <div className="section-label mb-2">Why this priority?</div>
          <ul className="space-y-1.5">
            {risk.reasons.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-gray-300">
                <span className="w-1 h-1 rounded-full bg-accent-cyan mt-1.5 shrink-0" />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {risk.recommendation && (
        <div className={`rounded-lg px-4 py-3 text-sm border-l-2 ${
          risk.priority === 'P1'
            ? 'border-red-500 bg-red-500/[0.07] text-red-200/80'
            : risk.priority === 'P2'
              ? 'border-orange-500 bg-orange-500/[0.07] text-orange-200/80'
              : 'border-accent-cyan bg-accent-cyan/[0.06] text-gray-300'
        }`}>
          <span className="font-semibold text-gray-100">Recommendation: </span>
          {risk.recommendation}
        </div>
      )}
    </div>
  )
}