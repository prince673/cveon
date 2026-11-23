// Horizontal SVG timeline of a vulnerability's lifecycle events:
// published → last modified → KEV listed → KEV remediation due.
// Pure SVG — no chart library, no network, no storage.

function cluster(events, min, span, padL, padR, W) {
  // Group events whose x positions land within ~36px so coincident dates
  // (published == modified is common) render one dot with merged labels.
  const xOf = t => padL + ((t - min) / span) * (W - padL - padR)
  const clusters = []
  for (const e of events) {
    const x = xOf(e.time)
    const last = clusters[clusters.length - 1]
    if (last && Math.abs(x - last.x) < 36) {
      last.items.push(e)
      last.x = (last.x + x) / 2
    } else {
      clusters.push({ x, items: [e] })
    }
  }
  return clusters
}

export default function Timeline({ events }) {
  const valid = (events || [])
    .filter(e => e?.date)
    .map(e => ({ ...e, time: new Date(e.date).getTime() }))
    .filter(e => Number.isFinite(e.time))
    .sort((a, b) => a.time - b.time)

  if (valid.length === 0) return null

  const W = 620
  const H = 78
  const padL = 34
  const padR = 34
  const min = valid[0].time
  const max = valid[valid.length - 1].time
  const span = Math.max(max - min, 1)
  const clusters = cluster(valid, min, span, padL, padR, W)
  const axisY = H / 2 + 6

  return (
    <div className="inset-panel px-4 py-3 mb-5">
      <div className="section-label mb-1.5">Timeline</div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label={'Lifecycle timeline: ' + valid.map(e => `${e.label} ${e.date.slice(0, 10)}`).join(', ')}
      >
        <line x1={padL - 20} x2={W - padR + 20} y1={axisY} y2={axisY}
              stroke="#30363d" strokeWidth="2" strokeLinecap="round" />
        {clusters.map((c, i) => {
          const above = i % 2 === 0
          const label = c.items.map(e => e.label).join(' · ')
          const date = c.items[c.items.length - 1].date.slice(0, 10)
          const color = c.items[c.items.length - 1].color || '#58a6ff'
          const labelY = above ? 18 : H - 22
          const dateY = above ? 32 : H - 8
          // Keep text inside the viewBox when an event sits at either edge
          // (e.g. a lone Published date renders at the far left).
          const lx = Math.min(Math.max(c.x, 46), W - 46)
          return (
            <g key={i}>
              <circle cx={c.x} cy={axisY} r="5" fill={color} stroke="#0d1117" strokeWidth="1.5" />
              <line x1={c.x} x2={c.x} y1={above ? 36 : axisY + 6} y2={above ? axisY - 6 : H - 36}
                    stroke="#30363d" strokeWidth="1" />
              <text x={lx} y={labelY} textAnchor="middle" fontSize="10.5"
                    fill="#c9d1d9" fontWeight="600">{label}</text>
              <text x={lx} y={dateY} textAnchor="middle" fontSize="9.5"
                    fill="#8b949e" fontFamily="ui-monospace, monospace">{date}</text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
