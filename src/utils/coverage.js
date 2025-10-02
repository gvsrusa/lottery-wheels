import { kCombinations } from './combinatorics'

/**
 * Greedy covering design algorithm to find minimum coverage
 * @param {Array<number>} pool - Pool of numbers
 * @param {number} k - Size of combinations
 * @param {number} minMatches - Minimum number of matches required
 * @returns {Array<Array<number>>} - Array of selected combinations
 */
export function findMinimumCoverage(pool, k, minMatches) {
  // Generate all possible k-combinations from the pool
  const allCombinations = kCombinations(pool, k)

  // Generate all possible k-combinations that could be drawn from the pool
  const allPossibleDraws = allCombinations

  const selectedCombinations = []
  const uncoveredDraws = new Set(allPossibleDraws.map(draw => draw.join(',')))

  // Greedy algorithm: repeatedly pick the combination that covers the most uncovered draws
  while (uncoveredDraws.size > 0) {
    let bestCombo = null
    let bestCoverage = 0

    for (const combo of allCombinations) {
      let coverage = 0

      // Count how many uncovered draws this combo would cover
      for (const drawKey of uncoveredDraws) {
        const draw = drawKey.split(',').map(Number)
        const matches = combo.filter(num => draw.includes(num)).length

        if (matches >= minMatches) {
          coverage++
        }
      }

      if (coverage > bestCoverage) {
        bestCoverage = coverage
        bestCombo = combo
      }
    }

    if (bestCombo === null) {
      break
    }

    selectedCombinations.push(bestCombo)

    // Remove all draws covered by this combination
    const newUncovered = new Set()
    for (const drawKey of uncoveredDraws) {
      const draw = drawKey.split(',').map(Number)
      const matches = bestCombo.filter(num => draw.includes(num)).length

      if (matches < minMatches) {
        newUncovered.add(drawKey)
      }
    }

    uncoveredDraws.clear()
    newUncovered.forEach(key => uncoveredDraws.add(key))
  }

  return selectedCombinations
}

/**
 * Check if a set of combinations provides coverage for a given match level
 * @param {Array<Array<number>>} combinations - Array of combinations to check
 * @param {Array<number>} pool - Pool of numbers
 * @param {number} k - Size of combinations
 * @param {number} minMatches - Minimum number of matches required
 * @returns {boolean} - True if coverage is provided
 */
export function checkCoverageLevel(combinations, pool, k, minMatches) {
  const allPossibleDraws = kCombinations(pool, k)

  for (const draw of allPossibleDraws) {
    let hasCoverage = false

    for (const combo of combinations) {
      const matches = combo.filter(num => draw.includes(num)).length
      if (matches >= minMatches) {
        hasCoverage = true
        break
      }
    }

    if (!hasCoverage) {
      return false
    }
  }

  return true
}
