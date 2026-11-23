import { describe, it, expect } from 'vitest'
import { calculateRiskAssessment } from '../src/utils/riskEngine'

const BASE = {
  cve_id: 'CVE-2021-44228',
  description: 'test',
  published_date: '2021-12-10T00:00:00Z',
  cvss_scores: [],
  cwes: [],
  products: [],
  references: [],
}

describe('calculateRiskAssessment — edge cases', () => {
  it('does not throw on completely empty data', () => {
    const r = calculateRiskAssessment({})
    expect(r.score).toBe(0)
    expect(r.priority).toBe('P4')
    expect(r.level).toBe('Low')
    expect(r.signals).toHaveLength(5)
    expect(r.recommendation).toBeTruthy()
  })

  it('handles null/undefined sub-objects and NaN scores', () => {
    const r = calculateRiskAssessment({
      ...BASE,
      best_cvss: { score: 'not-a-number' },
      epss: { score: null },
      kev: null,
      exploits: 'not-an-array',
    })
    expect(r.score).toBeGreaterThanOrEqual(0)
    expect(r.score).toBeLessThanOrEqual(100)
  })

  it('a KEV listing with ransomware dominates the score', () => {
    const plain = calculateRiskAssessment({ ...BASE, best_cvss: { score: 5, severity: 'Medium' } })
    const kev = calculateRiskAssessment({
      ...BASE,
      best_cvss: { score: 5, severity: 'Medium' },
      kev: { known_ransomware_campaign_use: true, date_added: '2024-01-01' },
    })
    expect(kev.score).toBeGreaterThan(plain.score)
    expect(kev.priority).toBe('P3') // CVSS 5 (12.5) + KEV (25) = 38 → Medium threshold
    expect(kev.reasons.some(x => x.includes('ransomware'))).toBe(true)
  })

  it('very high EPSS pushes the score up meaningfully', () => {
    const low = calculateRiskAssessment({ ...BASE, epss: { score: 0.01 } })
    const high = calculateRiskAssessment({ ...BASE, epss: { score: 0.95 } })
    expect(high.score - low.score).toBeGreaterThanOrEqual(15)
  })

  it('EPSS trend delta is surfaced in signals and reasons', () => {
    const r = calculateRiskAssessment({
      ...BASE,
      epss: { score: 0.5, previous_score: 0.3 },
    })
    expect(r.trends.epss_delta).toBeCloseTo(0.2)
    expect(r.reasons.some(x => x.includes('upward'))).toBe(true)
  })

  it('weight overrides are respected and normalized', () => {
    const r = calculateRiskAssessment(
      { ...BASE, kev: { date_added: '2024-01-01' } },
      { kev: 100, cvss: 0, epss: 0, exploit: 0, temporal: 0 }
    )
    const kevSignal = r.signals.find(s => s.name === 'kev')
    expect(kevSignal.max).toBe(100)
    expect(kevSignal.value).toBe(100)
  })

  it('all-zero weights fall back to defaults instead of dividing by zero', () => {
    const r = calculateRiskAssessment(BASE, { cvss: 0, epss: 0, kev: 0, exploit: 0, temporal: 0 })
    expect(r.signals).toHaveLength(5)
    expect(r.signals.reduce((a, s) => a + s.max, 0)).toBe(100)
  })

  it('score is always clamped to 0-100 integer', () => {
    const r = calculateRiskAssessment({
      ...BASE,
      best_cvss: { score: 10, severity: 'Critical' },
      epss: { score: 1 },
      kev: { date_added: '2024-06-01' },
      exploits: [{ stars: 5000 }],
      published_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    })
    expect(Number.isInteger(r.score)).toBe(true)
    expect(r.score).toBeLessThanOrEqual(100)
    expect(r.priority).toBe('P1')
  })
})
