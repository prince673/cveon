import { describe, it, expect } from 'vitest'
import { buildGuide, classifyVulnerability, selectGuideKey, getAllGuideTypes } from '../src/utils/guideEngine'

const BASE = {
  cve_id: 'CVE-2021-44228',
  description: 'Apache Log4j2 JNDI remote code execution via attacker-controlled LDAP endpoints.',
  cwes: ['CWE-917'],
  products: ['apache:log4j2'],
  references: ['https://nvd.nist.gov/vuln/detail/CVE-2021-44228'],
  best_cvss: { version: '3.1', score: 10, severity: 'Critical', vector_string: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H' },
  cvss_scores: [{ version: '3.1', score: 10, severity: 'Critical' }],
  exploits: [{ url: 'https://github.com/x/y', name: 'poc', stars: 100 }],
  kev: { date_added: '2021-12-01' },
}

describe('guideEngine — edge cases', () => {
  it('builds a guide from full data without throwing', () => {
    const g = buildGuide(BASE)
    expect(g).toBeTruthy()
  })

  it('does not throw on minimal/empty data', () => {
    expect(() => buildGuide({ cve_id: 'CVE-2099-0001' })).not.toThrow()
    expect(() => buildGuide({})).not.toThrow()
    expect(() => buildGuide(null)).not.toThrow()
  })

  it('classifies some vulnerability type for arbitrary input', () => {
    const c = classifyVulnerability(BASE)
    expect(c).toBeTruthy()
    const empty = classifyVulnerability({ cve_id: 'CVE-2099-0001', description: '' })
    expect(empty).toBeTruthy()
  })

  it('selectGuideKey returns a usable key for sparse data', () => {
    expect(selectGuideKey({ cve_id: 'CVE-2099-0001' })).toBeTruthy()
  })

  it('getAllGuideTypes returns a non-empty catalog', () => {
    const types = getAllGuideTypes()
    expect(Array.isArray(types)).toBe(true)
    expect(types.length).toBeGreaterThan(0)
  })
})
