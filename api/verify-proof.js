// In-memory store for job queue (shared across function invocations in same instance)
const proofQueue = global.proofQueue || new Map()
global.proofQueue = proofQueue

let jobIdCounter = global.jobIdCounter || 0

/**
 * Helper: Calculate binomial coefficient
 */
function C(n, k) {
  if (k < 0 || k > n) return 0
  k = Math.min(k, n - k)
  let num = 1
  let den = 1
  for (let i = 1; i <= k; i += 1) {
    num *= n - k + i
    den *= i
  }
  return Math.round(num / den)
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
    const total = C(n, m)
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

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  // POST /api/verify-proof - Submit job
  if (req.method === 'POST') {
    const { pool, k, m, tickets } = req.body

    if (!pool || !k || !m || !tickets) {
      return res.status(400).json({ error: 'Missing required parameters' })
    }

    const jobId = `job_${jobIdCounter++}`
    global.jobIdCounter = jobIdCounter

    proofQueue.set(jobId, {
      jobId,
      status: 'queued',
      progress: 0,
      total: 0,
      result: null,
      error: null,
      createdAt: Date.now(),
    })

    // Start processing in background (non-blocking)
    verifyCoverage(jobId, pool, k, m, tickets)

    return res.json({ jobId })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
