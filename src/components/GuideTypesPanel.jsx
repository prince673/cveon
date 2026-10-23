import { GUIDE_TYPES } from '../data/guideTypes'
import { LayersIcon } from './icons'

/* Neutral console chips — one accent dot, no rainbow rotation. */
const CHIP = {
  text: 'text-[#8b949e]',
  border: '#30363d',
  bg: '#161b22',
  dot: '#58a6ff',
}

export default function GuideTypesPanel() {
  // The lightweight registry (see src/data/guideTypes.js) lets this home-page
  // panel render coverage without pulling the full template catalog in.
  const types = GUIDE_TYPES

  return (
    <section className="card mt-4">
      <header className="flex items-center gap-3 mb-5">
        <span className="flex items-center justify-center w-8 h-8 rounded-md
                         bg-dark-card2 border border-dark-border text-gray-400">
          <LayersIcon size={15} />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-gray-100 leading-none mb-0.5">Guide coverage</h2>
          <p className="text-[11px] text-[#6e7681]">Auto-detected from CWE IDs and description</p>
        </div>
        <span className="ml-auto tag bg-transparent text-[#8b949e] border-dark-border font-mono">
          {types.length} guides
        </span>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {types.map(({ key, name }) => (
          <div
            key={key}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded ${CHIP.text}`}
            style={{
              background: CHIP.bg,
              border: `1px solid ${CHIP.border}`,
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full shrink-0 flex-shrink-0"
                  style={{ background: CHIP.dot }} />
            <span className="text-xs font-medium truncate">{name}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
