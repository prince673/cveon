import { getAllGuideTypes } from '../utils/guideEngine'
import { LayersIcon } from './icons'

const COLOR_MAP = {
  sqli: { text: 'text-amber-400',  border: 'rgba(251,191,36,0.25)',  bg: 'rgba(251,191,36,0.06)',  dot: '#fbbf24' },
  xss:  { text: 'text-pink-400',   border: 'rgba(244,114,182,0.25)', bg: 'rgba(244,114,182,0.06)', dot: '#f472b6' },
  rce:  { text: 'text-red-400',    border: 'rgba(248,113,113,0.25)', bg: 'rgba(248,113,113,0.06)', dot: '#f87171' },
  traversal: { text: 'text-orange-400', border: 'rgba(251,146,60,0.25)', bg: 'rgba(251,146,60,0.06)', dot: '#fb923c' },
  lfi:  { text: 'text-orange-500', border: 'rgba(249,115,22,0.25)',  bg: 'rgba(249,115,22,0.06)',  dot: '#f97316' },
  cmdinj: { text: 'text-red-500',  border: 'rgba(239,68,68,0.25)',   bg: 'rgba(239,68,68,0.06)',   dot: '#ef4444' },
  deser: { text: 'text-purple-400',border: 'rgba(192,132,252,0.25)', bg: 'rgba(192,132,252,0.06)', dot: '#c084fc' },
  ssrf: { text: 'text-cyan-400',   border: 'rgba(34,211,238,0.25)',  bg: 'rgba(34,211,238,0.06)',  dot: '#22d3ee' },
  xxe:  { text: 'text-blue-400',   border: 'rgba(96,165,250,0.25)',  bg: 'rgba(96,165,250,0.06)',  dot: '#60a5fa' },
  idor: { text: 'text-green-400',  border: 'rgba(74,222,128,0.25)',  bg: 'rgba(74,222,128,0.06)',  dot: '#4ade80' },
  redirect: { text: 'text-yellow-400', border: 'rgba(250,204,21,0.25)', bg: 'rgba(250,204,21,0.06)', dot: '#facc15' },
  ssti: { text: 'text-fuchsia-400',border: 'rgba(232,121,249,0.25)', bg: 'rgba(232,121,249,0.06)', dot: '#e879f9' },
  jwt:  { text: 'text-indigo-400', border: 'rgba(129,140,248,0.25)', bg: 'rgba(129,140,248,0.06)', dot: '#818cf8' },
  csrf: { text: 'text-teal-400',   border: 'rgba(45,212,191,0.25)',  bg: 'rgba(45,212,191,0.06)',  dot: '#2dd4bf' },
  fileupload: { text: 'text-rose-400', border: 'rgba(251,113,133,0.25)', bg: 'rgba(251,113,133,0.06)', dot: '#fb7185' },
  generic: { text: 'text-gray-400',border: 'rgba(156,163,175,0.15)', bg: 'rgba(156,163,175,0.04)', dot: '#9ca3af' },
  nosqli: { text: 'text-lime-400', border: 'rgba(163,230,53,0.25)',  bg: 'rgba(163,230,53,0.06)',  dot: '#a3e635' },
  ldapi:  { text: 'text-violet-400',border: 'rgba(167,139,250,0.25)',bg: 'rgba(167,139,250,0.06)', dot: '#a78bfa' },
  xpath:  { text: 'text-blue-300', border: 'rgba(147,197,253,0.25)', bg: 'rgba(147,197,253,0.06)', dot: '#93c5fd' },
  bufferoverflow: { text: 'text-red-500', border: 'rgba(239,68,68,0.25)', bg: 'rgba(239,68,68,0.06)', dot: '#ef4444' },
  weakauth: { text: 'text-orange-300', border: 'rgba(253,186,116,0.25)', bg: 'rgba(253,186,116,0.06)', dot: '#fdba74' },
  infodisc: { text: 'text-sky-400', border: 'rgba(56,189,248,0.25)', bg: 'rgba(56,189,248,0.06)',  dot: '#38bdf8' },
  race:  { text: 'text-pink-400',   border: 'rgba(244,114,182,0.25)',bg: 'rgba(244,114,182,0.06)', dot: '#f472b6' },
  crypto: { text: 'text-teal-300',  border: 'rgba(94,234,212,0.25)', bg: 'rgba(94,234,212,0.06)',  dot: '#5eead4' },
  smuggling: { text: 'text-amber-400', border: 'rgba(251,191,36,0.25)', bg: 'rgba(251,191,36,0.06)', dot: '#fbbf24' },
  prototype: { text: 'text-cyan-300', border: 'rgba(103,232,249,0.25)', bg: 'rgba(103,232,249,0.06)', dot: '#67e8f9' },
  clickjacking: { text: 'text-rose-300', border: 'rgba(253,164,175,0.25)', bg: 'rgba(253,164,175,0.06)', dot: '#fda4af' },
  oauth: { text: 'text-blue-400',   border: 'rgba(96,165,250,0.25)', bg: 'rgba(96,165,250,0.06)',  dot: '#60a5fa' },
}
const FALLBACK = { text: 'text-gray-400', border: 'rgba(156,163,175,0.15)', bg: 'rgba(156,163,175,0.04)', dot: '#9ca3af' }

export default function GuideTypesPanel() {
  const types = getAllGuideTypes()

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
        {types.map(({ key, name }) => {
          const c = COLOR_MAP[key] || FALLBACK
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