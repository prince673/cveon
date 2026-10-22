import { GUIDE_TYPES } from '../data/guideTypes'
import { LayersIcon } from './icons'

/* Branded palette rotation for guide chips — keeps coverage colorful but
   on-theme instead of a full-spectrum rainbow. */
const COLOR_CYCLE = [
  { text: 'text-accent-indigo', border: 'rgba(129,140,248,0.28)', bg: 'rgba(129,140,248,0.07)', dot: '#818cf8' },
  { text: 'text-accent-cyan',   border: 'rgba(34,211,238,0.28)',  bg: 'rgba(34,211,238,0.06)',  dot: '#22d3ee' },
  { text: 'text-accent-purple', border: 'rgba(167,139,250,0.28)', bg: 'rgba(167,139,250,0.06)', dot: '#a78bfa' },
  { text: 'text-accent-pink',   border: 'rgba(244,114,182,0.28)', bg: 'rgba(244,114,182,0.06)', dot: '#f472b6' },
  { text: 'text-accent-amber',  border: 'rgba(251,191,36,0.28)',  bg: 'rgba(251,191,36,0.05)',  dot: '#fbbf24' },
  { text: 'text-accent-purple', border: 'rgba(196,181,253,0.28)', bg: 'rgba(196,181,253,0.06)', dot: '#c4b5fd' },
]

export default function GuideTypesPanel() {
  // The lightweight registry (see src/data/guideTypes.js) lets this home-page
  // panel render coverage without pulling the full template catalog in.
  const types = GUIDE_TYPES

  return (
    <section className="card mt-4">
      <header className="flex items-center gap-3 mb-5">
        <span className="flex items-center justify-center w-8 h-8 rounded-xl
                         bg-white/[0.05] border border-white/[0.08] text-gray-400">
          <LayersIcon size={15} />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-white leading-none mb-0.5">Guide Coverage</h2>
          <p className="text-[11px] text-gray-600">Auto-detected from CWE IDs and description</p>
        </div>
        <span className="ml-auto tag bg-accent-cyan/10 text-accent-cyan border-accent-cyan/20
                         shadow-[0_0_10px_-4px_rgba(91,141,239,0.4)]">
          {types.length} guides
        </span>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {types.map(({ key, name }, i) => {
          const c = COLOR_CYCLE[i % COLOR_CYCLE.length]
          return (
            <div
              key={key}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl
                          transition-all duration-200 cursor-default
                          hover:scale-[1.02] hover:-translate-y-px ${c.text}`}
              style={{
                background: c.bg,
                border: `1px solid ${c.border}`,
              }}
            >
              <span className="w-2 h-2 rounded-full shrink-0 flex-shrink-0"
                    style={{ background: c.dot, boxShadow: `0 0 6px 1px ${c.dot}60` }} />
              <span className="text-xs font-medium truncate">{name}</span>
            </div>
          )
        })}
      </div>
    </section>
  )
}