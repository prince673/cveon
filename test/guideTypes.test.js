import { describe, it, expect } from 'vitest'
import { GUIDE_TYPES } from '../src/data/guideTypes.js'
import GUIDES from '../src/data/guideTemplates.js'

/**
 * guideTypes.js is a small registry so UI panels can render guide coverage
 * without loading the 95KB template catalog. This suite guarantees the
 * registry and the catalog never drift apart.
 */
describe('guideTypes registry', () => {
  it('contains exactly the same keys as the guide templates catalog', () => {
    const registryKeys = GUIDE_TYPES.map(t => t.key).sort()
    const catalogKeys = Object.keys(GUIDES).sort()
    expect(registryKeys).toEqual(catalogKeys)
  })

  it('names every guide type exactly as the catalog does', () => {
    for (const { key, name } of GUIDE_TYPES) {
      expect(GUIDES[key]?.name).toBe(name)
    }
  })

  it('has no duplicate keys or empty names', () => {
    const keys = GUIDE_TYPES.map(t => t.key)
    expect(new Set(keys).size).toBe(keys.length)
    expect(GUIDE_TYPES.every(t => typeof t.name === 'string' && t.name.length > 0)).toBe(true)
  })
})
