const PRIORITY_STYLES = {
  P1: { text: 'text-red-400',    border: 'border-red-500/35',    ring: '#e5484d', glow: 'rgba(229,72,77,0.45)',   bg: 'rgba(229,72,77,0.08)'  },
  P2: { text: 'text-orange-400', border: 'border-orange-500/35', ring: '#f76808', glow: 'rgba(247,104,8,0.45)',   bg: 'rgba(247,104,8,0.07)'  },
  P3: { text: 'text-yellow-400', border: 'border-yellow-500/35', ring: '#e7a008', glow: 'rgba(231,160,8,0.4)',    bg: 'rgba(231,160,8,0.06)'  },
  P4: { text: 'text-green-400',  border: 'border-green-500/35',  ring: '#30a46c', glow: 'rgba(48,164,108,0.4)',   bg: 'rgba(48,164,108,0.06)' },
}

function SignalBar({ signal }) {
  const pct = signal.max > 0 ? Math.min(100, (signal.value / signal.max) * 100) : 0
  const ratio = signal.max > 0 ? signal.value / signal.max : 0
  const barColor = ratio >= 0.7 ? '#e5484d' : ratio >= 0.4 ? '#f76808' : ratio >= 0.2 ? '#e7a008' : '#30a46c'
  const barGlow  = ratio >= 0.7 ? 'rgba(229,72,77,0.5)' : ratio >= 0.4 ? 'rgba(247,104,8,0.5)' : 'rgba(231,160,8,0.4)'

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-400 w-28 shrink-0 truncate">{signal.label}</span>
        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${pct}%`,
              background: `linear-gradient(90deg, ${barColor}99, ${barColor})`,
              boxShadow: pct > 10 ? `0 0 8px 0px ${barGlow}` : 'none',
            }}
          />
        </div>
        <span className="text-xs text-gray-600 w-12 text-right font-mono">{signal.value}/{signal.max}</span>
        <span className="text-[10px] text-gray-700 w-10 text-right shrink-0">{signal.weight}</span>
      </div>
      {signal.reason && (
        <div className="pl-28 text-[11px] text-gray-600">{signal.reason}</div>
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
    <div className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border ${
      rising  ? 'text-red-400 border-red-500/30 bg-red-500/[0.07]'   :
      falling ? 'text-green-400 border-green-500/30 bg-green-500/[0.07]' :
               'text-gray-500 border-white/[0.07] bg-white/[0.03]'
    }`}>
      <span className={rising ? 'animate-pulse' : ''}>{rising ? '▲' : falling ? '▼' : '◆'}</span>
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
      {/* Card header */}
      <div className="flex items-center gap-2 mb-5">
        <span className="section-label">Risk Assessment</span>
        <div className="ml-auto">
          <TrendIndicator trends={risk.trends} />
        </div>
      </div>

      <div className="flex flex-wrap items-start gap-6 mb-5">

        {/* Score ring */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative w-28 h-28">
            <svg className="w-28 h-28 -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5.5" />
              <circle
                cx="40" cy="40" r="34" fill="none"
                stroke={pStyle.ring}
                strokeWidth="5.5"
                strokeDasharray={`${(risk.score / 100) * circumference} ${circumference}`}
                strokeLinecap="round"
                className="transition-all duration-1000"
                style={{ filter: `drop-shadow(0 0 6px ${pStyle.glow})` }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold" style={{ color: pStyle.ring }}>{risk.score}</span>
              <span className="text-[10px] text-gray-600 -mt-0.5">/ 100</span>
            </div>
          </div>

          <div className={`px-4 py-1.5 rounded-full border text-sm font-bold tracking-wide ${pStyle.text} ${pStyle.border}`}
               style={{ background: pStyle.bg }}>
            {risk.priority}
          </div>
          <span className="text-[10px] text-gray-600 uppercase tracking-widest">{risk.level} risk</span>
        </div>

        {/* Signal bars */}
        <div className="flex-1 min-w-0 space-y-3">
          <div className="section-label mb-3">Signal Breakdown</div>
          {risk.signals?.map((s, i) => (
            <SignalBar key={i} signal={s} />
          ))}
        </div>
      </div>

      {/* Reasons */}
      {risk.reasons?.length > 0 && (
        <div className="mb-4 p-4 rounded-xl"
             style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="section-label mb-3">Why this priority?</div>
          <ul className="space-y-2">
            {risk.reasons.map((r, i) => (
              <li key={i} className="flex items-start gap-2.5 text-xs text-gray-300">
                <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                      style={{ background: pStyle.ring }} />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendation */}
      {risk.recommendation && (
        <div className={`rounded-xl px-4 py-3.5 text-sm border-l-[3px] ${
          risk.priority === 'P1' ? 'border-red-500 text-red-200/80' :
          risk.priority === 'P2' ? 'border-orange-500 text-orange-200/80' :
                                   'border-accent-cyan text-gray-300'
        }`}
        style={{
          background: risk.priority === 'P1' ? 'rgba(229,72,77,0.07)' :
                      risk.priority === 'P2' ? 'rgba(247,104,8,0.07)' :
                                               'rgba(91,141,239,0.06)',
        }}>
          <span className="font-semibold text-gray-100">Recommendation: </span>
          {risk.recommendation}
        </div>
      )}
    </div>
  )
}