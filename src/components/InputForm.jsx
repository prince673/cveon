import { useState, useEffect, useRef } from 'react'
import { SearchIcon } from './icons'

const CVE_REGEX = /^CVE-\d{4}-\d{4,}$/i

const EXAMPLES = [
  'CVE-2021-44228', // Log4Shell
  'CVE-2017-0144',  // EternalBlue
  'CVE-2019-0708',  // BlueKeep
  'CVE-2021-41773', // Apache path traversal
  'CVE-2022-22965', // Spring4Shell
]


export default function InputForm({ onSubmit, loading }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState('')
  const [placeholderIdx, setPlaceholderIdx] = useState(0)
  const [placeholderVisible, setPlaceholderVisible] = useState(true)
  const cycleRef = useRef(null)

  // Cycle through example placeholders
  useEffect(() => {
    let fadeTimeout
    cycleRef.current = setInterval(() => {
      setPlaceholderVisible(false)
      fadeTimeout = setTimeout(() => {
        setPlaceholderIdx(i => (i + 1) % EXAMPLES.length)
        setPlaceholderVisible(true)
      }, 300)
    }, 2800)
    return () => { clearInterval(cycleRef.current); clearTimeout(fadeTimeout) }
  }, [])

  function handleSubmit(e) {
    e?.preventDefault()
    const trimmed = value.trim().toUpperCase()
    if (!CVE_REGEX.test(trimmed)) {
      setError('Enter a valid CVE ID — e.g. CVE-2021-44228')
      return
    }
    setError('')
    onSubmit(trimmed)
  }

  return (
    <section className="relative overflow-hidden rounded-2xl mb-6 animate-fade-up">
      {/* Layered ambient glow */}
      <div className="absolute -top-32 -right-20 w-96 h-96 rounded-full
                      bg-accent-indigo/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-16 w-72 h-72 rounded-full
                      bg-accent-purple/10 blur-3xl pointer-events-none" />

      {/* Glass card */}
      <div className="relative card-flat px-8 pt-10 pb-8">
        {/* Inner top highlight */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r
                        from-transparent via-white/12 to-transparent" />

        {/* Top badges */}
        <div className="flex flex-wrap items-center gap-2 mb-5">
          <span className="tag bg-accent-indigo/10 text-accent-indigo border-accent-indigo/25
                           shadow-[0_0_14px_-4px_rgba(129,140,248,0.5)]">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-indigo animate-pulse" />
            Vulnerability Intelligence
          </span>
          <span className="tag bg-accent-purple/10 text-accent-purple border-accent-purple/25">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-purple" />
            No tracking · Nothing stored
          </span>
          <span className="hidden sm:inline-flex tag bg-accent-cyan/10 text-accent-cyan border-accent-cyan/25">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan" />
            100% client-side
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white leading-[1.1] mb-3">
          Decode any CVE{' '}
          <span className="gradient-text">in seconds</span>
          <span className="text-gray-600">.</span>
        </h1>
        <p className="text-[15px] text-gray-400 leading-relaxed max-w-xl mb-8">
          CVSS, EPSS, CISA KEV and public exploit intel — scored, explained and rendered
          entirely in your browser. No accounts, no logs, no digital footprint.
        </p>

        {/* Search form */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <SearchIcon
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none"
              />
              <input
                type="text"
                className="input-field pl-11 pr-4 h-12 text-[15px]"
                value={value}
                onChange={e => { setValue(e.target.value); setError('') }}
                placeholder={placeholderVisible ? `e.g. ${EXAMPLES[placeholderIdx]}` : ''}
                style={{ transition: 'box-shadow 0.2s, border-color 0.2s, opacity 0.25s' }}
                spellCheck={false}
                autoComplete="off"
                aria-label="CVE ID input"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary h-12 shrink-0 px-7"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin-slow" />
                  Searching…
                </>
              ) : (
                <>
                  <SearchIcon size={15} />
                  Search CVE
                </>
              )}
            </button>
          </div>

          {error && (
            <p role="alert" className="mt-3 flex items-center gap-2 text-red-400 text-sm animate-fade-in">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
              {error}
            </p>
          )}
        </form>

        {/* Quick-try chips */}
        <div className="mt-7 pt-5 border-t border-white/[0.05] flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-600 mr-1">Try:</span>
          {EXAMPLES.map(id => (
            <button
              key={id}
              onClick={() => { setValue(id); setError('') }}
              className="text-xs font-mono transition-all duration-200
                         text-gray-500 hover:text-accent-indigo
                         px-3 py-1.5 rounded-lg
                         border border-white/[0.07] hover:border-accent-indigo/35
                         bg-white/[0.02] hover:bg-accent-indigo/[0.08]
                         hover:shadow-[0_0_14px_-4px_rgba(129,140,248,0.45)]"
            >
              {id}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}