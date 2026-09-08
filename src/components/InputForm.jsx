import { useState } from 'react'
import { SearchIcon } from './icons'

const CVE_REGEX = /^CVE-\d{4}-\d{4,}$/i

export default function InputForm({ onSubmit, loading }) {
  const [value, setValue] = useState('CVE-2021-44228')
  const [error, setError] = useState('')

  function handleSubmit(e) {
    e?.preventDefault()
    const trimmed = value.trim().toUpperCase()
    if (!CVE_REGEX.test(trimmed)) {
      setError('Enter a valid CVE ID, e.g. CVE-2021-44228')
      return
    }
    setError('')
    onSubmit(trimmed)
  }

  return (
    <section className="card pt-10 pb-8 mb-6">
      <p className="section-label">Vulnerability intelligence</p>
      <h1 className="mt-2 text-2xl md:text-[28px] font-semibold tracking-tight text-white leading-snug">
        Look up any CVE in seconds.
      </h1>
      <p className="mt-1.5 text-sm text-gray-400 leading-relaxed">
        Fetch technical details, risk scoring, and an authorized-use exploitation guide for a single CVE ID.
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <SearchIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" />
            <input
              type="text"
              className="input-field pl-10"
              value={value}
              onChange={e => { setValue(e.target.value); setError('') }}
              placeholder="e.g. CVE-2021-44228"
              spellCheck={false}
              autoComplete="off"
              aria-label="CVE ID input"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary shrink-0">
            {loading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin-slow" />
                Searching…
              </>
            ) : (
              'Search CVE'
            )}
          </button>
        </div>

        {error && (
          <p role="alert" className="mt-2.5 text-red-400 text-sm">{error}</p>
        )}
      </form>

      <div className="mt-6 pt-5 border-t border-dark-border flex items-center gap-2 flex-wrap">
        <span className="text-xs text-gray-500">Try:</span>
        {['CVE-2021-44228', 'CVE-2017-0144', 'CVE-2019-0708', 'CVE-2021-41773'].map(id => (
          <button
            key={id}
            onClick={() => { setValue(id); setError('') }}
            className="text-xs font-mono text-accent-cyan hover:text-gray-200 hover:underline
                       transition-colors"
          >
            {id}
          </button>
        ))}
      </div>
    </section>
  )
}