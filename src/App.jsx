import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import DisclaimerModal      from './components/DisclaimerModal'
import Header               from './components/Header'
import InputForm            from './components/InputForm'
import LoadingSpinner       from './components/LoadingSpinner'
import VulnerabilityCard    from './components/VulnerabilityCard'
import Footer               from './components/Footer'
import RiskScoreCard        from './components/RiskScoreCard'
import ExploitabilityCard   from './components/ExploitabilityCard'
import { lookupCVE }        from './services/api'

// Heavy views load on demand: ExploitationGuide pulls in the 95KB guide
// template catalog plus the syntax highlighter, and Batch/Compare pull in
// their own logic — none of it is needed to render the search page.
const ExploitationGuide = lazy(() => import('./components/ExploitationGuide'))
const BatchView         = lazy(() => import('./components/BatchView'))
const CompareView       = lazy(() => import('./components/CompareView'))

const VIEWS = {
  HOME: 'home',
  RESULTS: 'results',
  BATCH: 'batch',
  COMPARE: 'compare',
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
  return '#/'
}


export default function App() {
  const [view, setView] = useState(() => parseRoute(window.location.hash).view)
  const [cveData, setCveData] = useState(null)
  const [guide, setGuide] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const searchGenRef = useRef(0)
  // The cve_id the current (or most recent) search belongs to; the route
  // effect uses it to avoid re-fetching when navigation revisits a result.
  const searchedIdRef = useRef(null)


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
      setError(err.message || 'An unexpected error occurred.')
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


  return (
    <div className="min-h-screen text-gray-200 flex flex-col">
      <DisclaimerModal />
      <Header view={view} onNavigate={handleNavigate} />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        {/* Universal back button for all non-home views */}
        {view !== VIEWS.HOME && (
          <button
            onClick={handleBack}
            className="btn-ghost mb-5 flex items-center gap-1.5"
          >
            ← Back
          </button>
        )}

        <Suspense fallback={<LoadingSpinner message="Loading…" />}>
          {view === VIEWS.HOME && (
            <InputForm onSubmit={handleSearch} loading={loading} />
          )}

          {view === VIEWS.RESULTS && (
            <>
              {loading && <LoadingSpinner message="Fetching vulnerability intelligence…" />}

              {error && !loading && (
                <div className="card border-red-500/40 bg-red-500/[0.06] animate-fade-up mb-5">
                  <h3 className="font-semibold text-red-400 text-sm mb-1">Search failed</h3>
                  <p className="text-gray-400 text-sm">
                    {error}
                    <span className="block text-gray-600 text-xs mt-1">
                      Check the CVE ID format (CVE-YYYY-NNNNN) and your connection to the API.
                    </span>
                  </p>
                </div>
              )}

              {cveData && !loading && (
                <div id="results">
                  <button
                    onClick={handleReset}
                    className="btn-ghost mb-4"
                  >
                    ← New search
                  </button>

                  <VulnerabilityCard cve={cveData} />

                  {cveData.risk && <RiskScoreCard risk={cveData.risk} />}

                  <ExploitabilityCard cve={cveData} />

                  {guide && <ExploitationGuide guide={guide} />}

                  <button
                    onClick={handleReset}
                    className="btn-ghost mt-6 mb-2"
                  >
                    ← Back to home
                  </button>
                </div>
              )}
            </>
          )}

          {view === VIEWS.BATCH && <BatchView onSelect={handleSearch} />}

          {view === VIEWS.COMPARE && <CompareView onReset={handleReset} />}
        </Suspense>
      </main>

      <Footer />
    </div>
  )
}
