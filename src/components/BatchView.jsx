import { useState, useRef } from 'react'
import { batchLookup } from '../services/api'
import { getSeverity } from '../utils/formatters'
import { ListIcon, UploadIcon, SearchIcon, ArrowLeftIcon } from './icons'

const CVE_REGEX = /^CVE-\d{4}-\d{4,}$/i

const PRIORITY_STYLES = {
  P1: { text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
  P2: { text: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
  P3: { text: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
  P4: { text: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30' },
}

const SORT_KEYS = {
  cve_id: { label: 'CVE ID', get: r => r.cve_id },
  cvss: { label: 'CVSS', get: r => r.best_cvss?.score || 0 },
  epss: { label: 'EPSS', get: r => r.epss?.score || 0 },
  risk: { label: 'Risk', get: r => r.risk?.score || 0 },
}

function PriorityBadge({ priority }) {
  const s = PRIORITY_STYLES[priority] || PRIORITY_STYLES.P4
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border ${s.text} ${s.bg} ${s.border}`}>
      {priority}
    </span>
  )
}

function Row({ r, onSelect }) {
  const sev = getSeverity(r.best_cvss?.score)
  return (
    <button
      onClick={() => onSelect?.(r.cve_id)}
      className="w-full grid grid-cols-[1fr_70px_70px_60px_90px] md:grid-cols-[1.4fr_70px_80px_70px_90px_120px] items-center
                 gap-2 px-3 py-2.5 text-left rounded-lg hover:bg-white/[0.03]
                 transition-colors border border-transparent hover:border-dark-border"
    >
      <div className="min-w-0">
        <div className="font-mono text-sm text-gray-100">{r.cve_id}</div>
        {r.description && (
          <div className="text-[11px] text-gray-500 truncate mt-0.5">{r.description}</div>
        )}
      </div>
      <span className={`text-sm font-semibold ${sev.text}`}>{r.best_cvss?.score ?? '—'}</span>
      <span className="text-xs text-purple-400">
        {r.epss?.score != null ? `${(r.epss.score * 100).toFixed(1)}%` : '—'}
      </span>
      <span className="text-[10px] text-red-400 font-medium">
        {r.kev ? 'KEV' : ''}
      </span>
      <PriorityBadge priority={r.risk?.priority} />
      <span className="hidden md:flex items-center gap-1.5 text-accent-cyan text-xs justify-end">
        View <ArrowLeftIcon size={12} className="rotate-180" />
      </span>
    </button>
  )
}

export default function BatchView({ onSelect }) {
  const [input, setInput] = useState('')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [prioFilter, setPrioFilter] = useState('ALL')
  const [sortKey, setSortKey] = useState('risk')
  const [sortDesc, setSortDesc] = useState(true)
  const fileRef = useRef(null)

  function parseIds(text) {
    return [...new Set(
      (text || '').match(/CVE-\d{4}-\d{4,}/gi) || []
    )].map(s => s.toUpperCase())
  }

  function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const ids = parseIds(reader.result)
      setInput(ids.join('\n'))
      if (ids.length) setError('')
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  async function handleSubmit(e) {
    e?.preventDefault()
    const ids = parseIds(input)
    if (!ids.length) {
      setError('Enter at least one valid CVE ID (one per line or comma-separated).')
      return
    }
    if (ids.length > 20) {
      setError(`Maximum 20 CVEs per batch. You entered ${ids.length}.`)
      return
    }
    setError('')
    setLoading(true)
    setResults(null)
    try {
      const data = await batchLookup(ids)
      setResults(data)
    } catch (err) {
      setError(err.message || 'Batch lookup failed.')
    } finally {
      setLoading(false)
    }
  }

  function toggleSort(key) {
    if (key === sortKey) {
      setSortDesc(d => !d)
    } else {
      setSortKey(key)
      setSortDesc(true)
    }
  }

  const all = (results?.results || [])
  const filtered = prioFilter === 'ALL'
    ? all
    : all.filter(r => r.risk?.priority === prioFilter)
  const sorted = [...filtered].sort((a, b) => {
    const ka = SORT_KEYS[sortKey]?.get(a) ?? 0
    const kb = SORT_KEYS[sortKey]?.get(b) ?? 0
    if (typeof ka === 'string') return sortDesc ? kb.localeCompare(ka) : ka.localeCompare(kb)
    return sortDesc ? kb - ka : ka - kb
  })

  return (
    <div className="space-y-5">
      <header className="flex items-center gap-2.5">
        <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-white/[0.06] border border-dark-border text-gray-400">
          <ListIcon size={15} />
        </span>
        <h2 className="text-base font-semibold text-white">Batch CVE analysis</h2>
      </header>

      <section className="card">
        <p className="section-label">Analyze multiple CVEs at once</p>
        <p className="mt-1 text-sm text-gray-400 leading-relaxed">
          Paste up to 20 CVE IDs (one per line or comma-separated) or upload a .txt file to get a
          consolidated risk dashboard.
        </p>

        <form onSubmit={handleSubmit} noValidate className="mt-4">
          <textarea
            className="input-field w-full font-mono text-xs leading-relaxed min-h-[120px]"
            value={input}
            onChange={e => { setInput(e.target.value); setError('') }}
            placeholder={'CVE-2021-44228\nCVE-2023-44487\nCVE-2021-41773\nCVE-2017-0144'}
            spellCheck={false}
            aria-label="CVE IDs"
          />
          <div className="flex flex-col sm:flex-row gap-3 mt-3">
            <button type="submit" disabled={loading} className="btn-primary shrink-0">
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin-slow" />
                  Analyzing…
                </>
              ) : (
                <>
                  <SearchIcon size={15} /> Analyze batch
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="btn-ghost shrink-0"
            >
              <UploadIcon size={15} /> Upload .txt
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".txt,.csv,.log"
              className="hidden"
              onChange={handleFile}
            />
          </div>
        </form>

        {error && <p role="alert" className="mt-2.5 text-red-400 text-sm">{error}</p>}
      </section>

      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 rounded-full border-2 border-dark-border" />
            <div className="absolute inset-0 rounded-full border-2 border-t-accent-cyan animate-spin-slow" />
          </div>
          <p className="text-sm animate-pulse">Fetching vulnerability intelligence…</p>
        </div>
      )}

      {results && !loading && (
        <section className="card">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <h3 className="text-sm font-semibold text-white">Results</h3>
            <span className="text-xs text-gray-500">
              {results.results.length} found · {results.errors.length} failed
            </span>
            <div className="ml-auto flex items-center gap-1.5">
              {['ALL', 'P1', 'P2', 'P3', 'P4'].map(p => (
                <button
                  key={p}
                  onClick={() => setPrioFilter(p)}
                  className={`px-2.5 py-1 rounded-lg text-xs border transition-colors ${
                    prioFilter === p
                      ? 'bg-accent-cyan/15 border-accent-cyan/40 text-accent-cyan'
                      : 'border-dark-border text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {p === 'ALL' ? 'All' : p}
                </button>
              ))}
            </div>
          </div>

          {results.errors.length > 0 && (
            <div className="mb-4 p-3 rounded-lg border border-yellow-500/30 bg-yellow-500/[0.06]">
              <p className="text-xs text-yellow-300 mb-1">Some CVEs could not be resolved:</p>
              <div className="flex flex-wrap gap-1.5">
                {results.errors.map(e => (
                  <span key={e.cve_id} className="text-[11px] font-mono text-gray-400 bg-dark-bg border border-dark-border rounded px-1.5 py-0.5">
                    {e.cve_id} — {e.error}
                  </span>
                ))}
              </div>
            </div>
          )}

          {sorted.length > 0 ? (
            <div className="grid grid-cols-[1fr_70px_70px_60px_90px] md:grid-cols-[1.4fr_70px_80px_70px_90px_120px] gap-2 px-3 pb-2
                           border-b border-dark-border text-[11px] uppercase tracking-wide text-gray-500">
              <button onClick={() => toggleSort('cve_id')} className="text-left hover:text-gray-300 flex items-center gap-1">
                CVE ID
              </button>
              <button onClick={() => toggleSort('cvss')} className="text-left hover:text-gray-300 flex items-center gap-1">CVSS</button>
              <button onClick={() => toggleSort('epss')} className="text-left hover:text-gray-300 flex items-center gap-1">EPSS</button>
              <span className="hidden md:block">KEV</span>
              <button onClick={() => toggleSort('risk')} className="text-left hover:text-gray-300 flex items-center gap-1">Priority</button>
              <span className="hidden md:block text-right">Action</span>
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-6">
              No CVEs match the selected priority filter.
            </p>
          )}

          <div className="flex flex-col gap-0.5 mt-1">
            {sorted.map(r => (
              <Row key={r.cve_id} r={r} onSelect={onSelect} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}