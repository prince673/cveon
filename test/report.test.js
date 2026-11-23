import { describe, it, expect } from 'vitest'
import { buildMarkdownSummary, buildJsonSummary } from '../src/utils/report'

const CVE = {
  cve_id: 'CVE-2021-44228',
  description: 'Apache Log4j2 JNDI features do not protect against attacker controlled LDAP endpoints.',
  published_date: '2021-12-10T00:00:00Z',
  cwes: ['CWE-917', 'CWE-502'],
  products: ['apache:log4j2'],
  references: ['https://nvd.nist.gov/vuln/detail/CVE-2021-44228'],
  best_cvss: { version: '3.1', score: 10, severity: 'Critical', vector_string: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H' },
  epss: { score: 0.97, percentile: 0.99 },
  kev: { due_date: '2021-12-21', known_ransomware_campaign_use: true },
  exploits: [{ url: 'https://github.com/x/y', name: 'poc', stars: 100 }],
  risk: { priority: 'P1', level: 'Critical', score: 95 },
}

describe('buildMarkdownSummary', () => {
  it('includes the ID, score, EPSS, KEV and risk lines', () => {
    const md = buildMarkdownSummary(CVE)
    expect(md).toContain('# CVE-2021-44228')
    expect(md).toContain('10/10 (Critical)')
    expect(md).toContain('**EPSS:** 97.00% (P99 percentile)')
    expect(md).toContain('**CISA KEV:** Listed')
    expect(md).toContain('ransomware')
    expect(md).toContain('**Risk priority:** P1')
  })

  it('lists weaknesses, products and references', () => {
    const md = buildMarkdownSummary(CVE)
    expect(md).toContain('- CWE-917')
    expect(md).toContain('- apache:log4j2')
    expect(md).toContain('https://nvd.nist.gov/vuln/detail/CVE-2021-44228')
  })

  it('degrades gracefully for sparse data', () => {
    const md = buildMarkdownSummary({ cve_id: 'CVE-2099-0001' })
    expect(md).toContain('# CVE-2099-0001')
    expect(md).toContain('**CISA KEV:** Not listed')
    expect(md).not.toContain('undefined')
  })

  it('returns empty string for empty input', () => {
    expect(buildMarkdownSummary(null)).toBe('')
    expect(buildMarkdownSummary({})).toBe('')
  })
})

describe('buildJsonSummary', () => {
  it('round-trips through JSON.parse', () => {
    const parsed = JSON.parse(buildJsonSummary(CVE))
    expect(parsed.cve_id).toBe('CVE-2021-44228')
    expect(parsed.best_cvss.score).toBe(10)
    expect(parsed.risk.priority).toBe('P1')
  })

  it('returns empty string for empty input', () => {
    expect(buildJsonSummary(null)).toBe('')
  })
})
