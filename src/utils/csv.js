// CSV helpers for batch import/export. Everything happens in the browser via
// Blob downloads — nothing is uploaded or stored anywhere.

/**
 * Extract unique, uppercased CVE IDs from arbitrary text (CSV, TSV, logs,
 * free-form notes). Mirrors the extractor used by BatchView.
 */
export function parseCveList(text) {
  return [...new Set(
    (String(text || '').match(/CVE-\d{4}-\d{4,}/gi) || []).map(s => s.toUpperCase())
  )]
}

function csvCell(value) {
  const s = value === null || value === undefined ? '' : String(value)
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

/**
 * Convert batchLookup results into CSV text with a header row.
 */
export function resultsToCsv(results) {
  const rows = results || []
  const header = [
    'cve_id', 'cvss_score', 'cvss_version', 'cvss_severity',
    'epss_score', 'epss_percentile', 'kev', 'ransomware',
    'priority', 'risk_score', 'risk_level', 'exploit_count', 'description',
  ]
  const lines = [header.join(',')]
  for (const r of rows) {
    lines.push([
      r.cve_id,
      r.best_cvss?.score ?? '',
      r.best_cvss?.version ?? '',
      r.best_cvss?.severity ?? '',
      r.epss?.score ?? '',
      r.epss?.percentile ?? '',
      r.kev ? 'yes' : 'no',
      r.kev?.known_ransomware_campaign_use ? 'yes' : 'no',
      r.risk?.priority ?? '',
      r.risk?.score ?? '',
      r.risk?.level ?? '',
      r.exploit_count ?? 0,
      r.description || '',
    ].map(csvCell).join(','))
  }
  return lines.join('\r\n')
}

/**
 * Trigger a client-side download of CSV text. No network, no storage.
 */
export function downloadCsv(filename, csvText) {
  const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
