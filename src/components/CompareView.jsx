import { useState } from 'react'
import { compareCVEs } from '../services/api'
import { getSeverity, formatDate } from '../utils/formatters'
import { CompareIcon, ArrowLeftIcon, PlusIcon } from './icons'

const CVE_REGEX = /^CVE-\d{4}-\d{4,}$/i

const PRIORITY_STYLES = {
  P1: { text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
  P2: { text: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
  P3: { text: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
  P4: { text: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30' },
}

function Meter({ value, max = 10, color }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-dark-bg overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs text-gray-400 w-10 text-right shrink-0">{value}</span>
    </div>
  )
}

export default function CompareView({ onReset }) {
  const [inputs, setInputs] = useState(['CVE-2021-44228', 'CVE-2023-44487', ''])
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleInput(idx, value) {
    setInputs(prev => {
      const next = [...prev]
      next[idx] = value
      return next
    })
    setError('')
  }

  function addSlot() {
    if (inputs.length < 3) setInputs([...inputs, ''])
  }

  function removeSlot(idx) {
    if (inputs.length > 2) setInputs(inputs.filter((_, i) => i !== idx))
  }

  async function handleSubmit(e) {
    e?.preventDefault()
    const ids = inputs.map(s => s.trim().toUpperCase()).filter(Boolean)
    if (ids.length < 2) {
      setError('Enter at least two CVE IDs to compare.')
      return
    }
    const invalid = ids.filter(id => !CVE_REGEX.test(id))
    if (invalid.length) {
      setError(`Invalid CVE ID format: ${invalid.join(', ')}`)
      return
    }
    setError('')
    setLoading(true)
    setResults(null)
    try {
      const data = await compareCVEs(ids)
      setResults(data)
    } catch (err) {
      setError(err.message || 'Comparison failed.')
    } finally {
      setLoading(false)
    }
  }

  const rows = results?.results || []
  const maxRisk = Math.max(...rows.map(r => r.risk?.score || 0), 1)
  const maxEpss = Math.max(...rows.map(r => r.epss?.score || 0), 0.01)

  const cwesAcross = [...new Set(rows.flatMap(r => r.cwes || []))]
  const allProducts = rows.flatMap(r => (r.products || []).map(p => p.toLowerCase()))
  const sharedProducts = [...new Set(allProducts.filter(p => allProducts.indexOf(p) !== allProducts.lastIndexOf(p)))]

  return (
    <div className="space-y-5">
      <header className="flex items-center gap-2.5">
        <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-white/[0.06] border border-dark-border text-gray-400">
          <CompareIcon size={15} />
        </span>
        <h2 className="text-base font-semibold text-white">CVE comparison</h2>
      </header>

      <section className="card">
        <p className="section-label">Compare up to 3 CVEs side-by-side</p>
        <p className="mt-1 text-sm text-gray-400 leading-relaxed">Spot the highest-risk vulnerability in your backlog.</p>

        <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-2.5">
          {inputs.map((val, idx) => (
            <div key={idx} className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-md bg-white/[0.05] border border-dark-border
                               text-[10px] text-gray-500 flex items-center justify-center shrink-0">
                {idx + 1}
              </span>
              <input
                type="text"
                className="input-field font-mono text-sm flex-1"
                value={val}
                onChange={e => handleInput(idx, e.target.value)}
                placeholder={`CVE-2021-44228`}
                spellCheck={false}
                aria-label={`CVE ${idx + 1}`}
              />
              {inputs.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeSlot(idx)}
                  className="text-gray-600 hover:text-red-400 text-lg leading-none shrink-0"
                  aria-label="Remove CVE"
                >
                  ×
                </button>
              )}
            </div>
          ))}

          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <button type="submit" disabled={loading} className="btn-primary shrink-0">
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin-slow" />
                  Comparing…
                </>
              ) : (
                <>
                  <CompareIcon size={15} /> Compare
                </>
              )}
            </button>
            {inputs.length < 3 && (
              <button type="button" onClick={addSlot} className="btn-ghost shrink-0">
                <PlusIcon size={15} /> Add CVE
              </button>
            )}
          </div>
        </form>

        {error && <p role="alert" className="mt-2.5 text-red-400 text-sm">{error}</p>}
      </section>

      {results?.errors?.length > 0 && (
        <div className="p-3 rounded-lg border border-yellow-500/30 bg-yellow-500/[0.06]">
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

      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 rounded-full border-2 border-dark-border" />
            <div className="absolute inset-0 rounded-full border-2 border-t-accent-cyan animate-spin-slow" />
          </div>
          <p className="text-sm animate-pulse">Fetching vulnerability intelligence…</p>
        </div>
      )}

      {rows.length > 0 && !loading && (
        <section className="card">
          <div className="overflow-x-auto -mx-2 px-2">
            <div className="min-w-[560px]">
              <div className="grid grid-cols-[150px_repeat(3,minmax(120px,1fr))] gap-3 pb-3 border-b border-dark-border">
                <span className="section-label">Signal</span>
                {rows.map(r => (
                  <div key={r.cve_id} className="flex flex-col gap-1">
                    <span className="font-mono text-sm text-gray-100">{r.cve_id}</span>
                    <div className="flex items-center gap-2">
                      <PriorityPill p={r.risk?.priority} />
                      <span className="text-[10px] text-gray-500">{r.risk?.level} risk</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4 py-4">
                <div className="grid grid-cols-[150px_repeat(3,minmax(120px,1fr))] gap-3 items-center">
                  <span className="text-xs text-gray-500">Risk score</span>
                  {rows.map(r => {
                    const c = { P1: '#e5484d', P2: '#f76808', P3: '#e7a008', P4: '#30a46c' }[r.risk?.priority] || '#8b5cf6'
                    return <Meter key={r.cve_id} value={r.risk?.score || 0} max={maxRisk} color={c} />
                  })}
                </div>

                <div className="grid grid-cols-[150px_repeat(3,minmax(120px,1fr))] gap-3 items-center">
                  <span className="text-xs text-gray-500">CVSS base</span>
                  {rows.map(r => {
                    const sev = getSeverity(r.best_cvss?.score)
                    return <Meter key={r.cve_id} value={r.best_cvss?.score || 0} max={10} color={sev.bar} />
                  })}
                </div>

                <div className="grid grid-cols-[150px_repeat(3,minmax(120px,1fr))] gap-3 items-center">
                  <span className="text-xs text-gray-500">EPSS</span>
                  {rows.map(r => (
                    <Meter key={r.cve_id} value={r.epss?.score ? Math.round(r.epss.score * 100) : 0}
                           max={Math.round(maxEpss * 100)} color="#8b5cf6" />
                  ))}
                </div>

                <div className="grid grid-cols-[150px_repeat(3,minmax(120px,1fr))] gap-3 items-center">
                  <span className="text-xs text-gray-500">CISA KEV</span>
                  {rows.map(r => (
                    <span key={r.cve_id} className={`text-xs ${r.kev ? 'text-red-400 font-medium' : 'text-gray-600'}`}>
                      {r.kev
                        ? `Exploited${r.kev.known_ransomware_campaign_use ? ' · ransomware' : ''}`
                        : 'Not listed'}
                    </span>
                  ))}
                </div>

                <div className="grid grid-cols-[150px_repeat(3,minmax(120px,1fr))] gap-3 items-center">
                  <span className="text-xs text-gray-500">Exploits</span>
                  {rows.map(r => (
                    <span key={r.cve_id} className="text-xs text-gray-300">{r.exploit_count || 0} sources</span>
                  ))}
                </div>

                <div className="grid grid-cols-[150px_repeat(3,minmax(120px,1fr))] gap-3 items-center">
                  <span className="text-xs text-gray-500">Published</span>
                  {rows.map(r => (
                    <span key={r.cve_id} className="text-xs text-gray-400">{formatDate(r.published_date)}</span>
                  ))}
                </div>

                <div className="grid grid-cols-[150px_repeat(3,minmax(120px,1fr))] gap-3 items-start">
                  <span className="text-xs text-gray-500">CWE classes</span>
                  {rows.map(r => (
                    <div key={r.cve_id} className="flex flex-wrap gap-1">
                      {(r.cwes || []).slice(0, 4).map(c => (
                        <a
                          key={c}
                          href={`https://cwe.mitre.org/data/definitions/${c.replace('CWE-', '')}.html`}
                          target="_blank" rel="noopener noreferrer"
                          className={`font-mono text-[10px] px-1.5 py-0.5 rounded border ${
                            cwesAcross.filter(x => (rows.map(rr => rr.cwes || []).flat().filter(y => y === x).length) >= 2).includes(c)
                              ? 'text-accent-cyan border-accent-cyan/30 bg-accent-cyan/[0.08]'
                              : 'text-gray-500 border-dark-border'
                          }`}
                        >
                          {c}
                        </a>
                      ))}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-[150px_repeat(3,minmax(120px,1fr))] gap-3 items-start">
                  <span className="text-xs text-gray-500">Affected products</span>
                  {rows.map(r => (
                    <div key={r.cve_id} className="flex flex-wrap gap-1">
                      {(r.products || []).slice(0, 5).map(p => {
                        const shared = sharedProducts.includes(p.toLowerCase())
                        return (
                          <span key={p} className={`text-[10px] px-1.5 py-0.5 rounded border font-mono ${
                            shared ? 'text-yellow-400 border-yellow-500/30 bg-yellow-500/[0.06]' : 'text-gray-500 border-dark-border'
                          }`}>
                            {p}
                          </span>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={onReset} className="btn-ghost mt-2">
                <ArrowLeftIcon size={15} /> New comparison
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

function PriorityPill({ p }) {
  const s = PRIORITY_STYLES[p] || PRIORITY_STYLES.P4
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border ${s.text} ${s.bg} ${s.border}`}>
      {p}
    </span>
  )
}