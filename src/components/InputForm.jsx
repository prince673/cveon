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

const SOURCE_PILLS = ['NVD', 'CIRCL', 'EPSS', 'CISA KEV', 'MITRE']

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
                      bg-accent-cyan/8 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-16 w-72 h-72 rounded-full
                      bg-accent-purple/8 blur-3xl pointer-events-none" />

      {/* Glass card */}
      <div className="relative card-flat px-8 pt-10 pb-8">
        {/* Inner top highlight */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r
                        from-transparent via-white/12 to-transparent" />

        {/* Top badges */}
        <div className="flex flex-wrap items-center gap-2 mb-5">
          <span className="tag bg-accent-cyan/10 text-accent-cyan border-accent-cyan/20
                           shadow-[0_0_12px_-4px_rgba(91,141,239,0.4)]">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan animate-pulse" />
            Vulnerability Intelligence
          </span>
          <div className="hidden sm:flex items-center gap-1.5 flex-wrap">
            {SOURCE_PILLS.map(s => (
              <span key={s} className="source-pill">{s}</span>
            ))}
          </div>
        </div>

        {/* Headline */}
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white leading-tight mb-2">
          Look up any CVE{' '}
          <span className="gradient-text">in seconds</span>
          <span className="text-gray-600">.</span>
        </h1>
        <p className="text-[15px] text-gray-500 leading-relaxed max-w-xl mb-8">
          Technical details, explainable risk scoring & authorized-use exploitation guides
          — powered by NVD, CIRCL, EPSS and CISA KEV.
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
                         text-gray-500 hover:text-accent-cyan
                         px-3 py-1.5 rounded-lg
                         border border-white/[0.06] hover:border-accent-cyan/30
                         bg-white/[0.02] hover:bg-accent-cyan/[0.06]
                         hover:shadow-[0_0_12px_-4px_rgba(91,141,239,0.4)]"
            >
              {id}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}