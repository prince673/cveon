import { describe, it, expect, beforeEach, vi } from 'vitest'

// Fresh module instance per test so the module-scope RAM state is isolated.
async function fresh() {
  vi.resetModules()
  return import('../src/utils/sessionMemory')
}

describe('sessionMemory (in-memory recents + pins)', () => {
  beforeEach(() => { vi.resetModules() })

  it('adds, dedupes and caps recent searches', async () => {
    const m = await fresh()
    m.addRecent('cve-2021-44228')          // normalized to uppercase
    m.addRecent('CVE-2021-44228')          // duplicate — moved to front, not repeated
    m.addRecent('CVE-2017-0144')
    expect(m.getRecents()).toEqual(['CVE-2017-0144', 'CVE-2021-44228'])
  })

  it('rejects invalid CVE IDs', async () => {
    const m = await fresh()
    m.addRecent('not-a-cve')
    m.togglePin('CVE-12-1')
    expect(m.getRecents()).toEqual([])
    expect(m.getPins()).toEqual([])
  })

  it('caps recents at the requested maximum', async () => {
    const m = await fresh()
    for (let i = 1; i <= 12; i++) m.addRecent(`CVE-2020-${String(i).padStart(4, '0')}`, 5)
    const recents = m.getRecents()
    expect(recents).toHaveLength(5)
    expect(recents[0]).toBe('CVE-2020-0012') // newest first
  })

  it('toggles pins and reports pinned state', async () => {
    const m = await fresh()
    expect(m.isPinned('CVE-2021-44228')).toBe(false)
    expect(m.togglePin('CVE-2021-44228')).toBe(true)
    expect(m.isPinned('CVE-2021-44228')).toBe(true)
    expect(m.togglePin('CVE-2021-44228')).toBe(false)
    expect(m.getPins()).toEqual([])
  })

  it('notifies subscribers on every mutation', async () => {
    const m = await fresh()
    const seen = []
    const unsubscribe = m.subscribeMemory(s => seen.push(s))
    m.addRecent('CVE-2021-44228')
    m.togglePin('CVE-2021-44228')
    expect(seen).toHaveLength(2)
    expect(seen[0].recents).toEqual(['CVE-2021-44228'])
    expect(seen[1].pins).toEqual(['CVE-2021-44228'])
    unsubscribe()
    m.addRecent('CVE-2017-0144')
    expect(seen).toHaveLength(2) // no events after unsubscribe
  })

  it('clearing works for both stores', async () => {
    const m = await fresh()
    m.addRecent('CVE-2021-44228')
    m.togglePin('CVE-2021-44228')
    m.clearRecents()
    m.clearPins()
    expect(m.getRecents()).toEqual([])
    expect(m.getPins()).toEqual([])
  })
})
