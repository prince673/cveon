import { calculateRiskAssessment } from '../utils/riskEngine'

// In-memory cache for CISA KEV catalog to avoid refetching on every search.
// Volatile by design: it lives only in RAM for the current page load — nothing
// is written to storage, so the app keeps a zero-footprint profile.
let kevCatalogCache = null
let kevFetchPromise = null

// The app talks to public feeds directly from the visitor's browser (no proxy,
// no API keys — that is what keeps lookups anonymous). Anonymous rate limits
// therefore apply, so every upstream request retries throttling/5xx responses
// with exponential backoff, honouring Retry-After when provided.
const RETRYABLE_STATUSES = new Set([403, 429, 500, 502, 503, 504])
const MAX_ATTEMPTS = 3
const BACKOFF_BASE_MS = 1000
const BACKOFF_CAP_MS = 8000

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function getRetryDelayMs(attempt, retryAfterHeader) {
  const retryAfter = parseFloat(retryAfterHeader)
  if (Number.isFinite(retryAfter)) {
    return Math.min(retryAfter * 1000, BACKOFF_CAP_MS)
  }
  return Math.min(BACKOFF_BASE_MS * 2 ** attempt, BACKOFF_CAP_MS)
}

async function fetchWithRetry(url, options = {}) {
  let lastResp = null
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      lastResp = await fetch(url, options)
    } catch (err) {
      if (attempt === MAX_ATTEMPTS - 1) throw err
      await sleep(Math.min(BACKOFF_BASE_MS * 2 ** attempt, BACKOFF_CAP_MS))
      continue
    }
    if (!RETRYABLE_STATUSES.has(lastResp.status)) return lastResp
    if (attempt < MAX_ATTEMPTS - 1) {
      await sleep(getRetryDelayMs(attempt, lastResp.headers.get('Retry-After')))
    }
  }
  return lastResp
}

// Batch lookups must pace themselves: NVD allows only a handful of anonymous
// requests per 30s window and GitHub allows 60/h per IP. A bounded in-browser
// pool (plus the retries above) keeps large batches from burning quota.
const BATCH_CONCURRENCY = 4

/**
 * Map items to results with at most `limit` workers running at once.
 * Mirrors Promise.allSettled semantics: never rejects; preserves input order.
 */
export async function runWithConcurrency(items, limit, worker) {
  const results = new Array(items.length)
  let cursor = 0

  async function lane() {
    while (cursor < items.length) {
      const index = cursor++
      try {
        results[index] = { status: 'fulfilled', value: await worker(items[index], index) }
      } catch (error) {
        results[index] = { status: 'rejected', reason: error }
      }
    }
  }

  const lanes = Math.min(Math.max(1, limit), Math.max(items.length, 1))
  await Promise.all(Array.from({ length: lanes }, lane))
  return results
}

function getSeverityFromCvss(score) {
  if (score === null || score === undefined) return 'Unknown'
  const s = parseFloat(score)
  if (s >= 9.0) return 'Critical'
  if (s >= 7.0) return 'High'
  if (s >= 4.0) return 'Medium'
  return 'Low'
}

function parseDate(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? null : d.toISOString()
}

// The cisa.gov download endpoint sends no Access-Control-Allow-Origin header, so a
// pure client-side app (no proxy) cannot read its responses — the browser blocks
// the body. CISA's own GitHub mirror (cisagov/kev-data) serves the identical
// catalog through raw.githubusercontent.com, which allows anonymous cross-origin
// access; cisa.gov stays as an offline-server fallback attempt.
const KEV_URLS = [
  'https://raw.githubusercontent.com/cisagov/kev-data/main/known_exploited_vulnerabilities.json',
  'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json',
]

/**
 * Fetch CISA KEV catalog once and cache in memory.
 */
async function fetchKevCatalog() {
  if (kevCatalogCache) return kevCatalogCache
  if (kevFetchPromise) return kevFetchPromise

  kevFetchPromise = (async () => {
    for (const url of KEV_URLS) {
      try {
        const resp = await fetchWithRetry(url, {
          headers: { Accept: 'application/json' },
        })
        if (!resp.ok) continue
        const data = await resp.json()
        if (!Array.isArray(data.vulnerabilities)) continue
        const map = {}
        for (const item of data.vulnerabilities) {
          if (item.cveID) {
            map[item.cveID.toUpperCase()] = {
              vendor: item.vendorProject,
              product: item.product,
              vulnerability_name: item.vulnerabilityName,
              date_added: item.dateAdded,
              due_date: item.dueDate,
              required_action: item.requiredAction,
              known_ransomware_campaign_use: item.knownRansomwareCampaignUse === 'Known',
              short_description: item.shortDescription,
            }
          }
        }
        kevCatalogCache = map
        return map
      } catch {
        // Mirror down or throttled — try the next source
      }
    }
    // Nothing worked: clear the memoPromise so later lookups can retry
    kevFetchPromise = null
    return {}
  })()

  return kevFetchPromise
}

/**
 * Fetch EPSS score from FIRST.org.
 */
async function fetchEpss(cveId) {
  try {
    const resp = await fetchWithRetry(`https://api.first.org/data/v1/epss?cve=${encodeURIComponent(cveId)}`, {
      headers: { Accept: 'application/json' },
    })
    if (!resp.ok) return null
    const json = await resp.json()
    const item = json.data?.[0]
    if (!item) return null
    const score = parseFloat(item.epss)
    const percentile = parseFloat(item.percentile)
    return {
      score: isNaN(score) ? null : score,
      percentile: isNaN(percentile) ? null : percentile,
      previous_score: null,
      calculated_at: item.date || null,
    }
  } catch {
    return null
  }
}

/**
 * Fetch public exploit repositories from GitHub.
 */
async function fetchExploits(cveId) {
  try {
    const resp = await fetchWithRetry(
      `https://api.github.com/search/repositories?q=${encodeURIComponent(cveId + ' exploit')}&sort=stars&per_page=5`,
      { headers: { Accept: 'application/vnd.github.v3+json' } }
    )
    if (!resp.ok) return []
    const data = await resp.json()
    return (data.items || []).slice(0, 5).map(item => ({
      url: item.html_url,
      name: item.name || '',
      stars: item.stargazers_count || 0,
      source_type: 'github',
    }))
  } catch {
    return []
  }
}

/**
 * Fetch CVE details from NIST NVD API 2.0 with fallback to CIRCL API.
 */
async function fetchCveRaw(cveId) {
  // Try NIST NVD v2.0 first
  try {
    const nvdResp = await fetchWithRetry(
      `https://services.nvd.nist.gov/rest/json/cves/2.0?cveId=${encodeURIComponent(cveId)}`,
      { headers: { Accept: 'application/json' } }
    )
    if (nvdResp.ok) {
      const data = await nvdResp.json()
      const vuln = data.vulnerabilities?.[0]?.cve
      if (vuln) {
        return normalizeNvd(vuln)
      }
    }
  } catch {
    // NVD failed or throttled, fall through to CIRCL
  }

  // Fallback to CIRCL
  try {
    const circlResp = await fetchWithRetry(`https://cve.circl.lu/api/cve/${encodeURIComponent(cveId)}`)
    if (circlResp.ok) {
      const data = await circlResp.json()
      if (data && (data.id || data.summary)) {
        return normalizeCircl(data)
      }
    }
  } catch {
    // CIRCL also failed
  }

  throw new Error(`Vulnerability ${cveId} could not be retrieved from public intelligence feeds.`)
}

function normalizeNvd(data) {
  const descriptions = data.descriptions || []
  const descObj = descriptions.find(d => d.lang === 'en') || descriptions[0] || {}
  const description = descObj.value || 'No description available.'

  const metrics = data.metrics || {}
  const cvss40 = metrics.cvssMetricV40?.[0]
  const cvss31 = metrics.cvssMetricV31?.[0]
  const cvss30 = metrics.cvssMetricV30?.[0]
  const cvss2 = metrics.cvssMetricV2?.[0]

  const cvss_scores = []
  for (const [entry, ver] of [
    [cvss40, '4.0'],
    [cvss31, '3.1'],
    [cvss30, '3.0'],
    [cvss2, '2.0'],
  ]) {
    if (entry) {
      const cd = entry.cvssData || entry
      const score = cd.baseScore ?? entry.baseScore ?? null
      cvss_scores.push({
        version: ver,
        score: score !== null ? parseFloat(score) : null,
        severity: entry.baseSeverity || getSeverityFromCvss(score),
        vector_string: cd.vectorString || entry.vectorString || null,
        attack_vector: cd.attackVector || null,
        attack_complexity: cd.attackComplexity || null,
        privileges_required: cd.privilegesRequired || null,
        user_interaction: cd.userInteraction || null,
        scope: cd.scope || null,
        confidentiality: cd.confidentialityImpact || null,
        integrity: cd.integrityImpact || null,
        availability: cd.availabilityImpact || null,
      })
    }
  }

  const cwes = []
  for (const w of data.weaknesses || []) {
    for (const d of w.description || []) {
      if (d.value && d.value.startsWith('CWE-')) {
        cwes.push(d.value)
      }
    }
  }

  const products = []
  for (const config of data.configurations || []) {
    for (const node of config.nodes || []) {
      for (const match of node.cpeMatch || []) {
        const cpe = match.criteria || ''
        const parts = cpe.split(':')
        if (parts.length > 4) {
          products.push(`${parts[3]}:${parts[4]}`)
        }
      }
    }
  }

  const references = (data.references || []).map(r => r.url).filter(Boolean)

  return {
    description,
    published_date: parseDate(data.published),
    modified_date: parseDate(data.lastModified),
    cvss_scores,
    cwes: [...new Set(cwes)],
    products: [...new Set(products)],
    references: [...new Set(references)],
  }
}

function normalizeCircl(data) {
  let description = ''
  if (typeof data.summary === 'string') {
    description = data.summary
  } else if (data.summary && typeof data.summary.description === 'string') {
    description = data.summary.description
  }

  const cvssData = typeof data.cvss === 'object' && data.cvss ? data.cvss : {}
  const cvss3Score = data.cvss3 ?? cvssData.score ?? null
  const cvss2Score = cvssData.score ?? null

  const cvss_scores = []
  if (cvss3Score !== null) {
    const s = parseFloat(cvss3Score)
    cvss_scores.push({
      version: '3.1',
      score: isNaN(s) ? null : s,
      severity: getSeverityFromCvss(s),
      vector_string: data['cvss3-vector'] || cvssData.vector || null,
      attack_vector: null,
      attack_complexity: null,
      privileges_required: null,
      user_interaction: null,
      scope: null,
      confidentiality: null,
      integrity: null,
      availability: null,
    })
  }

  if (cvss2Score !== null && cvss2Score !== cvss3Score) {
    const s = parseFloat(cvss2Score)
    cvss_scores.push({
      version: '2.0',
      score: isNaN(s) ? null : s,
      severity: getSeverityFromCvss(s),
      vector_string: null,
      attack_vector: null,
      attack_complexity: null,
      privileges_required: null,
      user_interaction: null,
      scope: null,
      confidentiality: null,
      integrity: null,
      availability: null,
    })
  }

  const cwes = []
  if (Array.isArray(data.cwe)) {
    for (const c of data.cwe) {
      if (typeof c === 'string') cwes.push(c)
      else if (c && c.name) cwes.push(c.name)
    }
  } else if (typeof data.cwe === 'string') {
    cwes.push(data.cwe)
  }

  const products = Array.isArray(data.vulnerable_product_list) ? data.vulnerable_product_list : []
  const references = Array.isArray(data.references) ? data.references : []

  return {
    description,
    published_date: parseDate(data.Published),
    modified_date: parseDate(data.Modified),
    cvss_scores,
    cwes: [...new Set(cwes)],
    products: [...new Set(products)],
    references: [...new Set(references)],
  }
}

/**
 * Single CVE lookup combining NVD/CIRCL + EPSS + CISA KEV + GitHub exploits.
 */
export async function lookupCVE(cveId) {
  const cleanId = cveId.trim().toUpperCase()

  const [rawCve, epss, kevCatalog, exploits] = await Promise.all([
    fetchCveRaw(cleanId),
    fetchEpss(cleanId),
    fetchKevCatalog(),
    fetchExploits(cleanId),
  ])

  const kev = kevCatalog[cleanId] || null

  const validScores = rawCve.cvss_scores.filter(s => typeof s.score === 'number' && !isNaN(s.score))
  const bestCvssObj = validScores.length > 0
    ? validScores.reduce((max, curr) => (curr.score > max.score ? curr : max), validScores[0])
    : null

  const best_cvss = bestCvssObj
    ? {
        version: bestCvssObj.version,
        score: bestCvssObj.score,
        severity: bestCvssObj.severity,
        vector_string: bestCvssObj.vector_string,
      }
    : null

  const assembled = {
    cve_id: cleanId,
    description: rawCve.description,
    published_date: rawCve.published_date,
    modified_date: rawCve.modified_date,
    cwes: rawCve.cwes,
    products: rawCve.products,
    references: rawCve.references,
    cvss_scores: rawCve.cvss_scores,
    best_cvss,
    epss,
    kev,
    exploits,
  }

  const risk = calculateRiskAssessment(assembled)

  return {
    ...assembled,
    risk,
  }
}

function formatSummary(cveData, risk) {
  return {
    cve_id: cveData.cve_id,
    description: cveData.description,
    published_date: cveData.published_date,
    cwes: cveData.cwes || [],
    products: (cveData.products || []).slice(0, 10),
    best_cvss: cveData.best_cvss,
    cvss_scores: cveData.cvss_scores || [],
    epss: cveData.epss,
    kev: cveData.kev,
    exploit_count: (cveData.exploits || []).length,
    risk,
  }
}

/**
 * Batch lookup for multiple CVEs, paced by BATCH_CONCURRENCY so we do not
 * blow through anonymous upstream rate limits (see runWithConcurrency).
 */
export async function batchLookup(cveIds) {
  const uniqueIds = [...new Set(cveIds.map(s => s.trim().toUpperCase()).filter(Boolean))]
  const settled = await runWithConcurrency(uniqueIds, BATCH_CONCURRENCY, lookupCVE)

  const results = []
  const errors = []

  settled.forEach((res, idx) => {
    const id = uniqueIds[idx]
    if (res.status === 'fulfilled') {
      results.push(formatSummary(res.value, res.value.risk))
    } else {
      errors.push({ cve_id: id, detail: res.reason?.message || 'Lookup failed' })
    }
  })

  return { results, errors }
}

/**
 * Compare up to 3 CVEs side-by-side.
 */
export async function compareCVEs(cveIds) {
  const resp = await batchLookup(cveIds)
  if (resp.results.length === 0) {
    throw new Error('None of the requested CVEs could be found.')
  }
  return resp
}