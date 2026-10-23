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
    <section className="mb-6">
      <div className="card-flat px-6 py-8">
        {/* Title */}
        <h1 className="text-xl font-semibold text-gray-100 mb-2">
          CVE vulnerability lookup
        </h1>
        <p className="text-sm text-[#8b949e] mb-6 max-w-2xl leading-relaxed">
          Enter a CVE identifier to pull CVSS vectors, EPSS probability, CISA KEV
          status and public exploits — scored and rendered entirely in your browser.
        </p>

        {/* Search form */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <SearchIcon
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6e7681] pointer-events-none"
              />
              <input
                type="text"
                className="input-field pl-10 pr-3 h-11"
                value={value}
                onChange={e => { setValue(e.target.value); setError('') }}
                placeholder={placeholderVisible ? `e.g. ${EXAMPLES[placeholderIdx]}` : ''}
                spellCheck={false}
                autoComplete="off"
                aria-label="CVE ID input"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary h-11 shrink-0 px-6"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin-slow" />
                  Searching…
                </>
              ) : (
                <>
                  <SearchIcon size={14} />
                  Search
                </>
              )}
            </button>
          </div>

          {error && (
            <p role="alert" className="mt-2.5 text-red-400 text-sm">
              {error}
            </p>
          )}
        </form>

        {/* Examples */}
        <div className="mt-5 pt-4 border-t border-dark-border flex items-center gap-2 flex-wrap text-xs">
          <span className="text-[#6e7681]">Example:</span>
          {EXAMPLES.map(id => (
            <button
              key={id}
              onClick={() => { setValue(id); setError('') }}
              className="font-mono text-[#58a6ff] hover:text-[#79c0ff] hover:underline transition-colors duration-150"
            >
              {id}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-2.5 px-1 text-[11px] text-[#6e7681]">
        Client-side only · no accounts · no tracking · nothing stored
      </p>
    </section>
  )
}
