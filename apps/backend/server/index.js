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
function greedyWheel(pool, k, m, effort, seed, limit = null) {
  const rand = makeLCG(hashSeed(seed))
  const n = pool.length
  const totalM = nCk(n, m)
  const exact = totalM <= HARD_EXACT_BUILD

  let uncovered = null
  const chooseIdx = kCombinations(
    Array.from({ length: k }, (_, i) => i),
    m
  )

  if (exact) {
    uncovered = new Set(kCombinations(pool, m).map(serialize))
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

  function randomKTicketFromPool(rand) {
    const indices = new Set()
    while (indices.size < k) {
      indices.add(Math.floor(rand() * n))
    }
    return Array.from(indices)
      .sort((a, b) => a - b)
      .map((i) => pool[i])
  }

  while (true) {
    if (limit != null && tickets.length >= limit) break
    if (exact && uncovered.size === 0 && limit === null) break
    if (steps >= maxSteps) break
    steps += 1

    let best = null
    let bestGain = -1

    for (let i = 0; i < effort; i += 1) {
      const cand = randomKTicketFromPool(rand)
      const key = serialize(cand)
      if (seen.has(key)) continue

      const g = gain(cand)
      if (g > bestGain) {
        bestGain = g
        best = cand
        if (g === mPerTicket) break
      }
    }

    if (!best) best = randomKTicketFromPool(rand)

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
 */
function exactUniverseTickets(pool, k) {
  return kCombinations(pool, k)
}

/**
 * Calculate coverage breakdown
 */
function calculateCoverageBreakdown(pool, tickets, k) {
  const breakdown = []

  // For each match level from k down to 2
  for (let matchLevel = k; matchLevel >= 2; matchLevel--) {
    // Generate all possible scenarios where exactly matchLevel numbers from pool are drawn
    const poolSubsets = kCombinations(pool, matchLevel)

    let minWinningTickets = Infinity

    // For each scenario, count how many tickets win
    for (const drawnFromPool of poolSubsets) {
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
async function verifyCoverage(jobId, pool, k, m, tickets) {
  const job = proofQueue.get(jobId)
  if (!job) return

  try {
    const n = pool.length
    const total = nCk(n, m)
    const B = buildBinom(n, m)

    // Create a map from actual numbers to indices
    const numToIdx = new Map()
    pool.forEach((num, idx) => numToIdx.set(num, idx))

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
    const samples = []
    let done = 0
    const step = 50000

    for (const comb of allComb(n, m)) {
      const r = rankIndices(comb.map((x) => x - 1)) // allComb generates 1-indexed, need 0-indexed
      if (covered[r] !== 1) {
        uncoveredCount += 1
        if (samples.length < 50) {
          // Convert back to actual numbers for display
          samples.push(comb.map((idx) => pool[idx - 1]))
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
      total,
    }
  } catch (error) {
    job.status = 'error'
    job.error = error.message
  }
}

// API: Generate tickets
app.post('/api/generate-tickets', async (req, res) => {
  const { pool, k, guarantee, effort, seed, scanCount, mode } = req.body

  if (!pool || !k || !guarantee || !effort || !mode) {
    return res.status(400).json({ error: 'Missing required parameters' })
  }

  try {
    const n = pool.length
    const m = guarantee
    let tickets = []

    // Validate pool size
    if (n < k) {
      return res.status(400).json({ error: `Pool must have at least ${k} numbers` })
    }

    // Generate tickets based on mode
    if (mode === 'universe') {
      const tot = nCk(n, k)
      if (tot > UNIVERSE_TICKET_CAP) {
        return res.status(400).json({
          error: `Universe mode needs ${tot.toLocaleString()} tickets. Cap is ${UNIVERSE_TICKET_CAP.toLocaleString()}. Reduce pool size or choose another mode.`,
        })
      }
      tickets = exactUniverseTickets(pool, k)
    } else if (mode === 'universe-m') {
      const tot = nCk(n, m)
      if (tot > UNIVERSE_TICKET_CAP) {
        return res.status(400).json({
          error: `Universe C(n,m) mode needs ${tot.toLocaleString()} combinations. Cap is ${UNIVERSE_TICKET_CAP.toLocaleString()}. Reduce pool size or choose another mode.`,
        })
      }
      tickets = exactUniverseTickets(pool, m)
    } else {
      // greedy, scan, or lb mode
      let limit = null
      if (mode === 'scan') {
        limit = Math.max(1, scanCount)
      } else if (mode === 'lb') {
        const stats = calculateWheelStats(n, k, m)
        limit = stats.lowerBound
      }
      const result = greedyWheel(pool, k, m, effort, seed, limit)
      tickets = result.tickets
    }

    // Calculate coverage breakdown
    const coverageBreakdown = calculateCoverageBreakdown(pool, tickets, k)

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
  const { pool, k, m, tickets } = req.body

  if (!pool || !k || !m || !tickets) {
    return res.status(400).json({ error: 'Missing required parameters' })
  }

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
  verifyCoverage(jobId, pool, k, m, tickets)

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

app.listen(PORT, () => {
  console.log(`🚀 Wheel Builder Server running on http://localhost:${PORT}`)
})
