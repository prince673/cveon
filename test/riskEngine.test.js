import { describe, it, expect } from 'vitest'
import { calculateRiskAssessment } from '../src/utils/riskEngine'

describe('calculateRiskAssessment', () => {
  it('correctly assesses a critical vulnerability with KEV and exploit', () => {
    const cve = {
      cve_id: 'CVE-2021-44228',
      published_date: '2021-12-10T00:00:00Z',
      best_cvss: { score: 10.0, severity: 'Critical', version: '3.1' },
      epss: { score: 0.97, percentile: 0.99 },
      kev: { date_added: '2021-12-10', known_ransomware_campaign_use: true },
      exploits: [{ name: 'poc', stars: 1500, url: 'https://github.com/foo/bar' }],
    }

    const res = calculateRiskAssessment(cve)
    expect(res.score).toBeGreaterThanOrEqual(80)
    expect(res.priority).toBe('P1')
    expect(res.level).toBe('Critical')
    expect(res.reasons.length).toBeGreaterThan(0)
    expect(res.signals.length).toBe(5)
  })

  it('handles low-severity CVEs with no exploits or KEV', () => {
    const cve = {
      cve_id: 'CVE-2020-0001',
      published_date: '2020-01-01T00:00:00Z',
      best_cvss: { score: 2.1, severity: 'Low', version: '3.1' },
      epss: { score: 0.001, percentile: 0.05 },
      kev: null,
      exploits: [],
    }

    const res = calculateRiskAssessment(cve)
    expect(res.score).toBeLessThan(35)
    expect(res.priority).toBe('P4')
    expect(res.level).toBe('Low')
  })
})
