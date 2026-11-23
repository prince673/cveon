import { describe, it, expect } from 'vitest'
import { parseCveList, resultsToCsv } from '../src/utils/csv'

describe('parseCveList', () => {
  it('extracts CVE IDs from CSV text', () => {
    expect(parseCveList('CVE-2021-44228,CVE-2017-0144\nsome noise'))
      .toEqual(['CVE-2021-44228', 'CVE-2017-0144'])
  })

  it('is case-insensitive and deduplicates', () => {
    expect(parseCveList('cve-2021-44228 CVE-2021-44228'))
      .toEqual(['CVE-2021-44228'])
  })

  it('returns empty for input without CVEs', () => {
    expect(parseCveList('')).toEqual([])
    expect(parseCveList(null)).toEqual([])
    expect(parseCveList('no ids here')).toEqual([])
  })

  it('accepts 4+ digit sequence numbers but not 3', () => {
    expect(parseCveList('CVE-2021-44228 CVE-2021-442')).toEqual(['CVE-2021-44228'])
  })
})

describe('resultsToCsv', () => {
  it('writes a header row and one row per result', () => {
    const csv = resultsToCsv([
      {
        cve_id: 'CVE-2021-44228',
        best_cvss: { score: 10, version: '3.1', severity: 'Critical' },
        epss: { score: 0.97, percentile: 0.99 },
        kev: { known_ransomware_campaign_use: true },
        risk: { priority: 'P1', score: 95, level: 'Critical' },
        exploit_count: 3,
        description: 'Apache Log4j2 JNDI, "remote code execution"',
      },
    ])
    const lines = csv.split('\r\n')
    expect(lines).toHaveLength(2)
    expect(lines[0]).toContain('cve_id')
    expect(lines[1]).toContain('CVE-2021-44228')
    expect(lines[1]).toContain('P1')
    // Quotes are escaped by doubling
    expect(lines[1]).toContain('"Apache Log4j2 JNDI, ""remote code execution"""')
  })

  it('handles empty and missing fields', () => {
    const csv = resultsToCsv([{ cve_id: 'CVE-2099-0001' }])
    const lines = csv.split('\r\n')
    expect(lines[1].startsWith('CVE-2099-0001,,')).toBe(true)
    expect(resultsToCsv([]).split('\r\n')).toHaveLength(1)
    expect(resultsToCsv(null).split('\r\n')).toHaveLength(1)
  })
})
