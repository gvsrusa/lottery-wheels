import express from 'express'
import cors from 'cors'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json({ limit: '50mb' }))

// Queue for proof verification jobs
const proofQueue = new Map()
let jobIdCounter = 0

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
async function verifyCoverage(jobId, n, k, m, tickets) {
  const job = proofQueue.get(jobId)
  if (!job) return

  try {
    const total = C(n, m)
    const B = buildBinom(n, m)
    const rank = makeRank(n, m, B)
    const covered = new Uint8Array(total)
    const idx = combIdx(k, m)

    // Mark all covered m-subsets
    for (const t of tickets) {
      for (const id of idx) {
        const sub = id.map((i) => t[i]).sort((a, b) => a - b)
        covered[rank(sub)] = 1
      }
    }

    // Check for uncovered m-subsets
    let uncoveredCount = 0
    const samples = []
    let done = 0
    const step = 50000

    for (const comb of allComb(n, m)) {
      const r = rank(comb)
      if (covered[r] !== 1) {
        uncoveredCount += 1
        if (samples.length < 50) {
          samples.push(comb.slice())
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

// API: Submit proof verification job
app.post('/api/verify-proof', async (req, res) => {
  const { n, k, m, tickets } = req.body

  if (!n || !k || !m || !tickets) {
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
  verifyCoverage(jobId, n, k, m, tickets)

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
