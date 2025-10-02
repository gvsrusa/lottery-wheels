// Access the shared job queue
const proofQueue = global.proofQueue || new Map()

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  // GET /api/verify-proof/[jobId] - Get job status
  if (req.method === 'GET') {
    const { jobId } = req.query
    const job = proofQueue.get(jobId)

    if (!job) {
      return res.status(404).json({ error: 'Job not found' })
    }

    return res.json(job)
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
