import express from 'express'
import cors from 'cors'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json({ limit: '50mb' }))

// Constants
const HARD_EXACT_BUILD = 1_000_000
const UNIVERSE_TICKET_CAP = 100_000

// Queue for proof verification jobs
const proofQueue = new Map()
let jobIdCounter = 0

/**
 * Helper: Calculate binomial coefficient
 */
function nCk(n, k) {
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
 */
function kCombinations(values, k) {
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
 * Calculate Schönheim lower bound
 */
function schoenheimLB(n, k, m) {
  let val = 1
  for (let i = 0; i < m; i += 1) {
    val = Math.ceil(val * ((n - i) / (k - i)))
  }
  return val
}

/**
 * Linear congruential generator
 */
function makeLCG(seed) {
  let state = BigInt((seed >>> 0) || (Date.now() % 2147483647))
  if (state === 0n) state = 1n
  return () => {
    state = (48271n * state) % 2147483647n
    return Number(state) / 2147483647
  }
}

/**
 * Hash a string to a 32-bit integer seed
 */
function hashSeed(s) {
  if (!s) return Math.floor(Math.random() * 2 ** 31)
  let h = 2166136261 >>> 0
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/**
 * Serialize an array to a string key
 */
function serialize(a) {
  return a.join('-')
}

/**
 * Check if a ticket satisfies group constraints
 */
function checkGroupConstraints(ticket, constraints) {
  if (!constraints || constraints.length === 0) return true
  
  for (const group of constraints) {
    // Skip empty groups or no-op constraints
    if (!group.numbers || group.numbers.length === 0) continue

    let count = 0
    for (const num of ticket) {
      if (group.numbers.includes(num)) {
        count++
      }
    }

    if (count < group.min || count > group.max) {
      return false
    }
  }
  return true
}

/**
 * Calculate statistics for wheel generation
 */
function calculateWheelStats(n, k, m) {
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

/**
 * Generate a greedy lottery wheel
 */
/**
 * Helper: Check if a tuple (m-subset) can possibly be part of a valid k-ticket under constraints
 * Returns true if coverable, false otherwise.
 */
function checkTupleConstraints(tuple, activeGroups, k) {
  let requiredSlots = 0
  let totalSlack = 0
  
  for (const g of activeGroups) {
    // Check if tuple violates max constraint immediately
    const count = tuple.reduce((sum, n) => g.nums.includes(n) ? sum + 1 : sum, 0)
    if (count > g.max) return false

    // Calculate how many MORE numbers this group MUST provide to meet min
    const needed = Math.max(0, g.min - count)
    requiredSlots += needed

    // Calculate how many MORE numbers this group COULD provide (slack)
    const slack = g.max - Math.max(count, g.min)
    totalSlack += slack
  }

  // Total spots used by tuple + spots REQUIRED by constraints
  const totalRequired = tuple.length + requiredSlots
  
  // If we need more spots than k, it's impossible
  if (totalRequired > k) return false
  
  // Remaining free spots to fill up to k
  const toFill = k - totalRequired
  
  // If we have less slack (optional spots) than needed to fill the ticket, it's impossible
  if (toFill > totalSlack) return false
  
  return true
}

/**
 * Generate a greedy lottery wheel with Group Constraints
 */
function greedyWheel(pool, k, m, effort, seed, limit = null, constraints = []) {
  const rand = makeLCG(hashSeed(seed))
  const n = pool.length
  
  // Determine if we strictly follow combinatorial logic
  const totalM = nCk(n, m)
  const exact = totalM <= HARD_EXACT_BUILD

  // --- LEGACY OPTIMIZED PATH (No Constraints) ---
  if (!constraints || constraints.length === 0) {
     const mPerTicket = nCk(k, m)
     
     // 1. Initialize Uncovered Tuples
     let uncovered = null
     let chooseIdx = null
     
     if (exact) {
         uncovered = new Set(kCombinations(pool, m).map(serialize))
     }
     
     chooseIdx = kCombinations(
       Array.from({ length: k }, (_, i) => i),
       m
     )
     
     const tickets = []
     const seen = new Set()
     let steps = 0
     const maxSteps = 200000 // Same limit
     
     // Fast Gain Helper
     const calcGain = (t) => {
         if (!exact || !uncovered) return mPerTicket
         let g = 0
         for (const idx of chooseIdx) {
             const sub = idx.map(i => t[i])
             if (uncovered.has(serialize(sub))) g += 1
         }
         return g
     }
     
     // Fast Random Helper
     const randomTicket = () => {
         const shuffled = [...pool]
         for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(rand() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
         }
         return shuffled.slice(0, k).sort((a, b) => a - b)
     }

     while (true) {
        if (limit != null && tickets.length >= limit) break
        if (exact && uncovered && uncovered.size === 0 && limit === null) break
        if (steps >= maxSteps) break
        steps++
        
        let best = null
        let bestGain = -1
        
        const effortValid = Math.max(10, effort)
        
        for (let i = 0; i < effortValid; i++) {
            const cand = randomTicket()
            const key = serialize(cand)
            if (seen.has(key)) continue
            
            const g = calcGain(cand)
            if (g > bestGain) {
                bestGain = g
                best = cand
                if (g === mPerTicket) break
            }
        }
        
        if (!best) {
            const fallback = randomTicket()
            const key = fallback ? serialize(fallback) : null
            if (fallback && !seen.has(key)) {
                best = fallback
            }
        }
        
        if (best) {
            tickets.push(best)
            seen.add(serialize(best))
            if (exact && uncovered) {
                 for (const idx of chooseIdx) {
                     const sub = idx.map(i => best[i])
                     uncovered.delete(serialize(sub))
                 }
            }
        } else {
            break 
        }
     }
     return { tickets }
  }
  // --- END LEGACY PATH ---

  // 1. Setup Groups for Variable Pool
  const poolSet = new Set(pool)
  const activeGroups = []
  const usedNumbers = new Set() 
  
  constraints.forEach(c => {
    // Intersect group numbers with Variable Pool
    const groupNums = c.numbers.filter(num => poolSet.has(num))
    
    if (groupNums.length > 0) {
      activeGroups.push({
        id: c.id,
        nums: groupNums,
        min: c.min,
        max: c.max
      })
      groupNums.forEach(n => usedNumbers.add(n))
    }
  })
  
  // create Remainder Group
  const remainderNums = pool.filter(n => !usedNumbers.has(n))
  if (remainderNums.length > 0) {
    activeGroups.push({
      id: 'remainder',
      nums: remainderNums,
      min: 0,
      max: remainderNums.length 
    })
  }
  
  // Validation: Check if any group requires more numbers than available in the pool
  for (const g of activeGroups) {
      if (g.min > g.nums.length) {
          throw new Error(`Group ${g.id} (Variable) requires min ${g.min} but only has ${g.nums.length} available numbers.`)
      }
  }

  // Check if constraints are valid
  const globalMin = activeGroups.reduce((sum, g) => sum + g.min, 0)
  const globalMax = activeGroups.reduce((sum, g) => sum + g.max, 0)

  if (globalMin > k) {
    const breakdown = activeGroups.map(g => `${g.id}:${g.min}`).join(', ')
    throw new Error(`Impossible constraints: Minimums sum to ${globalMin} (${breakdown}), but only ${k} spots available.`)
  }
  if (globalMax < k) {
    const breakdown = activeGroups.map(g => `${g.id}:${g.max}`).join(', ')
    throw new Error(`Impossible constraints: Maximums sum to ${globalMax} (${breakdown}), but need to fill ${k} spots.`)
  }

  // Helper to generate a random valid quota distribution
  function generateRandomQuotas() {
    const quotas = activeGroups.map(g => g.min)
    let currentSum = globalMin
    let attempt = 0
    
    while (currentSum < k && attempt < 1000) {
       attempt++
       const idx = Math.floor(rand() * activeGroups.length)
       const g = activeGroups[idx]
       
       if (quotas[idx] < g.max && quotas[idx] < g.nums.length) {
         quotas[idx]++
         currentSum++
       }
    }
    
    if (currentSum !== k) return null 
    return quotas
  }

  // Helper: Generate a random valid ticket
  function randomValidTicket() {
    const quotas = generateRandomQuotas()
    if (!quotas) return null
    
    let ticket = []
    
    for (let i = 0; i < activeGroups.length; i++) {
      const g = activeGroups[i]
      const count = quotas[i]
      if (count === 0) continue
      
      const picked = []
      const available = [...g.nums]
      
      for(let j=0; j<count; j++) {
         const pickIdx = Math.floor(rand() * available.length)
         picked.push(available[pickIdx])
         available[pickIdx] = available[available.length - 1]
         available.pop()
      }
      ticket = ticket.concat(picked)
    }
    
    return ticket.sort((a,b) => a-b)
  }

  // --- Coverage Strategy Logic ---
  // totalM and exact are already calculated at the top
 
  // User Feedback: Strict Combinatorial Coverage is preferred over "Lotto Design" optimization.
  // Users expect to see specific M-tuples covered if they are valid.
  // We strictly use Combinatorial Mode but with robust "Impossible Tuple" filtering (Slack Check).
  
  let uncovered = null
  let chooseIdx = null
  const mPerTicket = nCk(k, m)

  if (totalM <= HARD_EXACT_BUILD) {
     // Create M-Combinations target
     const allTuples = kCombinations(pool, m)
     // Filter out impossible tuples using robust slack check
     const validTuples = allTuples.filter(isTupleCoverable)
     uncovered = new Set(validTuples.map(serialize))
  }
  
  chooseIdx = kCombinations(
    Array.from({ length: k }, (_, i) => i),
    m
  )
  
  // Helper: Validity checker for tuples (Updated with Capacity/Slack Check)
  // Helper: Validity checker using the shared function
  function isTupleCoverable(tuple) {
    return checkTupleConstraints(tuple, activeGroups, k)
  }

  const tickets = []
  const seen = new Set()

  let steps = 0
  const maxSteps = 200000

  // GAIN FUNCTION (Combinatorial Only)
  function gain(t) {
      if (!exact) return mPerTicket
      if (!uncovered) return mPerTicket // Approximate mode fallback
      
      let g = 0
      for (const idx of chooseIdx) {
          const sub = idx.map((i) => t[i])
          if (uncovered.has(serialize(sub))) g += 1
      }
      return g
  }

  while (true) {
    if (limit != null && tickets.length >= limit) break
    if (uncovered && uncovered.size === 0 && limit === null) break // Coverage complete
    if (steps >= maxSteps) break
    steps += 1

    let best = null
    let bestGain = -1
    
    // Standard Greedy: Generate random valid tickets
    const effortValid = Math.max(10, effort) // Ensure minimum effort
    
    for (let i = 0; i < effortValid; i += 1) {
      const cand = randomValidTicket()
      if (!cand) continue
      
      const key = serialize(cand)
      if (seen.has(key)) continue

      const g = gain(cand)
      if (g > bestGain) {
        bestGain = g
        best = cand
        if (g === mPerTicket) break
      }
    }
    
    // Fallback if no candidate worked
    if (!best) {
       const fallback = randomValidTicket()
       if(fallback && !seen.has(serialize(fallback))) {
         best = fallback
       }
    }

    if (best) {
      tickets.push(best)
      seen.add(serialize(best))

      // Update Coverage (Combinatorial)
      if (exact && uncovered) {
          for (const idx of chooseIdx) {
            const sub = idx.map((i) => best[i])
            uncovered.delete(serialize(sub))
          }
      }
    } else {
      break
    }
  }

  return { tickets }
}

/**
 * Generate all possible tickets (universe mode) with Group Constraints
 */
function exactUniverseTickets(pool, k, constraints = []) {
  // If no constraints, legacy full universe
  if (!constraints || constraints.length === 0) {
    return kCombinations(pool, k)
  }

  // Same group setup as greedyWheel
  const poolSet = new Set(pool)
  const activeGroups = []
  const usedNumbers = new Set() 
  
  constraints.forEach(c => {
    const groupNums = c.numbers.filter(num => poolSet.has(num))
    if (groupNums.length > 0) {
      activeGroups.push({
        id: c.id,
        nums: new Set(groupNums), // Set for O(1) checking
        min: c.min,
        max: c.max
      })
      groupNums.forEach(n => usedNumbers.add(n))
    }
  })
  
  const remainderNums = pool.filter(n => !usedNumbers.has(n))
  
  const allTickets = kCombinations(pool, k)
  
  return allTickets.filter(ticket => {
    // Check every group constraint
    for (const g of activeGroups) {
      const count = ticket.reduce((sum, num) => g.nums.has(num) ? sum + 1 : sum, 0)
      if (count < g.min || count > g.max) return false
    }
    return true
  })
}

/**
 * Calculate coverage breakdown
 */
function calculateCoverageBreakdown(pool, tickets, k, minMatch = 2, constraints = []) {
  const breakdown = []

  // --- Prepare Constraints ---
  let activeGroups = []
  let hasConstraints = false
  
  if (constraints && constraints.length > 0) {
    const poolSet = new Set(pool)
    const usedNumbers = new Set()
    
    constraints.forEach(c => {
      const groupNums = c.numbers.filter(num => poolSet.has(num))
      if (groupNums.length > 0) {
        activeGroups.push({
          id: c.id,
          nums: groupNums,
          min: c.min,
          max: c.max
        })
        groupNums.forEach(n => usedNumbers.add(n))
      }
    })
    
    const remainderNums = pool.filter(n => !usedNumbers.has(n))
    if (remainderNums.length > 0) {
      activeGroups.push({
        id: 'remainder',
        nums: remainderNums,
        min: 0,
        max: remainderNums.length 
      })
    }
    hasConstraints = activeGroups.length > 0
  }
  // ---------------------------

  // For each match level from k down to minMatch
  for (let matchLevel = k; matchLevel >= minMatch; matchLevel--) {
    // Generate all possible scenarios where exactly matchLevel numbers from pool are drawn
    const poolSubsets = kCombinations(pool, matchLevel)

    let minWinningTickets = Infinity
    let validScenariosCount = 0

    // For each scenario, count how many tickets win
    for (const drawnFromPool of poolSubsets) {
       // If constraints are active, ignore scenarios that are impossible to draw
       if (hasConstraints) {
         // Use the shared STRICT checker.
         // This ensures that we only consider draws that could possibly be part of a valid winning ticket (size k).
         // If a draw implies a violation of Max/Min/Slack constraints when extended to size k, it's impossible.
         if (!checkTupleConstraints(drawnFromPool, activeGroups, k)) {
           continue
         }
       }
       
       validScenariosCount++

      let winningCount = 0

      for (const ticket of tickets) {
        // Count matches between ticket and drawn pool numbers
        const matches = ticket.filter(num => drawnFromPool.includes(num)).length
        if (matches === matchLevel) {
          winningCount++
        }
      }

      minWinningTickets = Math.min(minWinningTickets, winningCount)
    }
    
    // If no valid scenarios existed (edge case), don't report Infinity
    if (validScenariosCount === 0) minWinningTickets = 0

    breakdown.push({
      level: `${matchLevel}/${k}`,
      tickets: minWinningTickets === Infinity ? 0 : minWinningTickets,
    })
  }

  return breakdown
}

/**
 * Build binomial coefficient lookup table
 */
function buildBinom(n, m) {
  const B = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0))
  for (let i = 0; i <= n; i += 1) {
    B[i][0] = 1
    if (i <= m) B[i][i] = 1
  }
  for (let i = 1; i <= n; i += 1) {
    for (let j = 1; j <= Math.min(i - 1, m); j += 1) {
      B[i][j] = B[i - 1][j - 1] + B[i - 1][j]
    }
  }
  return B
}

/**
 * Create ranking function for m-subsets
 */
function makeRank(n, m, B) {
  return function rank(a) {
    let r = 0
    for (let i = 0; i < m; i += 1) {
      r += B[a[i] - 1][i + 1]
    }
    return r
  }
}

/**
 * Generate index combinations for extracting m-subsets from k-ticket
 */
function combIdx(k, m) {
  const res = []
  function rec(s, p, buf) {
    if (p === 0) {
      res.push(buf.slice())
      return
    }
    for (let i = s; i <= k - p; i += 1) {
      buf.push(i)
      rec(i + 1, p - 1, buf)
      buf.pop()
    }
  }
  rec(0, m, [])
  return res
}

/**
 * Generator for all m-combinations
 */
function* allComb(n, m) {
  const a = Array.from({ length: m }, (_, i) => i + 1)
  yield a.slice()
  while (true) {
    let i = m - 1
    while (i >= 0 && a[i] === n - m + i + 1) i -= 1
    if (i < 0) return
    a[i] += 1
    for (let j = i + 1; j < m; j += 1) {
      a[j] = a[j - 1] + 1
    }
    yield a.slice()
  }
}

/**
 * Verify coverage proof (background job)
 */
/**
 * Verify coverage proof (background job)
 */
async function verifyCoverage(jobId, pool, k, m, tickets, constraints = [], fixedNumbers = []) {
  const job = proofQueue.get(jobId)
  if (!job) return

  try {
    const n = pool.length
    
    // --- Setup Constraints for Verification ---
    let activeGroups = []
    let hasConstraints = false
    
    if (constraints && constraints.length > 0) {
      // ... (Constraint parsing logic same as before)
      const poolSet = new Set(pool)
      const usedNumbers = new Set()
      
      constraints.forEach(c => {
        const groupNums = c.numbers.filter(num => poolSet.has(num))
        if (groupNums.length > 0) {
          activeGroups.push({
            id: c.id,
            nums: groupNums,
            min: c.min,
            max: c.max
          })
          groupNums.forEach(n => usedNumbers.add(n))
        }
      })
      
       // create Remainder Group for completeness
       const remainderNums = pool.filter(n => !usedNumbers.has(n))
       if (remainderNums.length > 0) {
         activeGroups.push({
           id: 'remainder',
           nums: remainderNums,
           min: 0,
           max: remainderNums.length 
         })
       }
       hasConstraints = activeGroups.length > 0
    }
    // ------------------------------------------

    const total = nCk(n, m)
    const B = buildBinom(n, m)

    // Create a map from actual numbers to indices
    const numToIdx = new Map()
    pool.forEach((num, idx) => numToIdx.set(num, idx))
    
    // Fixed Number check optimization
    const hasFixed = fixedNumbers && fixedNumbers.length > 0
    const fixedSet = hasFixed ? new Set(fixedNumbers) : null

    // Rank function that works with 0-indexed positions
    function rankIndices(indices) {
      let r = 0
      for (let i = 0; i < m; i += 1) {
        r += B[indices[i]][i + 1]
      }
      return r
    }

    const covered = new Uint8Array(total)
    const idx = combIdx(k, m)

    // Mark all covered m-subsets
    for (const t of tickets) {
      for (const id of idx) {
        // Extract m numbers from k-ticket, convert to indices, then rank
        const subNumbers = id.map((i) => t[i]).sort((a, b) => a - b)
        const subIndices = subNumbers.map((num) => numToIdx.get(num))
        covered[rankIndices(subIndices)] = 1
      }
    }

    // Check for uncovered m-subsets
    let uncoveredCount = 0
    let totalCoverable = 0 // Track actually coverable tuples
    const samples = []
    let done = 0
    const step = 50000

    for (const comb of allComb(n, m)) {
      const currentTuple = comb.map((idx) => pool[idx - 1])
      
      // 1. Fixed Numbers Check: The tuple MUST contain all fixed numbers to be relevant
      if (hasFixed) {
        let containsAllFixed = true
        for (const fn of fixedNumbers) {
           if (!currentTuple.includes(fn)) {
             containsAllFixed = false
             break
           }
        }
        // If tuple doesn't have the fixed numbers, we don't care about covering it
        // (Because the user scenario assumes fixed numbers ARE drawn)
        if (!containsAllFixed) {
           done++
           continue
        }
      }
      
      // 2. Constraint Check: If tuple is impossible, skip it (don't count as uncovered)
      if (hasConstraints && !checkTupleConstraints(currentTuple, activeGroups, k)) {
        done += 1
         // Update progress
        if (done % step === 0) {
          job.progress = done
          job.total = total
          job.status = 'processing'
          await new Promise((resolve) => setImmediate(resolve))
        }
        continue
      }
      
      totalCoverable++ // It's a valid tuple, so it SHOULD be covered

      const r = rankIndices(comb.map((x) => x - 1)) // allComb generates 1-indexed, need 0-indexed
      if (covered[r] !== 1) {
        uncoveredCount += 1
        if (samples.length < 50) {
          // Convert back to actual numbers for display
          samples.push(currentTuple)
        }
      }
      done += 1

      // Update progress
      if (done % step === 0) {
        job.progress = done
        job.total = total
        job.status = 'processing'
        await new Promise((resolve) => setImmediate(resolve))
      }
    }

    // Complete job
    job.status = 'completed'
    job.progress = total
    job.total = total
    job.result = {
      pass: uncoveredCount === 0,
      uncoveredCount,
      samples,
      total: totalCoverable, // Report coverable total instead of raw total
      rawTotal: total
    }
  } catch (error) {
    job.status = 'error'
    job.error = error.message
  }
}

// API: Generate tickets
app.post('/api/generate-tickets', async (req, res) => {
  const { pool: rawPool, k, guarantee, effort, seed, scanCount, mode, fixedNumbers: rawFixed = [], groupConstraints = [] } = req.body

  console.log('Received generation request:', { poolSize: rawPool?.length, k, guarantee, mode, fixedNumbers: rawFixed })

  if (!rawPool || !k || !guarantee || !effort || !mode) {
    console.log('Missing parameters')
    return res.status(400).json({ error: 'Missing required parameters' })
  }
  
  // Enforce sorting
  const pool = [...rawPool].sort((a, b) => a - b)
  const fixedNumbers = [...rawFixed].sort((a, b) => a - b)

  try {
    // 1. Validate fixed numbers
    if (fixedNumbers.length > 0) {
      // Check if all fixed numbers are in the pool
      const poolSet = new Set(pool)
      const invalidFixed = fixedNumbers.filter(n => !poolSet.has(n))
      if (invalidFixed.length > 0) {
        return res.status(400).json({ error: `Fixed numbers [${invalidFixed.join(', ')}] are not in the selected pool` })
      }
        
        // Check if too many fixed numbers
        if (fixedNumbers.length >= k) {
           return res.status(400).json({ error: `Cannot fix ${fixedNumbers.length} numbers for a pick-${k} game. Max fixed is ${k-1}.` })
        }
      }

      // 2. Prepare variable pool and k
      const fixedSet = new Set(fixedNumbers)
      const variablePool = pool.filter(n => !fixedSet.has(n))
      const variableK = k - fixedNumbers.length
      
      const n = variablePool.length
      // Guarantee applies to the variable part? 
      // User requirement: "fix certain numbers". Usually this means:
      // If I fix 1 number in a Pick 6 game, I need to generate Pick 5 tickets from the remaining pool.
      // The guarantee "3 if 3" usually implies "3 if 3 matches in the variable part".
      // Let's stick to the plan: generate wheels for variablePool with variableK.
      const m = guarantee 
      
      // Adjust m if it's larger than variableK (can happen if fixed numbers are many)
      // e.g. Pick 6, Fix 4, variableK=2. If guarantee=3, it's impossible.
      if (m > variableK) {
         return res.status(400).json({ 
           error: `Guarantee ${m} is too high for the remaining ${variableK} spots (Fixed: ${fixedNumbers.length}). Max guarantee is ${variableK}.` 
         })
      }

      let tickets = []

      // Validate variable pool size
      if (n < variableK) {
        return res.status(400).json({ error: `Remaining pool size (${n}) is too small for ${variableK} spots` })
      }
      
      // 4. Prepare Group Constraints for Variable Part
      // Calculate how many fixed numbers are in each group, and adjust Min/Max accordingly
      const variableConstraints = []
      
      if (groupConstraints && groupConstraints.length > 0) {
         for(const g of groupConstraints) {
             // Skip empty or disabled groups
             if (!g.numbers || g.numbers.length === 0) continue
             if (g.min === 0 && g.max >= g.numbers.length && g.max >= k) { 
                 // Effectively no constraint, but let's keep it safe
             }
             
             // Count fixed numbers in this group
             const fixedInGroup = fixedNumbers.filter(f => g.numbers.includes(f)).length
             
             // Adjust Min/Max for variable pool
             const newMin = Math.max(0, g.min - fixedInGroup)
             const newMax = g.max - fixedInGroup
             
             // Check if Min exceeds remaining available numbers
             const availableInGroup = g.numbers.length - fixedInGroup
             if (newMin > availableInGroup) {
                return res.status(400).json({ 
                  error: `Group ${g.id} requires min ${g.min} numbers, but only ${availableInGroup} remain after selecting fixed numbers.` 
                })
             }

             if (fixedInGroup > g.max) {
                return res.status(400).json({ 
                  error: `Group ${g.id} allows max ${g.max} numbers, but you have fixed ${fixedInGroup} numbers from it.` 
                })
             }
             
             variableConstraints.push({
               ...g,
               min: newMin,
               max: newMax
               // We don't filter numbers here because greedyWheel does it using the variable pool set
             })
         }
      }

      // Generate tickets based on mode using VARIABLE parameters
      if (mode === 'universe') {
        const tot = nCk(n, variableK)
        if (tot > UNIVERSE_TICKET_CAP) {
          return res.status(400).json({
            error: `Universe mode needs ${tot.toLocaleString()} tickets. Cap is ${UNIVERSE_TICKET_CAP.toLocaleString()}. Reduce pool size or choose another mode.`,
          })
        }
        tickets = exactUniverseTickets(variablePool, variableK, variableConstraints)
      } else if (mode === 'universe-m') {
        const tot = nCk(n, m)
        if (tot > UNIVERSE_TICKET_CAP) {
          return res.status(400).json({
            error: `Universe C(n,m) mode needs ${tot.toLocaleString()} combinations. Cap is ${UNIVERSE_TICKET_CAP.toLocaleString()}. Reduce pool size or choose another mode.`,
          })
        }
        tickets = exactUniverseTickets(variablePool, m, []) // No constraints for M-tuples for now
      } else {
        // greedy, scan, or lb mode
        let limit = null
        if (mode === 'scan') {
          limit = Math.max(1, scanCount)
        } else if (mode === 'lb') {
          const stats = calculateWheelStats(n, variableK, m)
          limit = stats.lowerBound
        }
        const result = greedyWheel(variablePool, variableK, m, effort, seed, limit, variableConstraints)
        tickets = result.tickets
      }

      // 3. Append fixed numbers to every ticket
    if (fixedNumbers.length > 0) {
      tickets = tickets.map(t => [...t, ...fixedNumbers].sort((a, b) => a - b))
    }

    // Calculate coverage breakdown
    // If fixed numbers are used, we calculate coverage on the VARIABLE part, 
    // assuming fixed numbers are always drawn (bankers).
    // Then we map the variable match levels to total match levels.
    let coverageBreakdown = []
    
    if (fixedNumbers.length > 0) {
       // Calculate coverage on variable pool using variable tickets (before appending fixed)
       // We need to reconstruct variable tickets since we already appended fixed numbers
       const varTickets = tickets.map(t => t.filter(n => !fixedSet.has(n)))
       // Use minMatch=1 for variable part so we can show "fixed+1 if fixed+1"
       // We pass variableConstraints here because these are the constraints applied to the VARIABLE pool
       const varBreakdown = calculateCoverageBreakdown(variablePool, varTickets, variableK, 1, variableConstraints)
       
       // Remap levels: e.g. 3/3 (var) -> 4/4 (total) if fixed=1
       coverageBreakdown = varBreakdown.map(item => {
         const [match, total] = item.level.split('/').map(Number)
         return {
           level: `${match + fixedNumbers.length}/${total + fixedNumbers.length}`,
           tickets: item.tickets
         }
       })
    } else {
       coverageBreakdown = calculateCoverageBreakdown(pool, tickets, k, 2, groupConstraints)
    }

    res.json({
      tickets,
      coverageBreakdown,
      stats: {
        ticketCount: tickets.length,
      },
    })
  } catch (error) {
    console.error('Error generating tickets:', error)
    res.status(500).json({ error: error.message })
  }
})

// API: Calculate statistics
app.post('/api/calculate-stats', (req, res) => {
  const { poolSize, k, guarantee } = req.body

  if (!poolSize || !k || !guarantee) {
    return res.status(400).json({ error: 'Missing required parameters' })
  }

  try {
    const stats = calculateWheelStats(poolSize, k, guarantee)
    res.json(stats)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// API: Submit proof verification job
app.post('/api/verify-proof', async (req, res) => {
  const { pool: rawPool, k, m, tickets, groupConstraints, fixedNumbers: rawFixed = [] } = req.body

  if (!rawPool || !k || !m || !tickets) {
    return res.status(400).json({ error: 'Missing required parameters' })
  }
  
  // Enforce sorting
  const pool = [...rawPool].sort((a, b) => a - b)
  const fixedNumbers = [...rawFixed].sort((a, b) => a - b)

  const jobId = `job_${jobIdCounter++}`
  proofQueue.set(jobId, {
    jobId,
    status: 'queued',
    progress: 0,
    total: 0,
    result: null,
    error: null,
    createdAt: Date.now(),
  })

  // Start processing in background
  verifyCoverage(jobId, pool, k, m, tickets, groupConstraints, fixedNumbers)

  res.json({ jobId })
})

// API: Get proof verification status
app.get('/api/verify-proof/:jobId', (req, res) => {
  const { jobId } = req.params
  const job = proofQueue.get(jobId)

  if (!job) {
    return res.status(404).json({ error: 'Job not found' })
  }

  res.json(job)
})

// API: Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', queueSize: proofQueue.size })
})

// Clean up old jobs (older than 1 hour)
setInterval(() => {
  const now = Date.now()
  const oneHour = 60 * 60 * 1000
  for (const [jobId, job] of proofQueue.entries()) {
    if (now - job.createdAt > oneHour) {
      proofQueue.delete(jobId)
    }
  }
}, 5 * 60 * 1000) // Run every 5 minutes

// Export the Express app
export default app
