import {
  nCk,
  kCombinations,
  schoenheimLB,
  makeLCG,
  hashSeed,
  randomKTicket,
  serialize,
} from './combinatorics'

const HARD_EXACT_BUILD = 1_000_000
const UNIVERSE_TICKET_CAP = 100_000

/**
 * Generate a greedy lottery wheel
 * @param {number} n - Pool size
 * @param {number} k - Pick size (numbers per ticket)
 * @param {number} m - Guarantee level (m of k guaranteed)
 * @param {number} effort - Search effort (iterations per ticket)
 * @param {string} seed - Optional seed for reproducibility
 * @param {number|null} limit - Maximum number of tickets (null for unlimited)
 * @returns {Object} - { tickets: Array<Array<number>> }
 */
export function greedyWheel(n, k, m, effort, seed, limit = null) {
  const rand = makeLCG(hashSeed(seed))
  const base = Array.from({ length: n }, (_, i) => i + 1)
  const totalM = nCk(n, m)
  const exact = totalM <= HARD_EXACT_BUILD

  let uncovered = null
  const chooseIdx = kCombinations(
    Array.from({ length: k }, (_, i) => i),
    m
  )

  if (exact) {
    uncovered = new Set(kCombinations(base, m).map(serialize))
  }

  const tickets = []
  const seen = new Set()
  const mPerTicket = nCk(k, m)

  let steps = 0
  const maxSteps = 200000

  function gain(t) {
    if (!exact) return mPerTicket
    let g = 0
    for (const idx of chooseIdx) {
      const sub = idx.map((i) => t[i])
      if (uncovered.has(serialize(sub))) g += 1
    }
    return g
  }

  while (true) {
    if (limit != null && tickets.length >= limit) break
    if (exact && uncovered.size === 0) break
    if (steps >= maxSteps) break
    steps += 1

    let best = null
    let bestGain = -1

    for (let i = 0; i < effort; i += 1) {
      const cand = randomKTicket(n, k, rand)
      const key = serialize(cand)
      if (seen.has(key)) continue

      const g = gain(cand)
      if (g > bestGain) {
        bestGain = g
        best = cand
        if (g === mPerTicket) break
      }
    }

    if (!best) best = randomKTicket(n, k, rand)

    tickets.push(best)
    seen.add(serialize(best))

    if (exact) {
      for (const idx of chooseIdx) {
        const sub = idx.map((i) => best[i])
        uncovered.delete(serialize(sub))
      }
    }
  }

  return { tickets }
}

/**
 * Generate all possible tickets (universe mode)
 * @param {number} n - Pool size
 * @param {number} k - Pick size
 * @returns {Array<Array<number>>} - All possible k-tickets
 */
export function exactUniverseTickets(n, k) {
  const base = Array.from({ length: n }, (_, i) => i + 1)
  return kCombinations(base, k)
}

/**
 * Calculate statistics for wheel generation
 * @param {number} n - Pool size
 * @param {number} k - Pick size
 * @param {number} m - Guarantee level
 * @returns {Object} - Statistics object
 */
export function calculateWheelStats(n, k, m) {
  const lbCount = Math.ceil(nCk(n, m) / nCk(k, m))
  const lbSch = schoenheimLB(n, k, m)
  const universeSize = nCk(n, m)
  const allTickets = nCk(n, k)

  return {
    lbCount,
    lbSch,
    lowerBound: Math.max(lbCount, lbSch),
    universeSize,
    allTickets,
  }
}

export { UNIVERSE_TICKET_CAP }
