/**
 * Transparent client-side risk-prioritization engine.
 *
 * Combines CVSS (severity) + EPSS (exploitation likelihood, with trend) +
 * KEV (confirmed exploitation, with recency) + exploit availability +
 * temporal maturity to produce a P1–P4 priority with human-readable reasons.
 *
 * 100% browser-executable — no backend or database required.
 */

const DEFAULT_WEIGHTS = {
  cvss: 25,
  epss: 20,
  kev: 25,
  exploit: 15,
  temporal: 15,
}

const THRESHOLDS = [
  [80, 'Critical', 'P1'],
  [60, 'High', 'P2'],
  [35, 'Medium', 'P3'],
]

const RECOMMENDATIONS = {
  P1: 'Remediate immediately. Patch affected systems or apply mitigating controls without delay.',
  P2: 'Remediate urgently. Schedule patching within the current security cycle.',
  P3: 'Remediate in standard cycle. Include in next regular patch window.',
  P4: 'Monitor. Track for changes in exploitation status or trend shifts.',
}

function normalizeWeights(overrides) {
  const weights = { ...DEFAULT_WEIGHTS }
  if (overrides && typeof overrides === 'object') {
    for (const k of Object.keys(weights)) {
      if (typeof overrides[k] === 'number') {
        weights[k] = Math.max(0, overrides[k])
      }
    }
  }
  const total = Object.values(weights).reduce((a, b) => a + b, 0)
  if (total <= 0) return { ...DEFAULT_WEIGHTS }
  const out = {}
  for (const [k, v] of Object.entries(weights)) {
    out[k] = (v / total) * 100
  }
  return out
}

function parseDate(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? null : d
}

/**
 * Produce a full risk assessment from assembled CVE data dict.
 */
export function calculateRiskAssessment(cveData, weightOverrides = null) {
  const weights = normalizeWeights(weightOverrides)
  const signals = []
  const reasons = []
  let total = 0

  const cvss = cveData.best_cvss || {}
  const cvssScore = typeof cvss.score === 'number' ? cvss.score : parseFloat(cvss.score) || 0
  const severity = cvss.severity || 'Unknown'

  const epss = cveData.epss || {}
  const epssScore = typeof epss.score === 'number' ? epss.score : parseFloat(epss.score) || 0
  const prevEpss = typeof epss.previous_score === 'number' ? epss.previous_score : null
  const epssDelta = prevEpss !== null ? epssScore - prevEpss : null

  const kev = cveData.kev
  const hasKev = Boolean(kev)

  const exploits = Array.isArray(cveData.exploits) ? cveData.exploits : []
  const hasExploit = exploits.length > 0
  const topStars = hasExploit ? (exploits[0].stars || 0) : 0

  // 1. CVSS severity
  const cvssMax = weights.cvss
  const cvssPoints = cvssScore ? Math.round((cvssScore / 10) * cvssMax) : 0
  total += cvssPoints
  signals.push({
    name: 'cvss',
    label: `CVSS ${severity} (${cvssScore.toFixed(1)}/10)`,
    value: cvssPoints,
    max: cvssMax,
    weight: `${Math.round(weights.cvss)}%`,
  })
  if (cvssScore >= 9.0) {
    reasons.push(`Critical technical severity (CVSS ${cvssScore.toFixed(1)})`)
  } else if (cvssScore >= 7.0) {
    reasons.push(`High technical severity (CVSS ${cvssScore.toFixed(1)})`)
  } else if (cvssScore >= 4.0) {
    reasons.push(`Moderate technical severity (CVSS ${cvssScore.toFixed(1)})`)
  } else {
    reasons.push('Low technical severity')
  }

  // 2. EPSS exploitation probability
  const epssMax = weights.epss
  const epssPoints = Math.round(epssScore * epssMax)
  total += epssPoints
  const pctLabel = `${(epssScore * 100).toFixed(1)}%`
  let trendArrow = ''
  if (epssDelta !== null) {
    trendArrow = epssDelta > 0.01 ? ' ↑' : (epssDelta < -0.01 ? ' ↓' : ' →')
  }
  let labelRank = 'Low'
  if (epssScore >= 0.7) {
    labelRank = 'Very High'
    reasons.push(`Very high exploitation probability (EPSS ${pctLabel})`)
  } else if (epssScore >= 0.4) {
    labelRank = 'High'
    reasons.push(`High exploitation probability (EPSS ${pctLabel})`)
  } else if (epssScore >= 0.1) {
    labelRank = 'Moderate'
    reasons.push(`Moderate exploitation probability (EPSS ${pctLabel})`)
  } else {
    reasons.push(`Low exploitation probability (EPSS ${pctLabel})`)
  }

  const epssSignal = {
    name: 'epss',
    label: `EPSS ${pctLabel} — ${labelRank}${trendArrow}`,
    value: epssPoints,
    max: epssMax,
    weight: `${Math.round(weights.epss)}%`,
  }
  if (epssDelta !== null) {
    const deltaPct = (Math.abs(epssDelta) * 100).toFixed(1)
    if (epssDelta > 0.01) {
      epssSignal.reason = `EPSS rose ${deltaPct} pts vs previous value`
      reasons.push(`EPSS trending upward (+${deltaPct}%) — exploitation likelihood increasing`)
    } else if (epssDelta < -0.01) {
      reasons.push(`EPSS trending downward (-${deltaPct}%) — likelihood decreasing`)
    }
  }
  signals.push(epssSignal)

  // 3. KEV confirmed exploitation
  const kevMax = weights.kev
  const kevPoints = hasKev ? kevMax : 0
  let kevRecent = false
  if (hasKev) {
    total += kevPoints
    let kevReason = 'Confirmed exploitation in the wild (CISA KEV catalog)'
    const dateAdded = kev.date_added || kev.dateAdded
    const addedDt = parseDate(dateAdded)
    if (addedDt && (Date.now() - addedDt.getTime()) <= 90 * 24 * 60 * 60 * 1000) {
      kevRecent = true
      kevReason += ' — added recently (within 90 days)'
    }
    reasons.push(kevReason)
    if (kev.known_ransomware_campaign_use || kev.knownRansomwareCampaignUse === 'Known') {
      reasons.push('Exploited in known ransomware campaigns')
    }
  }
  signals.push({
    name: 'kev',
    label: kevRecent && hasKev
      ? 'CISA KEV — Confirmed exploited (recent)'
      : (hasKev ? 'CISA KEV — Confirmed exploited' : 'Not in CISA KEV'),
    value: kevPoints,
    max: kevMax,
    weight: `${Math.round(weights.kev)}%`,
  })

  // 4. Public exploit availability
  const exploitMax = weights.exploit
  let exploitPoints = 0
  if (hasExploit && topStars > 100) {
    exploitPoints = Math.round(exploitMax)
    reasons.push(`Widely available exploit code (${topStars} stars)`)
  } else if (hasExploit) {
    exploitPoints = Math.round(exploitMax * 0.66)
    reasons.push('Public exploit code available')
  }
  total += exploitPoints
  signals.push({
    name: 'exploit',
    label: hasExploit ? `${exploits.length} exploit source${exploits.length !== 1 ? 's' : ''}` : 'No public exploits',
    value: exploitPoints,
    max: exploitMax,
    weight: `${Math.round(weights.exploit)}%`,
  })

  // 5. Temporal maturity
  const temporalMax = weights.temporal
  let temporalPoints = 0
  let ageDays = null
  const publishedDt = parseDate(cveData.published_date)
  if (publishedDt) {
    ageDays = Math.floor((Date.now() - publishedDt.getTime()) / (24 * 60 * 60 * 1000))
    if (ageDays <= 30) {
      temporalPoints = Math.round(temporalMax)
      reasons.push(`Recently disclosed (${ageDays}d old) — active exploitation window`)
    } else if (ageDays <= 120) {
      temporalPoints = Math.round(temporalMax * 0.66)
      reasons.push(`Moderately recent disclosure (${ageDays}d old)`)
    } else if (ageDays <= 365 && (hasKev || hasExploit)) {
      temporalPoints = Math.round(temporalMax * 0.33)
      reasons.push('Disclosed within past year and actively targeted')
    }
  }
  total += temporalPoints
  signals.push({
    name: 'temporal',
    label: ageDays !== null ? `${ageDays}d old` : 'Disclosure age unknown',
    value: temporalPoints,
    max: temporalMax,
    weight: `${Math.round(weights.temporal)}%`,
  })

  const score = Math.min(100, Math.max(0, Math.round(total)))
  let level = 'Low'
  let priority = 'P4'
  for (const [threshold, lvl, pri] of THRESHOLDS) {
    if (score >= threshold) {
      level = lvl
      priority = pri
      break
    }
  }

  return {
    score,
    level,
    priority,
    signals,
    reasons,
    recommendation: RECOMMENDATIONS[priority],
    trends: {
      epss_delta: epssDelta,
      kev_recent: kevRecent,
    },
  }
}
