// Same-origin by default (Vite dev proxy / nginx proxy in production).
// Override with VITE_API_URL if the API lives on a separate origin.
const API_BASE = import.meta.env.VITE_API_URL || ''

// Only needed when the backend runs with API_KEYS set (protects write endpoints).
const API_KEY = import.meta.env.VITE_API_KEY || ''

function authHeaders() {
  return API_KEY ? { 'X-API-Key': API_KEY } : {}
}

async function apiFetch(path, options = {}) {
  const resp = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...authHeaders(), ...options.headers },
    ...options,
  })
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ detail: resp.statusText }))
    throw new Error(err.detail || `API error ${resp.status}`)
  }
  return resp.json()
}

export async function lookupCVE(cveId) {
  return apiFetch(`/api/cve/${encodeURIComponent(cveId)}`)
}

export async function batchLookup(cveIds) {
  return apiFetch('/api/cve/batch', { method: 'POST', body: JSON.stringify({ cve_ids: cveIds }) })
}

export async function compareCVEs(cveIds) {
  return apiFetch('/api/cve/compare', { method: 'POST', body: JSON.stringify({ cve_ids: cveIds }) })
}

export async function getRemediationForCVE(cveId) {
  return apiFetch(`/api/remediation/${encodeURIComponent(cveId)}`)
}

export async function createRemediation(data) {
  return apiFetch('/api/remediation/', { method: 'POST', body: JSON.stringify(data) })
}

export async function updateRemediation(recordId, data) {
  return apiFetch(`/api/remediation/${recordId}`, { method: 'PATCH', body: JSON.stringify(data) })
}

export async function listAlerts(opts = {}) {
  const params = new URLSearchParams()
  if (opts.unreadOnly) params.set('unread_only', 'true')
  if (opts.type) params.set('alert_type', opts.type)
  return apiFetch(`/api/alerts/?${params}`)
}

export async function getUnreadAlertCount() {
  return apiFetch('/api/alerts/unread-count')
}

export async function markAlertRead(alertId) {
  return apiFetch(`/api/alerts/${alertId}/read`, { method: 'PATCH' })
}

export async function markAllAlertsRead() {
  return apiFetch('/api/alerts/read-all', { method: 'POST' })
}

export async function acknowledgeAlert(alertId) {
  return apiFetch(`/api/alerts/${alertId}/acknowledge`, { method: 'PATCH' })
}

export async function getDashboardAnalytics() {
  return apiFetch('/api/analytics/dashboard')
}

export async function healthCheck() {
  return apiFetch('/api/health')
}