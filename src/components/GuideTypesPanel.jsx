import { getAllGuideTypes } from '../utils/guideEngine'
import { LayersIcon } from './icons'

const COLORS = {
  sqli: 'text-amber-400', xss: 'text-pink-400', rce: 'text-red-400',
  traversal: 'text-orange-400', lfi: 'text-orange-500', cmdinj: 'text-red-500',
  deser: 'text-purple-400', ssrf: 'text-cyan-400', xxe: 'text-blue-400',
  idor: 'text-green-400', redirect: 'text-yellow-400', ssti: 'text-fuchsia-400',
  jwt: 'text-indigo-400', csrf: 'text-teal-400', fileupload: 'text-rose-400',
  generic: 'text-gray-400',
  nosqli: 'text-lime-400', ldapi: 'text-violet-400', xpath: 'text-blue-300',
  bufferoverflow: 'text-red-500', weakauth: 'text-orange-300', infodisc: 'text-sky-400',
  race: 'text-pink-400', crypto: 'text-teal-300', smuggling: 'text-amber-400',
  subdomain: 'text-green-300', hostheader: 'text-indigo-300', crlf: 'text-yellow-300',
  cachepoison: 'text-purple-300', prototype: 'text-cyan-300', clickjacking: 'text-rose-300',
  sessionfix: 'text-amber-300', httpverb: 'text-lime-300', zipslip: 'text-orange-400',
  redos: 'text-red-300', oauth: 'text-blue-400',
}

export default function GuideTypesPanel() {
  const types = getAllGuideTypes()

  return (
    <section className="card">
      <header className="flex items-center gap-2.5 mb-4">
        <span className="flex items-center justify-center w-7 h-7 rounded-lg
                         bg-white/[0.06] border border-dark-border text-gray-400">
          <LayersIcon size={15} />
        </span>
        <h2 className="text-sm font-semibold text-white">Guide coverage</h2>
        <span className="ml-auto tag bg-accent-cyan/10 text-accent-cyan border-accent-cyan/25">
          {types.length} guides
        </span>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {types.map(({ key, name }) => (
          <div
            key={key}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg
                       bg-dark-bg border border-dark-border/60
                       hover:border-white/15 transition-colors"
          >
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${(COLORS[key] || 'text-gray-400').replace('text-', 'bg-')}`} />
            <span className={`text-xs font-medium truncate ${COLORS[key] || 'text-gray-400'}`}>
              {name}
            </span>
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs text-gray-600">
        Type is auto-detected from CWE IDs and CVE description keywords.
      </p>
    </section>
  )
}