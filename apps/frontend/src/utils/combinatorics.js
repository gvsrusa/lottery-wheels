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

/**
 * Calculate Schönheim lower bound for covering designs
 * @param {number} n - Pool size
 * @param {number} k - Pick size
 * @param {number} m - Guarantee level
 * @returns {number} - Lower bound on number of tickets needed
 */
export function schoenheimLB(n, k, m) {
  let val = 1
  for (let i = 0; i < m; i += 1) {
    val = Math.ceil(val * ((n - i) / (k - i)))
  }
  return val
}

/**
 * Linear congruential generator for deterministic randomness
 * @param {number} seed - Initial seed value
 * @returns {Function} - Random number generator function
 */
export function makeLCG(seed) {
  let state = BigInt((seed >>> 0) || (Date.now() % 2147483647))
  if (state === 0n) state = 1n
  return () => {
    state = (48271n * state) % 2147483647n
    return Number(state) / 2147483647
  }
}

/**
 * Hash a string to a 32-bit integer seed
 * @param {string} s - String to hash
 * @returns {number} - 32-bit hash value
 */
export function hashSeed(s) {
  if (!s) return 42
  let h = 2166136261 >>> 0
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/**
 * Generate a random k-ticket from pool of n numbers
 * @param {number} n - Pool size
 * @param {number} k - Pick size
 * @param {Function} rand - Random number generator
 * @returns {Array<number>} - Sorted array of k unique numbers
 */
export function randomKTicket(n, k, rand) {
  const s = new Set()
  while (s.size < k) {
    s.add(1 + Math.floor(rand() * n))
  }
  return Array.from(s).sort((a, b) => a - b)
}

/**
 * Serialize an array to a string key
 * @param {Array} a - Array to serialize
 * @returns {string} - Serialized string
 */
export function serialize(a) {
  return a.join('-')
}
