import { useState, useEffect, useRef } from 'react'
import { SearchIcon, CheckIcon } from './icons'
import { normalizeCveInput, isValidCveId } from '../utils/cveFormat'
import { getRecents, subscribeMemory, clearRecents } from '../utils/sessionMemory'

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
  const [showRecents, setShowRecents] = useState(false)
  const [recents, setRecents] = useState(() => getRecents())
  const wrapRef = useRef(null)

  // Cycle through example placeholders
  useEffect(() => {
    let fadeTimeout
    const cycle = setInterval(() => {
      setPlaceholderVisible(false)
      fadeTimeout = setTimeout(() => {
        setPlaceholderIdx(i => (i + 1) % EXAMPLES.length)
        setPlaceholderVisible(true)
      }, 300)
    }, 2800)
    return () => { clearInterval(cycle); clearTimeout(fadeTimeout) }
  }, [])

  // In-memory recent searches (RAM only — gone when the tab closes)
  useEffect(() => subscribeMemory(snapshot => setRecents(snapshot.recents)), [])

  // Close the recents dropdown on outside click
  useEffect(() => {
    if (!showRecents) return
    function onDocClick(e) {
      if (!wrapRef.current?.contains(e.target)) setShowRecents(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [showRecents])

  const normalized = normalizeCveInput(value)
  const valid = isValidCveId(normalized)
  const showInvalid = normalized.length > 0 && !valid && normalized.startsWith('CVE-')

  function handleSubmit(e) {
    e?.preventDefault()
    setShowRecents(false)
    if (!isValidCveId(normalized)) {
      setError('Enter a valid CVE ID — e.g. CVE-2021-44228')
      return
    }
    setError('')
    setValue(normalized)
    onSubmit(normalized)
  }

  function submitId(id) {
    setShowRecents(false)
    setError('')
    setValue(id)
    onSubmit(id)
  }

  return (
    <section className="mb-6">
      <div className="card-flat px-6 py-8">
        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3 animate-fade-up">
          <span className="text-gradient">CVE vulnerability lookup</span>
        </h1>
        <p className="text-sm text-[#8b949e] mb-6 max-w-2xl leading-relaxed animate-fade-up" style={{ animationDelay: '80ms' }}>
          Enter a CVE identifier to pull CVSS vectors, EPSS probability, CISA KEV
          status and public exploits — scored and rendered entirely in your browser.
        </p>

        {/* Search form */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1" ref={wrapRef}>
              <SearchIcon
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8b949e] pointer-events-none z-10"
              />
              <input
                id="cve-input"
                type="text"
                className="input-field pl-10 pr-10 h-11"
                value={value}
                onChange={e => { setValue(e.target.value); setError('') }}
                onFocus={() => { if (recents.length) setShowRecents(true) }}
                placeholder={placeholderVisible ? `e.g. ${EXAMPLES[placeholderIdx]}` : ''}
                spellCheck={false}
                autoComplete="off"
                aria-label="CVE ID input"
                aria-invalid={showInvalid || undefined}
              />
              {/* Live validation indicator */}
              <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true">
                {valid && <CheckIcon size={14} className="text-green-400" />}
              </span>

              {/* Recent searches dropdown (in-memory only) */}
              {showRecents && recents.length > 0 && (
                <div
                  className="absolute z-20 left-0 right-0 top-full mt-1.5 card-flat !p-1.5 animate-scale-in"
                  role="listbox"
                  aria-label="Recent searches"
                >
                  <div className="flex items-center justify-between px-2 py-1">
                    <span className="section-label">Recent (this tab only)</span>
                    <button
                      type="button"
                      onClick={() => { clearRecents(); setShowRecents(false) }}
                      className="text-[10px] text-gray-500 hover:text-gray-300 transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                  {recents.map(id => (
                    <button
                      key={id}
                      type="button"
                      role="option"
                      aria-selected="false"
                      onMouseDown={e => { e.preventDefault(); submitId(id) }}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left
                                 font-mono text-xs text-gray-200 hover:bg-dark-card2 transition-colors"
                    >
                      <SearchIcon size={11} className="text-gray-500 shrink-0" />
                      {id}
                    </button>
                  ))}
                </div>
              )}
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
          {!error && showInvalid && (
            <p className="mt-2.5 text-[#d29922] text-xs" aria-live="polite">
              Keep typing — the format is CVE-YYYY-NNNNN (e.g. 2021-44228 also works).
            </p>
          )}
        </form>

        {/* Examples */}
        <div className="mt-5 pt-4 border-t border-dark-border flex items-center gap-2 flex-wrap text-xs">
          <span className="text-[#8b949e]">Example:</span>
          {EXAMPLES.map(id => (
            <button
              key={id}
              onClick={() => submitId(id)}
              className="font-mono text-[#58a6ff] hover:text-[#79c0ff] hover:underline transition-colors duration-150
                         py-1.5 -my-1.5 px-1 -mx-1"
            >
              {id}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-2.5 px-1 text-[11px] text-[#8b949e]">
        Client-side only · no accounts · no tracking · nothing stored
      </p>
    </section>
  )
}
