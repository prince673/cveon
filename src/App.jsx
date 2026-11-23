import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import DisclaimerModal      from './components/DisclaimerModal'
import Header               from './components/Header'
import InputForm            from './components/InputForm'
import LoadingSpinner       from './components/LoadingSpinner'
import SkeletonResults      from './components/SkeletonResults'
import VulnerabilityCard    from './components/VulnerabilityCard'
import Footer               from './components/Footer'
import RiskScoreCard        from './components/RiskScoreCard'
import ExploitabilityCard   from './components/ExploitabilityCard'
import BranchedMenu         from './components/BranchedMenu'
import CommandPalette       from './components/CommandPalette'
import LatestIntel          from './components/LatestIntel'
import { lookupCVE, describeApiError } from './services/api'
import { getRecents, getPins, subscribeMemory, addRecent, clearPins } from './utils/sessionMemory'
import { isValidCveId } from './utils/cveFormat'

// Heavy views load on demand: ExploitationGuide pulls in the 95KB guide
// template catalog plus the syntax highlighter, and Batch/Compare/KEV pull in
// their own logic — none of it is needed to render the search page.
const ExploitationGuide = lazy(() => import('./components/ExploitationGuide'))
const BatchView         = lazy(() => import('./components/BatchView'))
const CompareView       = lazy(() => import('./components/CompareView'))
const KevFeedView       = lazy(() => import('./components/KevFeedView'))

const VIEWS = {
  HOME: 'home',
  RESULTS: 'results',
  BATCH: 'batch',
  COMPARE: 'compare',
  KEV: 'kev',
}

/* URL hash is the single source of truth for navigation. It keeps results
 * deep-linkable and shareable (#/cve/CVE-YYYY-NNNNN) with zero dependencies
 * and without persisting anything. */
const CVE_ID_PATTERN = /^CVE-\d{4}-\d{4,}$/

function parseRoute(hash) {
  const clean = (hash || '').replace(/^#\/?/, '').split('?')[0]
  const [head, ...rest] = clean.split('/')
  if (head === 'batch') return { view: VIEWS.BATCH }
  if (head === 'compare') return { view: VIEWS.COMPARE }
  if (head === 'kev') return { view: VIEWS.KEV }
  let cveId = null
  if (rest[0]) {
    try {
      cveId = decodeURIComponent(rest[0]).trim().toUpperCase()
    } catch {
      cveId = null
    }
  }
  if (head === 'cve' && CVE_ID_PATTERN.test(cveId)) {
    return { view: VIEWS.RESULTS, cveId }
  }
  return { view: VIEWS.HOME }
}

function routeToHash(view, cveId) {
  if (view === VIEWS.RESULTS && cveId) return `#/cve/${encodeURIComponent(cveId)}`
  if (view === VIEWS.BATCH) return '#/batch'
  if (view === VIEWS.COMPARE) return '#/compare'
  if (view === VIEWS.KEV) return '#/kev'
  return '#/'
}


export default function App() {
  const [view, setView] = useState(() => parseRoute(window.location.hash).view)
  const [cveData, setCveData] = useState(null)
  const [guide, setGuide] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  // Theme is in-memory only: no persistence, honoring the zero-storage model.
  const [theme, setTheme] = useState('dark')
  const [paletteOpen, setPaletteOpen] = useState(false)
  // Recent searches + pinned CVEs, RAM-only, shared via sessionMemory.
  const [memory, setMemory] = useState(() => ({ recents: getRecents(), pins: getPins() }))
  const searchGenRef = useRef(0)
  // The cve_id the current (or most recent) search belongs to; the route
  // effect uses it to avoid re-fetching when navigation revisits a result.
  const searchedIdRef = useRef(null)

  useEffect(() => subscribeMemory(setMemory), [])

  useEffect(() => {
    document.documentElement.classList.toggle('theme-light', theme === 'light')
  }, [theme])

  async function runSearch(cveId) {
    const gen = ++searchGenRef.current
    searchedIdRef.current = cveId
    setLoading(true)
    setError(null)
    setCveData(null)
    setGuide(null)

    try {
      const data = await lookupCVE(cveId)
      if (gen !== searchGenRef.current) return
      setCveData(data)
      addRecent(cveId)

      // guideEngine + its large template catalog load as a lazy chunk here,
      // keeping the initial page bundle lean.
      const { buildGuide } = await import('./utils/guideEngine')
      const built = buildGuide({
        cve_id: data.cve_id,
        description: data.description,
        cwes: data.cwes,
        products: data.products,
        references: data.references,
        best_cvss: data.best_cvss,
        cvss_scores: data.cvss_scores,
        exploits: data.exploits,
        kev: data.kev,
      })
      if (gen !== searchGenRef.current) return
      setGuide(built)
    } catch (err) {
      if (gen !== searchGenRef.current) return
      setError(err instanceof Error ? err : new Error('An unexpected error occurred.'))
    } finally {
      if (gen === searchGenRef.current) setLoading(false)
    }

    if (gen === searchGenRef.current) {
      setTimeout(() => {
        if (gen === searchGenRef.current) {
          document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' })
        }
      }, 100)
    }
  }

  function handleSearch(id) {
    const cveId = (id || '').trim().toUpperCase()
    if (!isValidCveId(cveId)) return
    const current = parseRoute(window.location.hash)
    if (current.view === VIEWS.RESULTS && current.cveId === cveId) {
      // Already showing this CVE: force a refresh instead of a no-op route change.
      if (!loading) runSearch(cveId)
    } else {
      window.location.hash = routeToHash(VIEWS.RESULTS, cveId)
    }
  }

  function handleNavigate(newView) {
    window.location.hash = routeToHash(newView)
  }

  function handleBack() {
    if (window.history.length > 1) window.history.back()
    else window.location.hash = '#/'
  }

  function handleReset() {
    window.location.hash = '#/'
  }

  // React to hash changes (user-entered links, browser back/forward) and to
  // the initial hash at boot so deep links restore their search. Everything
  // stays in memory; no storage, no server round-trips.
  useEffect(() => {
    function applyRoute() {
      const { view: nextView, cveId } = parseRoute(window.location.hash)
      setView(nextView)
      if (nextView === VIEWS.RESULTS) {
        if (searchedIdRef.current !== cveId) {
          runSearch(cveId)
        }
      } else {
        searchedIdRef.current = null
        setCveData(null)
        setGuide(null)
        setError(null)
        setLoading(false)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }

    window.addEventListener('hashchange', applyRoute)
    applyRoute()
    return () => window.removeEventListener('hashchange', applyRoute)
  }, [])

  // Global keyboard shortcuts: / focus search · Esc home · b batch ·
  // c compare · k KEV feed · Ctrl/Cmd+K command palette.
  useEffect(() => {
    function onKey(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen(true)
        return
      }
      if (e.ctrlKey || e.metaKey || e.altKey) return
      const el = document.activeElement
      const typing = el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)
      if (typing || paletteOpen) return
      // Never hijack keys while a modal (disclaimer, latest-CVE popup) is open.
      if (document.querySelector('[aria-modal="true"]')) return

      if (e.key === '/') {
        e.preventDefault()
        if (view === VIEWS.HOME) {
          document.getElementById('cve-input')?.focus()
        } else {
          window.location.hash = '#/'
          setTimeout(() => document.getElementById('cve-input')?.focus(), 80)
        }
      } else if (e.key === 'Escape') {
        if (view !== VIEWS.HOME) window.location.hash = '#/'
      } else if (e.key.toLowerCase() === 'b') {
        window.location.hash = '#/batch'
      } else if (e.key.toLowerCase() === 'c') {
        window.location.hash = '#/compare'
      } else if (e.key.toLowerCase() === 'k') {
        window.location.hash = '#/kev'
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [view, paletteOpen])

  const paletteActions = useMemo(() => {
    const actions = [
      { id: 'nav-home',    label: 'Go to Search',          hint: 'home',    run: () => handleNavigate(VIEWS.HOME) },
      { id: 'nav-batch',   label: 'Batch Analysis',        hint: 'batch',   run: () => handleNavigate(VIEWS.BATCH) },
      { id: 'nav-compare', label: 'Compare CVEs',          hint: 'compare', run: () => handleNavigate(VIEWS.COMPARE) },
      { id: 'nav-kev',     label: 'CISA KEV catalog feed', hint: 'kev',     run: () => handleNavigate(VIEWS.KEV) },
      { id: 'theme',       label: theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme',
        hint: 'theme', run: () => setTheme(t => (t === 'dark' ? 'light' : 'dark')) },
    ]
    for (const id of memory.recents) {
      actions.push({ id: `recent-${id}`, label: id, hint: 'recent', run: () => handleSearch(id) })
    }
    for (const id of memory.pins) {
      actions.push({ id: `pin-${id}`, label: id, hint: 'pinned', run: () => handleSearch(id) })
    }
    return actions
  }, [memory, theme]) // eslint-disable-line react-hooks/exhaustive-deps

  const errorInfo = error ? describeApiError(error) : null


  return (
    <div className="min-h-screen text-gray-200 flex flex-col">
      {/* Animated backdrop: aurora glows + HUD grid (pure CSS, no scripts) */}
      <div className="bg-scene" aria-hidden="true">
        <div className="aurora aurora-1" />
        <div className="aurora aurora-2" />
        <div className="aurora aurora-3" />
        <div className="grid-overlay" />
      </div>

      <DisclaimerModal />
      <Header
        view={view}
        onNavigate={handleNavigate}
        onSearchCve={handleSearch}
        theme={theme}
        onToggleTheme={() => setTheme(t => (t === 'dark' ? 'light' : 'dark'))}
        onOpenPalette={() => setPaletteOpen(true)}
      />

      <main className="above-scene flex-1 max-w-4xl xl:max-w-6xl mx-auto w-full px-4 py-8">
        {/* Universal back button for all non-home views */}
        {view !== VIEWS.HOME && (
          <button
            onClick={handleBack}
            className="btn-ghost mb-5 flex items-center gap-1.5"
          >
            ← Back
          </button>
        )}

        <div key={view} className="animate-view-in">
        <Suspense fallback={<LoadingSpinner message="Loading…" />}>
          {view === VIEWS.HOME && (
            <>
              <div className="flex gap-6 items-start">
                {/* Sidebar collapses on mobile — the header nav covers it */}
                <div className="hidden md:block shrink-0">
                  <BranchedMenu
                    items={[
                      {
                        label: 'Explore',
                        children: [
                          { value: 'home', label: 'Search' },
                          { value: 'batch', label: 'Batch Analysis' },
                          { value: 'compare', label: 'Compare CVEs' },
                          { value: 'kev', label: 'KEV Catalog' }
                        ]
                      },
                      {
                        label: 'Resources',
                        children: [
                          { value: 'nvd', label: 'NVD Database' },
                          { value: 'mitre', label: 'MITRE ATT&CK' },
                          { value: 'cisa', label: 'CISA KEV' }
                        ]
                      }
                    ]}
                    defaultOpen={[0]}
                    defaultActive="home"
                    onSelect={(value) => {
                      if (value === 'home' || value === 'batch' || value === 'compare' || value === 'kev') {
                        handleNavigate(value);
                      } else if (value === 'nvd') {
                        window.open('https://nvd.nist.gov/', '_blank');
                      } else if (value === 'mitre') {
                        window.open('https://attack.mitre.org/', '_blank');
                      } else if (value === 'cisa') {
                        window.open('https://www.cisa.gov/known-exploited-vulnerabilities-catalog', '_blank');
                      }
                    }}
                    color={theme === 'light' ? '#1f2328' : '#c9d1d9'}
                    accentColor="#58a6ff"
                    lineColor={theme === 'light' ? '#d0d7de' : '#30363d'}
                    width={220}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <InputForm onSubmit={handleSearch} loading={loading} />

                  {/* Session watchlist + recent searches — RAM only, gone on reload */}
                  {(memory.pins.length > 0 || memory.recents.length > 0) && (
                    <div className="card-flat px-5 py-4 space-y-3 mt-4">
                      {memory.pins.length > 0 && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="section-label">Pinned this tab</span>
                            <button
                              onClick={clearPins}
                              className="text-[10px] text-gray-500 hover:text-gray-300 transition-colors"
                            >
                              Clear
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {memory.pins.map(id => (
                              <button
                                key={id}
                                onClick={() => handleSearch(id)}
                                className="pill font-mono text-xs text-gray-200 hover:border-[#484f58] transition-colors"
                              >
                                {id}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      {memory.recents.length > 0 && (
                        <div>
                          <span className="section-label block mb-2">Recent searches</span>
                          <div className="flex flex-wrap gap-1.5">
                            {memory.recents.map(id => (
                              <button
                                key={id}
                                onClick={() => handleSearch(id)}
                                className="pill font-mono text-xs text-[#8b949e] hover:text-gray-200 hover:border-[#484f58] transition-colors"
                              >
                                {id}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {/* Live intelligence strip: newest NVD + KEV activity */}
                  <LatestIntel onSelectCve={handleSearch} onOpenKev={() => handleNavigate('kev')} />
                </div>
              </div>
            </>
          )}

          {view === VIEWS.RESULTS && (
            <div aria-live="polite">
              {loading && <SkeletonResults />}

              {error && !loading && (
                <div className="card border-red-500/40 bg-red-500/[0.06] animate-fade-up mb-5" role="alert">
                  <h3 className="font-semibold text-red-400 text-sm mb-1">{errorInfo.title}</h3>
                  <p className="text-gray-400 text-sm">{error.message}</p>
                  <p className="text-gray-500 text-xs mt-1">{errorInfo.hint}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={() => searchedIdRef.current && runSearch(searchedIdRef.current)}
                      className="btn-primary !py-1.5 text-xs"
                    >
                      Retry
                    </button>
                    <button onClick={handleReset} className="btn-ghost !py-1.5 text-xs">
                      New search
                    </button>
                  </div>
                </div>
              )}

              {cveData && !loading && (
                <div id="results" className="xl:grid xl:grid-cols-[minmax(0,1fr)_340px] xl:gap-5 xl:items-start">
                  {/* Main column: identity + description + guide */}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      <button
                        onClick={handleReset}
                        className="btn-ghost"
                      >
                        ← New search
                      </button>
                      <button
                        onClick={() => window.print()}
                        className="btn-ghost"
                        title="Print or save this advisory as PDF"
                      >
                        Print / PDF
                      </button>
                    </div>

                    <VulnerabilityCard cve={cveData} delayMs={0} />

                    {guide && <ExploitationGuide guide={guide} />}

                    <button
                      onClick={handleReset}
                      className="btn-ghost mt-6 mb-2"
                    >
                      ← Back to home
                    </button>
                  </div>

                  {/* Right rail: risk + exploitability stay visible while
                      scrolling the guide on wide screens */}
                  <div className="xl:sticky xl:top-[72px] xl:self-start">
                    {cveData.risk && <RiskScoreCard risk={cveData.risk} delayMs={100} />}

                    <ExploitabilityCard cve={cveData} delayMs={200} />
                  </div>
                </div>
              )}
            </div>
          )}

          {view === VIEWS.BATCH && <BatchView onSelect={handleSearch} />}

          {view === VIEWS.COMPARE && <CompareView onReset={handleReset} />}

          {view === VIEWS.KEV && <KevFeedView onSelectCve={handleSearch} />}
        </Suspense>
        </div>
      </main>

      <div className="above-scene">
        <Footer />
      </div>

      <CommandPalette
        key={String(paletteOpen)}
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        actions={paletteActions}
      />
    </div>
  )
}
