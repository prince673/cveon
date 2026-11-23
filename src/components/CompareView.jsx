import { useEffect, useState } from 'react'
import { compareCVEs } from '../services/api'
import { getSeverity, formatDate } from '../utils/formatters'
import { CompareIcon, ArrowLeftIcon, PlusIcon } from './icons'

const CVE_REGEX = /^CVE-\d{4}-\d{4,}$/i

const PRIORITY_STYLES = {
  P1: { text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', ring: '#f85149' },
  P2: { text: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', ring: '#db6d28' },
  P3: { text: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', ring: '#d29922' },
  P4: { text: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30', ring: '#3fb950' },
}

function PriorityPill({ p }) {
  const s = PRIORITY_STYLES[p] || PRIORITY_STYLES.P4
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-semibold border ${s.text} ${s.bg} ${s.border}`}>
      {p}
    </span>
  )
}

/**
 * Determine the "danger leader" cells for one comparison row.
 * Higher value = more dangerous. Ties produce no single leader.
 */
function leaders(rows, getVal) {
  const vals = rows.map(getVal)
  const best = Math.max(...vals)
  const sorted = [...vals].sort((a, b) => b - a)
  const second = sorted[1] ?? best
  const idxs = vals.map((v, i) => [v, i]).filter(([v]) => v === best).map(([, i]) => i)
  return { best, second, idxs, tie: idxs.length > 1 && rows.length > 1 }
}

/**
 * Cell wrapper: the danger leader gets a red-tinted highlight and a
 * "▲ +delta vs next" chip (red = the threat, not a prize).
 */
function CompareCell({ win, delta, children }) {
  return (
    <div
      className={`rounded-lg px-2 py-1.5 -mx-1 transition-colors duration-300 ${
        win ? 'bg-red-500/[0.08] border border-red-500/30' : 'border border-transparent'
      }`}
    >
      {children}
      {win && delta != null && (
        <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-red-400 animate-fade-in">
          ▲ {delta !== '' ? `+${delta} vs next` : 'leads'}
        </span>
      )}
    </div>
  )
}

/**
 * Mini 270° risk gauge. Animates from 0 to its score on mount; remount it
 * (via key) to replay the sweep. Reduced-motion users get the final value
 * immediately.
 */
function MiniGauge({ score, color }) {
  const [live, setLive] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setLive(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const animated = live && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  const C = 2 * Math.PI * 30
  const ARC = 0.75
  const dash = (animated ? score / 100 : live ? score / 100 : 0) * ARC * C
  return (
    <div className="relative w-[72px] h-[72px]">
      <svg viewBox="0 0 70 70" className="w-[72px] h-[72px]" style={{ transform: 'rotate(135deg)' }}
           role="img" aria-label={`Risk score ${score} out of 100`}>
        <circle cx="35" cy="35" r="30" fill="none" stroke="#21262d" strokeWidth="5"
                strokeDasharray={`${ARC * C} ${C}`} strokeLinecap="round" />
        <circle
          cx="35" cy="35" r="30" fill="none"
          stroke={color} strokeWidth="5"
          strokeDasharray={`${dash} ${C}`}
          strokeLinecap="round"
          style={{ transition: animated ? 'stroke-dasharray 1.1s cubic-bezier(0.22, 1, 0.36, 1)' : 'none' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold font-mono tabular-nums" style={{ color }}>{score}</span>
        <span className="text-[9px] text-gray-500 -mt-0.5">/100</span>
      </div>
    </div>
  )
}

const GRID = 'grid grid-cols-[120px_repeat(3,minmax(130px,1fr))] gap-3 items-center'

export default function CompareView({ onReset }) {
  const [inputs, setInputs] = useState(['CVE-2021-44228', 'CVE-2023-44487', ''])
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  // Bumped on every successful comparison so the gauges remount and
  // replay their sweep animation.
  const [gen, setGen] = useState(0)

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
      setGen(g => g + 1)
    } catch (err) {
      setError(err?.message || 'Comparison failed.')
    } finally {
      setLoading(false)
    }
  }

  const rows = results?.results || []

  // Overall verdict: unique highest risk score wins the banner.
  const riskLeaders = rows.length >= 2 ? leaders(rows, r => r.risk?.score || 0) : null
  const champion = riskLeaders && !riskLeaders.tie ? rows[riskLeaders.idxs[0]] : null
  const championStyle = champion ? (PRIORITY_STYLES[champion.risk?.priority] || PRIORITY_STYLES.P4) : null

  const cwesAcross = [...new Set(rows.flatMap(r => r.cwes || []))]
  const allProducts = rows.flatMap(r => (r.products || []).map(p => p.toLowerCase()))
  const sharedProducts = [...new Set(allProducts.filter(p => allProducts.indexOf(p) !== allProducts.lastIndexOf(p)))]

  return (
    <div className="space-y-5">
      <header className="flex items-center gap-2.5">
        <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-white/[0.06] border border-dark-border text-gray-400">
          <CompareIcon size={15} />
        </span>
        <h2 className="text-base font-semibold text-gray-100">CVE comparison</h2>
      </header>

      <section className="card">
        <p className="section-label">Compare up to 3 CVEs side-by-side</p>
        <p className="mt-1 text-sm text-gray-400 leading-relaxed">Spot the highest-risk vulnerability in your backlog.</p>

        <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-2.5">
          {inputs.map((val, idx) => (
            <div key={idx} className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-md bg-white/[0.05] border border-dark-border
                               text-[10px] text-gray-400 flex items-center justify-center shrink-0">
                {idx + 1}
              </span>
              <input
                type="text"
                className="input-field font-mono text-sm flex-1"
                value={val}
                onChange={e => handleInput(idx, e.target.value)}
                placeholder="CVE-2021-44228"
                spellCheck={false}
                aria-label={`CVE ${idx + 1}`}
              />
              {inputs.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeSlot(idx)}
                  className="text-gray-400 hover:text-red-400 text-lg leading-none shrink-0
                             w-7 h-7 flex items-center justify-center rounded-md
                             hover:bg-red-500/10 transition-colors"
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
                {e.cve_id} — {e.detail}
              </span>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <section className="card" role="status" aria-label="Comparing CVEs">
          <div className="flex justify-around mb-6">
            {[0, 1, 2].map(i => <div key={i} className="skeleton h-[72px] w-[72px] rounded-full" />)}
          </div>
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3 mb-3">
              <div className="skeleton h-3 w-20" />
              <div className="skeleton h-4 flex-1" />
            </div>
          ))}
        </section>
      )}

      {rows.length > 0 && !loading && (
        <section className="card">
          {/* ── Overall verdict banner ── */}
          {champion && (
            <div
              className="mb-5 rounded-lg px-4 py-3 border-l-[3px] animate-fade-up"
              style={{
                borderColor: championStyle.ring,
                background: 'rgba(248, 81, 73, 0.07)',
              }}
              role="status"
            >
              <span className="text-sm">
                <span className="font-bold text-red-400">▲ {champion.cve_id}</span>
                <span className="text-gray-300"> carries the highest overall risk — </span>
                <span className="font-bold font-mono" style={{ color: championStyle.ring }}>
                  {champion.risk?.score}/100
                </span>
                <span className="text-gray-400"> ({champion.risk?.level}) · {champion.risk?.priority}</span>
              </span>
            </div>
          )}

          <div className="overflow-x-auto -mx-2 px-2">
            <div className="min-w-[560px]">

              {/* ── Column headers + animated risk gauges ── */}
              <div className={`${GRID} pb-4 border-b border-dark-border`}>
                <span className="section-label self-center">Risk</span>
                {rows.map((r, i) => {
                  const s = PRIORITY_STYLES[r.risk?.priority] || PRIORITY_STYLES.P4
                  const win = riskLeaders?.idxs.includes(i)
                  return (
                    <div key={r.cve_id} className="flex flex-col items-center gap-2 animate-fade-up"
                         style={{ animationDelay: `${i * 90}ms` }}>
                      <div className={win ? 'rounded-xl shadow-[0_0_20px_rgba(248,81,73,0.25)]' : ''}>
                        <MiniGauge key={gen} score={r.risk?.score || 0} color={s.ring} />
                      </div>
                      <span className="font-mono text-xs text-gray-100">{r.cve_id}</span>
                      <div className="flex items-center gap-2">
                        <PriorityPill p={r.risk?.priority} />
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="space-y-4 py-4">
                {/* CVSS base */}
                <div className={`${GRID} animate-fade-up`} style={{ animationDelay: '90ms' }}>
                  <span className="text-xs text-gray-500">CVSS base</span>
                  {rows.map((r, i) => {
                    const { best, second, idxs, tie } = leaders(rows, x => x.best_cvss?.score || 0)
                    const sev = getSeverity(r.best_cvss?.score)
                    const delta = best - second
                    return (
                      <CompareCell
                        key={r.cve_id}
                        win={rows.length >= 2 && idxs.includes(i) && !tie}
                        delta={idxs.includes(i) && !tie ? delta.toFixed(1) : null}
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-dark-bg overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-700"
                                 style={{ width: `${(r.best_cvss?.score || 0) * 10}%`, background: sev.bar }} />
                          </div>
                          <span className="text-xs text-gray-300 w-8 text-right font-mono tabular-nums">
                            {r.best_cvss?.score ?? '—'}
                          </span>
                        </div>
                      </CompareCell>
                    )
                  })}
                </div>

                {/* EPSS */}
                <div className={`${GRID} animate-fade-up`} style={{ animationDelay: '150ms' }}>
                  <span className="text-xs text-gray-500">EPSS</span>
                  {rows.map((r, i) => {
                    const { best, second, idxs, tie } = leaders(rows, x => x.epss?.score || 0)
                    const pct = v => (v ? Math.round(v * 100) : 0)
                    const maxPct = Math.max(...rows.map(x => pct(x.epss?.score)), 1)
                    const deltaPts = Math.round((best - second) * 100)
                    return (
                      <CompareCell
                        key={r.cve_id}
                        win={rows.length >= 2 && idxs.includes(i) && !tie}
                        delta={idxs.includes(i) && !tie ? `${deltaPts} pts` : null}
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-dark-bg overflow-hidden">
                            <div className="h-full rounded-full bg-[#58a6ff] transition-all duration-700"
                                 style={{ width: `${(pct(r.epss?.score) / maxPct) * 100}%` }} />
                          </div>
                          <span className="text-xs text-gray-300 w-10 text-right font-mono tabular-nums">
                            {r.epss?.score != null ? `${(r.epss.score * 100).toFixed(1)}%` : '—'}
                          </span>
                        </div>
                      </CompareCell>
                    )
                  })}
                </div>

                {/* CISA KEV */}
                <div className={`${GRID} animate-fade-up`} style={{ animationDelay: '210ms' }}>
                  <span className="text-xs text-gray-500">CISA KEV</span>
                  {rows.map(r => {
                    const anyKev = rows.some(x => x.kev)
                    const win = rows.length >= 2 && anyKev && Boolean(r.kev)
                    return (
                      <CompareCell key={r.cve_id} win={win} delta={win ? '' : null}>
                        <span className={`text-xs ${r.kev ? 'text-red-400 font-medium' : 'text-gray-500'}`}>
                          {r.kev
                            ? `Exploited${r.kev.known_ransomware_campaign_use ? ' · ransomware' : ''}`
                            : 'Not listed'}
                        </span>
                      </CompareCell>
                    )
                  })}
                </div>

                {/* Exploits */}
                <div className={`${GRID} animate-fade-up`} style={{ animationDelay: '270ms' }}>
                  <span className="text-xs text-gray-500">Exploits</span>
                  {rows.map((r, i) => {
                    const { best, second, idxs, tie } = leaders(rows, x => x.exploit_count || 0)
                    const delta = best - second
                    return (
                      <CompareCell
                        key={r.cve_id}
                        win={rows.length >= 2 && idxs.includes(i) && !tie && best > 0}
                        delta={idxs.includes(i) && !tie && delta > 0 ? `${delta} source${delta !== 1 ? 's' : ''}` : null}
                      >
                        <span className="text-xs text-gray-300">{r.exploit_count || 0} sources</span>
                      </CompareCell>
                    )
                  })}
                </div>

                {/* Published */}
                <div className={`${GRID} animate-fade-up`} style={{ animationDelay: '330ms' }}>
                  <span className="text-xs text-gray-500">Published</span>
                  {rows.map(r => (
                    <span key={r.cve_id} className="text-xs text-gray-400">{formatDate(r.published_date)}</span>
                  ))}
                </div>

                {/* CWE classes */}
                <div className={`${GRID} items-start animate-fade-up`} style={{ animationDelay: '390ms' }}>
                  <span className="text-xs text-gray-500">CWE classes</span>
                  {rows.map(r => (
                    <div key={r.cve_id} className="flex flex-wrap gap-1">
                      {(r.cwes || []).slice(0, 4).map(c => {
                        const shared = cwesAcross.filter(
                          x => rows.flatMap(rr => rr.cwes || []).filter(y => y === x).length >= 2
                        ).includes(c)
                        return (
                          <a
                            key={c}
                            href={`https://cwe.mitre.org/data/definitions/${c.replace('CWE-', '')}.html`}
                            target="_blank" rel="noopener noreferrer"
                            className={`font-mono text-[10px] px-1.5 py-1 rounded-md border ${
                              shared
                                ? 'text-accent-cyan border-accent-cyan/30 bg-accent-cyan/[0.08]'
                                : 'text-gray-500 border-dark-border'
                            }`}
                          >
                            {c}
                          </a>
                        )
                      })}
                    </div>
                  ))}
                </div>

                {/* Affected products */}
                <div className={`${GRID} items-start animate-fade-up`} style={{ animationDelay: '450ms' }}>
                  <span className="text-xs text-gray-500">Affected products</span>
                  {rows.map(r => (
                    <div key={r.cve_id} className="flex flex-wrap gap-1">
                      {(r.products || []).slice(0, 5).map(p => {
                        const shared = sharedProducts.includes(p.toLowerCase())
                        return (
                          <span key={p} className={`text-[10px] px-1.5 py-0.5 rounded-md border font-mono ${
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
