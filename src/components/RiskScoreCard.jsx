const PRIORITY_STYLES = {
  P1: { text: 'text-[#f85149]', border: 'border-[#f85149]/40', ring: '#f85149', bg: 'rgba(248,81,73,0.08)'  },
  P2: { text: 'text-[#db6d28]', border: 'border-[#db6d28]/40', ring: '#db6d28', bg: 'rgba(219,109,40,0.08)' },
  P3: { text: 'text-[#d29922]', border: 'border-[#d29922]/40', ring: '#d29922', bg: 'rgba(210,153,34,0.08)' },
  P4: { text: 'text-[#3fb950]', border: 'border-[#3fb950]/40', ring: '#3fb950', bg: 'rgba(63,185,80,0.08)'  },
}

function SignalBar({ signal }) {
  const pct = signal.max > 0 ? Math.min(100, (signal.value / signal.max) * 100) : 0
  const ratio = signal.max > 0 ? signal.value / signal.max : 0
  const barColor = ratio >= 0.7 ? '#f85149' : ratio >= 0.4 ? '#db6d28' : ratio >= 0.2 ? '#d29922' : '#3fb950'

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-3">
        <span className="text-xs text-[#8b949e] w-28 shrink-0 leading-snug">{signal.label}</span>
        <div className="flex-1 h-2 rounded-full overflow-hidden bg-dark-card2">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              background: barColor,
            }}
          />
        </div>
        <span className="text-xs text-[#8b949e] w-12 text-right font-mono tabular-nums">{signal.value}/{signal.max}</span>
        <span className="text-[10px] text-[#8b949e] w-12 text-right shrink-0" title={`Weight ${signal.weight}`}>
          {Math.round(pct)}%
        </span>
      </div>
      {signal.reason && (
        <div className="pl-28 text-[11px] text-[#8b949e]">{signal.reason}</div>
      )}
    </div>
  )
}

function TrendIndicator({ trends }) {
  if (!trends) return null
  const { epss_delta } = trends
  if (epss_delta == null) return null
  const deltaLabel = `${Math.abs(epss_delta) * 100 >= 1 ? Math.round(Math.abs(epss_delta) * 100) : '<1'}`
  const rising  = epss_delta > 0.01
  const falling = epss_delta < -0.01
  return (
    <div className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border ${
      rising  ? 'text-[#f85149] border-[#f85149]/40 bg-[#f85149]/[0.06]'   :
      falling ? 'text-[#3fb950] border-[#3fb950]/40 bg-[#3fb950]/[0.06]' :
               'text-[#8b949e] border-dark-border bg-dark-card2'
    }`}>
      <span>{rising ? '▲' : falling ? '▼' : '◆'}</span>
      <span>EPSS {rising ? `+${deltaLabel}%` : falling ? `−${deltaLabel}%` : 'stable'}</span>
    </div>
  )
}

export default function RiskScoreCard({ risk, delayMs = 0 }) {
  if (!risk) return null

  const pStyle = PRIORITY_STYLES[risk.priority] || PRIORITY_STYLES.P4
  const circumference = 2 * Math.PI * 34
  // 270° gauge: the arc spans 3/4 of the circle with the gap at the bottom.
  const ARC_SPAN = 0.75

  return (
    <div
      className="card mb-5"
      style={delayMs ? { animationDelay: `${delayMs}ms` } : undefined}
    >
      {/* Card header */}
      <div className="flex items-center gap-2 mb-5">
        <span className="section-label">Risk Assessment</span>
        <div className="ml-auto">
          <TrendIndicator trends={risk.trends} />
        </div>
      </div>

      <div className="flex flex-wrap items-start gap-6 mb-5">

        {/* Score gauge — 270° arc with round caps, gap at the bottom */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative w-28 h-28">
            <svg
              className="w-28 h-28"
              viewBox="0 0 80 80"
              style={{ transform: 'rotate(135deg)' }}
              role="img"
              aria-label={`Risk score ${risk.score} out of 100`}
            >
              <circle
                cx="40" cy="40" r="34" fill="none"
                stroke="#21262d" strokeWidth="6"
                strokeDasharray={`${ARC_SPAN * circumference} ${circumference}`}
                strokeLinecap="round"
              />
              <circle
                cx="40" cy="40" r="34" fill="none"
                stroke={pStyle.ring}
                strokeWidth="6"
                strokeDasharray={`${(risk.score / 100) * ARC_SPAN * circumference} ${circumference}`}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold font-mono tabular-nums" style={{ color: pStyle.ring }}>{risk.score}</span>
              <span className="text-[10px] text-[#8b949e] -mt-0.5">/ 100</span>
            </div>
          </div>

          <div className={`px-4 py-1.5 rounded-md border text-sm font-bold tracking-wide ${pStyle.text} ${pStyle.border} ${risk.priority === 'P1' ? 'shadow-[0_0_18px_rgba(248,81,73,0.4)] animate-glow-breathe' : ''}`}
               style={{ background: pStyle.bg }}>
            {risk.priority}
          </div>
          <span className="text-[10px] text-[#8b949e] uppercase tracking-widest">{risk.level} risk</span>
        </div>

        {/* Signal bars — full width below the gauge: the card lives in the
            narrow right rail, so a side-by-side layout would squeeze the
            rows past the card edge */}
        <div className="w-full min-w-0 space-y-3">
          <div className="section-label mb-3">Signal breakdown</div>
          {risk.signals?.map((s, i) => (
            <SignalBar key={i} signal={s} />
          ))}
        </div>
      </div>

      {/* Reasons */}
      {risk.reasons?.length > 0 && (
        <div className="inset-panel mb-4 p-4">
          <div className="section-label mb-3">Why this priority?</div>
          <ul className="space-y-2">
            {risk.reasons.map((r, i) => (
              <li key={i} className="flex items-start gap-2.5 text-xs text-[#adbac7]">
                <span className="w-1.5 h-1.5 rounded-sm mt-1.5 shrink-0"
                      style={{ background: pStyle.ring }} />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendation */}
      {risk.recommendation && (
        <div className={`rounded-md px-4 py-3.5 text-sm border-l-[3px] ${
          risk.priority === 'P1' ? 'border-[#f85149] text-[#e6b8b6]' :
          risk.priority === 'P2' ? 'border-[#db6d28] text-[#e2b390]' :
                                   'border-[#58a6ff] text-[#adbac7]'
        }`}
        style={{
          background: risk.priority === 'P1' ? 'rgba(248,81,73,0.07)' :
                      risk.priority === 'P2' ? 'rgba(219,109,40,0.07)' :
                                               'rgba(88,166,255,0.06)',
        }}>
          <span className="font-semibold text-gray-100">Recommendation: </span>
          {risk.recommendation}
        </div>
      )}
    </div>
  )
}