// Interactive CVSS vector breakdown: each metric becomes a chip whose tooltip
// explains the metric and the meaning of its value. Pure client-side parsing.

import { parseVector } from '../utils/vectorParser'

export default function VectorChips({ vectorString }) {
  const parsed = parseVector(vectorString)
  if (!parsed) return null

  return (
    <div className="flex flex-wrap gap-1.5">
      {parsed.metrics.map(m => (
        <span
          key={m.key}
          className="pill font-mono text-[11px] cursor-help"
          title={`${m.name}: ${m.valueLabel} (${m.key}:${m.value})`}
        >
          <span className="text-[#8b949e]">{m.key}</span>
          <span className="text-[#58a6ff] font-semibold">{m.value}</span>
          <span className="text-gray-500 hidden md:inline">· {m.valueLabel}</span>
        </span>
      ))}
      <span className="text-[10px] text-gray-500 self-center ml-1">
        CVSS v{parsed.version} · hover a metric for details
      </span>
    </div>
  )
}
