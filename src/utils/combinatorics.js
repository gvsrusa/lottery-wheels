// Calculate n choose k (binomial coefficient)
export function nCk(n, k) {
  if (k < 0 || k > n) return 0
  const limit = Math.min(k, n - k)
  let numerator = 1
  let denominator = 1
  for (let i = 1; i <= limit; i += 1) {
    numerator *= n - limit + i
    denominator *= i
  }
  return numerator / denominator
}

// Generate all k-combinations from an array of values
export function kCombinations(values, k) {
  const result = []
  const stack = []

  function backtrack(start) {
    if (stack.length === k) {
      result.push([...stack])
      return
    }
    for (let i = start; i < values.length; i += 1) {
      stack.push(values[i])
      backtrack(i + 1)
      stack.pop()
    }
  }

  backtrack(0)
  return result
}

// Greedy covering algorithm - generates minimal set of k-combinations that cover all t-subsets
export function findMinimumCovering(pool, k, t) {
  // Generate all t-subsets from pool (these are what we want to cover)
  const targetSubsets = kCombinations(pool, t)
  const uncovered = new Set(targetSubsets.map(subset => subset.join(',')))

  // Generate all possible k-combinations from pool (these are our candidates)
  const allKCombinations = kCombinations(pool, k)

  // Pre-compute which t-subsets each k-combination covers
  const coverMap = new Map()
  for (const combo of allKCombinations) {
    const tSubsetsInCombo = kCombinations(combo, t)
    coverMap.set(combo.join(','), new Set(tSubsetsInCombo.map(s => s.join(','))))
  }

  const chosen = []

  // Greedy algorithm: repeatedly pick the combination that covers the most uncovered t-subsets
  while (uncovered.size > 0) {
    let bestCombo = null
    let bestGain = -1

    for (const combo of allKCombinations) {
      const comboKey = combo.join(',')
      const coverSet = coverMap.get(comboKey)

      let gain = 0
      for (const subsetKey of coverSet) {
        if (uncovered.has(subsetKey)) {
          gain++
        }
      }

      if (gain > bestGain) {
        bestGain = gain
        bestCombo = combo
      }
    }

    if (bestCombo === null || bestGain === 0) {
      break
    }

    chosen.push(bestCombo)

    // Remove all t-subsets covered by this combination
    const bestKey = bestCombo.join(',')
    const coverSet = coverMap.get(bestKey)
    for (const subsetKey of coverSet) {
      uncovered.delete(subsetKey)
    }
  }

  return chosen
}
