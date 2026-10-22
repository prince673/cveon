import { describe, it, expect } from 'vitest'
import { runWithConcurrency } from '../src/services/api'

/**
 * Worker factory that records peak parallelism: how many tasks were running
 * at the same instant at most.
 */
function makeCountingWorker() {
  let active = 0
  let peak = 0
  const worker = () =>
    new Promise(resolve => {
      active += 1
      peak = Math.max(peak, active)
      setTimeout(() => {
        active -= 1
        resolve()
      }, 5)
    })
  return { worker, getPeak: () => peak }
}

describe('runWithConcurrency', () => {
  it('never exceeds the concurrency limit', async () => {
    const { worker, getPeak } = makeCountingWorker()
    await runWithConcurrency(Array.from({ length: 12 }, (_, i) => i), 4, worker)
    expect(getPeak()).toBeLessThanOrEqual(4)
  })

  it('preserves input order in results', async () => {
    const items = ['a', 'b', 'c', 'd', 'e']
    const results = await runWithConcurrency(items, 2, async v => {
      // later items resolve faster — order must still hold
      const delay = (items.length - items.indexOf(v)) * 10
      await new Promise(r => setTimeout(r, delay))
      return v.toUpperCase()
    })
    expect(results.map(r => r.value)).toEqual(['A', 'B', 'C', 'D', 'E'])
    expect(results.every(r => r.status === 'fulfilled')).toBe(true)
  })

  it('captures individual failures without breaking the pool', async () => {
    const items = ['ok-1', 'bad', 'ok-2']
    const results = await runWithConcurrency(
      items,
      1,
      async v => {
        if (v === 'bad') throw new Error(`boom:${v}`)
        return v
      }
    )
    expect(results[0]).toEqual({ status: 'fulfilled', value: 'ok-1' })
    expect(results[1].status).toBe('rejected')
    expect(results[1].reason).toBeInstanceOf(Error)
    expect(results[1].reason.message).toBe('boom:bad')
    expect(results[2]).toEqual({ status: 'fulfilled', value: 'ok-2' })
  })

  it('continues pulling work after a failure drains the queue', async () => {
    const results = await runWithConcurrency(
      [1, 2, 3, 4, 5],
      2,
      async v => { if (v % 2 === 0) throw new Error(`skip ${v}`); return v }
    )
    expect(results.map(r => r.value ?? null)).toEqual([1, null, 3, null, 5])
  })

  it('handles empty input', async () => {
    const results = await runWithConcurrency([], 4, async () => {})
    expect(results).toEqual([])
  })
})
