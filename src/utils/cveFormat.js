// Canonical CVE ID format shared by routing, input validation and memory
// stores: CVE-YYYY-NNNN+ (4+ digit sequence number, as NVD publishes them).
export const CVE_ID_PATTERN = /^CVE-\d{4}-\d{4,}$/

/**
 * Normalize free-form user input into a canonical CVE ID.
 * Accepts "cve 2021 44228", "2021-44228", "CVE-2021-44228", etc.
 * Returns '' when nothing extractable remains.
 */
export function normalizeCveInput(raw) {
  let v = String(raw || '').toUpperCase().replace(/[\s._/\\]+/g, '')
  v = v.replace(/^CVE-?/, '')
  return v ? `CVE-${v}` : ''
}

export function isValidCveId(value) {
  return CVE_ID_PATTERN.test(String(value || '').trim().toUpperCase())
}
