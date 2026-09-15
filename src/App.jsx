import { useState, useRef } from 'react'
import DisclaimerModal      from './components/DisclaimerModal'
import Header               from './components/Header'
import InputForm            from './components/InputForm'
import LoadingSpinner       from './components/LoadingSpinner'
import VulnerabilityCard    from './components/VulnerabilityCard'
import ExploitationGuide    from './components/ExploitationGuide'
import GuideTypesPanel      from './components/GuideTypesPanel'
import Footer               from './components/Footer'
import RiskScoreCard        from './components/RiskScoreCard'
import ExploitabilityCard   from './components/ExploitabilityCard'
import RemediationTracker   from './components/RemediationTracker'
import AnalyticsDashboard   from './components/AnalyticsDashboard'
import BatchView            from './components/BatchView'
import CompareView          from './components/CompareView'
import { lookupCVE }        from './services/api'
import { buildGuide }       from './utils/guideEngine'

const VIEWS = {
  HOME: 'home',
  RESULTS: 'results',
  ANALYTICS: 'analytics',
  BATCH: 'batch',
  COMPARE: 'compare',
}

export default function App() {
  const [view, setView] = useState(VIEWS.HOME)
  const [prevView, setPrevView] = useState(null)
  const [cveData, setCveData] = useState(null)
  const [guide, setGuide] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const searchGenRef = useRef(0)


  function handleReset() {
    setCveData(null)
    setGuide(null)
    setError(null)
    setView(VIEWS.HOME)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleNavigate(newView) {
    if (newView !== VIEWS.RESULTS) {
      setCveData(null)
      setGuide(null)
      setError(null)
    }
    setPrevView(view)
    setView(newView)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleBack() {
    const backTo = prevView ?? VIEWS.HOME
    setPrevView(null)
    setView(backTo)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSearch(id) {
    const gen = ++searchGenRef.current
    setLoading(true)
    setError(null)
    setCveData(null)
    setGuide(null)
    setView(VIEWS.RESULTS)

    try {
      const data = await lookupCVE(id)
      if (gen !== searchGenRef.current) return
      setCveData(data)

      const g = buildGuide({
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
      setGuide(g)

      setLoading(false)

      setTimeout(() => {
        if (gen === searchGenRef.current) {
          document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' })
        }
      }, 100)
    } catch (err) {
      if (gen !== searchGenRef.current) return
      setError(err.message || 'An unexpected error occurred.')
    } finally {
      if (gen === searchGenRef.current) setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-bg text-gray-200 flex flex-col">
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
        {view === VIEWS.HOME && (
          <>
            <InputForm onSubmit={handleSearch} loading={loading} />
            <GuideTypesPanel />
          </>
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
                    Check the CVE ID format (CVE-YYYY-NNNNN) and your connection to the backend.
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

                <RemediationTracker cveId={cveData.cve_id} />

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

        {view === VIEWS.ANALYTICS && <AnalyticsDashboard />}
      </main>

      <Footer />
    </div>
  )
}