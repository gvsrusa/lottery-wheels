/**
 * Calculate binomial coefficient n choose k
 * @param {number} n - Total number of items
 * @param {number} k - Number of items to choose
 * @returns {number} - Number of combinations
 */
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

/**
 * Generate all k-combinations from an array of values
 * @param {Array} values - Array of values to generate combinations from
 * @param {number} k - Size of each combination
 * @returns {Array<Array>} - Array of all k-combinations
 */
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
