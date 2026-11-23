import { describe, it, expect } from 'vitest'
import { parseVector } from '../src/utils/vectorParser'

describe('parseVector', () => {
  it('parses a CVSS 3.1 vector (Log4Shell)', () => {
    const r = parseVector('CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H')
    expect(r.version).toBe('3.1')
    expect(r.metrics).toHaveLength(8)
    const av = r.metrics.find(m => m.key === 'AV')
    expect(av.valueLabel).toBe('Network')
    expect(av.name).toBe('Attack Vector')
    const s = r.metrics.find(m => m.key === 'S')
    expect(s.valueLabel).toBe('Unchanged')
  })

  it('parses a CVSS 4.0 vector with 4.0-only metrics', () => {
    const r = parseVector('CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:H/VI:H/VA:H/SC:N/SI:N/SA:N')
    expect(r.version).toBe('4.0')
    const at = r.metrics.find(m => m.key === 'AT')
    expect(at.valueLabel).toBe('None')
    const vc = r.metrics.find(m => m.key === 'VC')
    expect(vc.name).toContain('Confidentiality')
    expect(vc.valueLabel).toBe('High')
  })

  it('explains supplemental metrics when present', () => {
    const r = parseVector('CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H/E:P')
    const e = r.metrics.find(m => m.key === 'E')
    expect(e.valueLabel).toBe('Proof-of-Concept')
  })

  it('falls back to the raw value for unknown metrics', () => {
    const r = parseVector('CVSS:3.1/AV:N/ZZ:Q')
    const zz = r.metrics.find(m => m.key === 'ZZ')
    expect(zz.valueLabel).toBe('Q')
    expect(zz.name).toBe('ZZ')
  })

  it('returns null for garbage input', () => {
    expect(parseVector(null)).toBeNull()
    expect(parseVector('')).toBeNull()
    expect(parseVector('not a vector')).toBeNull()
    expect(parseVector('CVSS:3.1')).toBeNull() // header only, no metrics
  })
})
