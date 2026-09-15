import { calculateRiskAssessment } from '../utils/riskEngine'

// In-memory cache for CISA KEV catalog to avoid refetching on every search
let kevCatalogCache = null
let kevFetchPromise = null

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

/**
 * Fetch CISA KEV catalog once and cache in memory.
 */
async function fetchKevCatalog() {
  if (kevCatalogCache) return kevCatalogCache
  if (kevFetchPromise) return kevFetchPromise

  kevFetchPromise = (async () => {
    try {
      const resp = await fetch('https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json', {
        headers: { Accept: 'application/json' },
      })
      if (!resp.ok) return {}
      const data = await resp.json()
      const map = {}
      for (const item of data.vulnerabilities || []) {
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
      return {}
    } finally {
      kevFetchPromise = null
    }
  })()

  return kevFetchPromise
}

/**
 * Fetch EPSS score from FIRST.org.
 */
async function fetchEpss(cveId) {
  try {
    const resp = await fetch(`https://api.first.org/data/v1/epss?cve=${encodeURIComponent(cveId)}`, {
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
    const resp = await fetch(
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
    const nvdResp = await fetch(
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
    const circlResp = await fetch(`https://cve.circl.lu/api/cve/${encodeURIComponent(cveId)}`)
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
 * Batch lookup for multiple CVEs concurrently in the browser.
 */
export async function batchLookup(cveIds) {
  const uniqueIds = [...new Set(cveIds.map(s => s.trim().toUpperCase()).filter(Boolean))]
  const settled = await Promise.allSettled(uniqueIds.map(id => lookupCVE(id)))

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

// Session-only local storage fallbacks (zero server footprint, no backend collection)
export async function getRemediationForCVE() {
  return []
}
export async function createRemediation() {
  return {}
}
export async function updateRemediation() {
  return {}
}
export async function listAlerts() {
  return []
}
export async function getUnreadAlertCount() {
  return 0
}
export async function markAlertRead() {
  return {}
}
export async function markAllAlertsRead() {
  return {}
}
export async function acknowledgeAlert() {
  return {}
}
export async function getDashboardAnalytics() {
  return { scanned_count: 0, critical_count: 0 }
}
export async function healthCheck() {
  return { status: 'ok', mode: 'client-only' }
}