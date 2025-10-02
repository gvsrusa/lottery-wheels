import { useState, useMemo, useEffect } from 'react'
import { nCk } from '../utils/combinatorics'
import { calculateWheelStats } from '../utils/wheelBuilder'
import { toCSV } from '../utils/formatting'
import { LoadingOverlay } from './ui/LoadingOverlay'
import { StatCard } from './ui/StatCard'
import { NumberChip } from './ui/NumberChip'
import { PaginationControls } from './ui/PaginationControls'

const API_BASE_URL = import.meta.env.VITE_API_URL || ''

export function WheelBuilderTab({ gameConfig }) {
  const [selectedPool, setSelectedPool] = useState([])
  const [guarantee, setGuarantee] = useState(3)
  const [effort, setEffort] = useState(1200)
  const [seed, setSeed] = useState('')
  const [scanCount, setScanCount] = useState(50)
  const [tickets, setTickets] = useState([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('')
  const [proofStatus, setProofStatus] = useState(null)
  const [proofJobId, setProofJobId] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [ticketsPerPage, setTicketsPerPage] = useState(50)
  const [coverageBreakdown, setCoverageBreakdown] = useState(null)

  const k = gameConfig.mainNumbers.pick
  const maxN = gameConfig.mainNumbers.max

  // Number range for selection grid
  const NUMBER_RANGE = Array.from({ length: maxN }, (_, idx) => idx + 1)

  // Reset state when game changes
  useEffect(() => {
    setSelectedPool([])
    setTickets([])
    setIsGenerating(false)
    setLoadingMessage('')
    setProofStatus(null)
    setProofJobId(null)
    setCoverageBreakdown(null)
    setCurrentPage(1)
    setGuarantee(3)
    setSeed('')
  }, [gameConfig])

  // Toggle number selection
  const toggleNumber = (num) => {
    setSelectedPool((prev) =>
      prev.includes(num) ? prev.filter((n) => n !== num) : [...prev, num].sort((a, b) => a - b)
    )
  }

  // Clear all selections and reset state
  const clearPool = () => {
    setSelectedPool([])
    setTickets([])
    setIsGenerating(false)
    setLoadingMessage('')
    setProofStatus(null)
    setProofJobId(null)
    setCoverageBreakdown(null)
    setCurrentPage(1)
  }

  // Select all numbers
  const selectAll = () => setSelectedPool([...NUMBER_RANGE])

  // Quick select random pool
  const quickSelectRandom = (count) => {
    const shuffled = [...NUMBER_RANGE].sort(() => Math.random() - 0.5)
    setSelectedPool(shuffled.slice(0, count).sort((a, b) => a - b))
  }

  // Calculate statistics
  const stats = useMemo(() => {
    const n = selectedPool.length
    const m = guarantee
    if (n < k) {
      return {
        lbCount: 0,
        lbSch: 0,
        lowerBound: 0,
        universeSize: 0,
        allTickets: 0,
      }
    }
    return calculateWheelStats(n, k, m)
  }, [selectedPool, guarantee, k])

  // Paginated tickets
  const paginatedTickets = useMemo(() => {
    const startIdx = (currentPage - 1) * ticketsPerPage
    const endIdx = startIdx + ticketsPerPage
    return tickets.slice(startIdx, endIdx)
  }, [tickets, currentPage, ticketsPerPage])

  const totalPages = Math.ceil(tickets.length / ticketsPerPage)

  // Poll proof job status
  const pollProofStatus = async (jobId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/verify-proof/${jobId}`)
      const job = await response.json()

      setProofStatus(job)

      if (job.status === 'queued' || job.status === 'processing') {
        setTimeout(() => pollProofStatus(jobId), 1000)
      }
    } catch (error) {
      console.error('Error polling proof status:', error)
      setProofStatus({
        status: 'error',
        error: error.message,
      })
    }
  }

  // Submit proof verification job
  const verifyProof = async (pool, k, m, tickets) => {
    setProofStatus({ status: 'queued', progress: 0, total: 0 })

    try {
      const response = await fetch(`${API_BASE_URL}/api/verify-proof`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pool, k, m, tickets }),
      })

      const { jobId } = await response.json()
      setProofJobId(jobId)
      pollProofStatus(jobId)
    } catch (error) {
      console.error('Error submitting proof job:', error)
      setProofStatus({
        status: 'error',
        error: 'Failed to connect to server. Make sure to run: npm run dev:server',
      })
    }
  }

  // Generate tickets
  const handleGenerate = async (mode) => {
    const n = selectedPool.length
    const m = guarantee

    // Validation
    if (n < k) {
      alert(`Please select at least ${k} numbers for ${gameConfig.name}`)
      return
    }

    setIsGenerating(true)
    setLoadingMessage(`Generating ${mode} tickets...`)
    setProofStatus(null)
    setProofJobId(null)

    try {
      // Call backend API to generate tickets
      const response = await fetch(`${API_BASE_URL}/api/generate-tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pool: selectedPool,
          k,
          guarantee: m,
          effort,
          seed,
          scanCount,
          mode,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to generate tickets')
        setIsGenerating(false)
        return
      }

      const data = await response.json()

      setTickets(data.tickets)
      setCoverageBreakdown(data.coverageBreakdown)
      setCurrentPage(1) // Reset to first page

      setLoadingMessage('Verifying coverage proof...')

      // Submit proof verification to backend
      await verifyProof(selectedPool, k, m, data.tickets)
    } catch (error) {
      console.error('Error generating tickets:', error)
      alert(`Error: ${error.message}. Make sure to run: npm run dev:server`)
    } finally {
      setIsGenerating(false)
      setLoadingMessage('')
    }
  }

  // Download CSV
  const handleDownload = () => {
    if (tickets.length === 0) return

    const headers = ['ticket', ...Array.from({ length: k }, (_, i) => `n${i + 1}`)]
    const rows = tickets.map((t, i) => [i + 1, ...t])
    const csv = toCSV(headers, rows)

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${gameConfig.name.toLowerCase().replace(/\s+/g, '_')}_tickets_${tickets.length}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  // Copy to clipboard
  const handleCopy = async () => {
    if (tickets.length === 0) return

    const txt = tickets.map((t) => t.join(' ')).join('\n')
    try {
      await navigator.clipboard.writeText(txt)
      alert('Copied to clipboard!')
    } catch (error) {
      alert(`Copy failed: ${error.message}`)
    }
  }

  return (
    <main className="max-w-[1800px] mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Number Selection Card */}
      <section className="relative bg-slate-900/80 backdrop-blur-xl border-2 border-slate-800 rounded-3xl p-6 shadow-2xl">
        <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
          Select Your Number Pool
        </h2>
        <p className="text-slate-400 text-sm mb-4">
          Choose at least {k} numbers from 1-{maxN} for {gameConfig.name}. Selected: {selectedPool.length}
        </p>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => quickSelectRandom(10)}
            className="px-4 py-2 bg-slate-700 text-white text-sm font-bold rounded-xl hover:bg-slate-600 transition-all"
          >
            Quick: 10 Random
          </button>
          <button
            onClick={() => quickSelectRandom(15)}
            className="px-4 py-2 bg-slate-700 text-white text-sm font-bold rounded-xl hover:bg-slate-600 transition-all"
          >
            Quick: 15 Random
          </button>
          <button
            onClick={() => quickSelectRandom(20)}
            className="px-4 py-2 bg-slate-700 text-white text-sm font-bold rounded-xl hover:bg-slate-600 transition-all"
          >
            Quick: 20 Random
          </button>
          <button
            onClick={selectAll}
            className="px-4 py-2 bg-slate-700 text-white text-sm font-bold rounded-xl hover:bg-slate-600 transition-all"
          >
            Select All
          </button>
          <button
            onClick={clearPool}
            className="px-4 py-2 bg-red-700 text-white text-sm font-bold rounded-xl hover:bg-red-600 transition-all"
          >
            Clear All
          </button>
        </div>

        {/* Number Grid */}
        <div className="grid grid-cols-7 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-14 xl:grid-cols-17 gap-2">
          {NUMBER_RANGE.map((num) => (
            <NumberChip
              key={num}
              number={num}
              selected={selectedPool.includes(num)}
              onToggle={() => toggleNumber(num)}
            />
          ))}
        </div>

        {/* Selected Numbers Display */}
        {selectedPool.length > 0 && (
          <div className="mt-4 p-4 bg-slate-800/60 border border-slate-700 rounded-xl">
            <p className="text-sm font-bold text-slate-300 mb-2">
              Selected Pool ({selectedPool.length} numbers):
            </p>
            <div className="flex flex-wrap gap-2">
              {selectedPool.map((num) => (
                <span
                  key={num}
                  className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold rounded-lg shadow-lg"
                >
                  {num}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Configuration Card */}
      <section className="relative bg-slate-900/80 backdrop-blur-xl border-2 border-slate-800 rounded-3xl p-6 shadow-2xl">
        <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
          Wheel Builder Configuration
        </h2>
        <p className="text-slate-400 text-sm mb-6">
          Generate optimized lottery wheels with coverage guarantees. Use <b>Generate</b> for greedy
          wheels, <b>Scan Here</b> for fixed count, <b>Lower Bound</b> for minimal tickets,{' '}
          <b>Universe</b> for all k-combinations, or <b>Universe C(n,m)</b> for all m-subsets.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
          {/* Guarantee */}
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-2">
              Guarantee (m of {k})
            </label>
            <select
              value={guarantee}
              onChange={(e) => setGuarantee(parseInt(e.target.value, 10))}
              className="w-full px-4 py-2 bg-slate-800 border-2 border-slate-700 rounded-xl text-slate-100 focus:border-cyan-500 focus:outline-none"
            >
              {Array.from({ length: k - 1 }, (_, i) => i + 2).map((m) => (
                <option key={m} value={m}>
                  {m} / {k}
                </option>
              ))}
            </select>
          </div>

          {/* Effort */}
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-2">
              Search Effort
            </label>
            <input
              type="number"
              min={100}
              step={100}
              value={effort}
              onChange={(e) => setEffort(parseInt(e.target.value, 10))}
              className="w-full px-4 py-2 bg-slate-800 border-2 border-slate-700 rounded-xl text-slate-100 focus:border-cyan-500 focus:outline-none"
            />
            <p className="text-xs text-slate-500 mt-1">Higher = better quality</p>
          </div>

          {/* Seed */}
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-2">
              Seed (optional)
            </label>
            <input
              type="text"
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              placeholder="random"
              className="w-full px-4 py-2 bg-slate-800 border-2 border-slate-700 rounded-xl text-slate-100 focus:border-cyan-500 focus:outline-none"
            />
            <p className="text-xs text-slate-500 mt-1">For reproducibility</p>
          </div>

          {/* Scan Count */}
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-2">
              Scan Count
            </label>
            <input
              type="number"
              min={1}
              step={1}
              value={scanCount}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10)
                setScanCount(isNaN(val) || val < 1 ? 1 : val)
              }}
              className="w-full px-4 py-2 bg-slate-800 border-2 border-slate-700 rounded-xl text-slate-100 focus:border-cyan-500 focus:outline-none"
            />
            <p className="text-xs text-slate-500 mt-1">For "Scan Here" mode</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleGenerate('greedy')}
            disabled={isGenerating || selectedPool.length < k}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl shadow-lg hover:shadow-cyan-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Generate
          </button>
          <button
            onClick={() => handleGenerate('scan')}
            disabled={isGenerating || selectedPool.length < k}
            className="px-6 py-3 bg-slate-700 text-white font-bold rounded-xl hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Scan Here
          </button>
          <button
            onClick={() => handleGenerate('lb')}
            disabled={isGenerating || selectedPool.length < k}
            className="px-6 py-3 bg-slate-700 text-white font-bold rounded-xl hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Lower Bound
          </button>
          <button
            onClick={() => handleGenerate('universe')}
            disabled={isGenerating || selectedPool.length < k}
            className="px-6 py-3 bg-slate-700 text-white font-bold rounded-xl hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Universe
          </button>
          <button
            onClick={() => handleGenerate('universe-m')}
            disabled={isGenerating || selectedPool.length < guarantee}
            className="px-6 py-3 bg-slate-700 text-white font-bold rounded-xl hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Universe C(n,m)
          </button>

          <div className="flex-1"></div>

          <button
            onClick={handleDownload}
            disabled={tickets.length === 0}
            className="px-6 py-3 bg-slate-700 text-white font-bold rounded-xl hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Download CSV
          </button>
          <button
            onClick={handleCopy}
            disabled={tickets.length === 0}
            className="px-6 py-3 bg-slate-700 text-white font-bold rounded-xl hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Copy
          </button>
        </div>

        {selectedPool.length < k && (
          <p className="mt-4 text-yellow-400 text-sm font-semibold">
            ⚠️ Please select at least {k} numbers to generate tickets.
          </p>
        )}
      </section>

      {/* Statistics */}
      {selectedPool.length >= k && (
        <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard label="Pool Size (n)" value={selectedPool.length} />
          <StatCard label="Guarantee" value={`${guarantee} / ${k}`} />
          <StatCard label="Lower Bound (counting)" value={stats.lbCount.toLocaleString()} />
          <StatCard label="Lower Bound (Schönheim)" value={stats.lbSch.toLocaleString()} />
          <StatCard label="Universe C(n,m)" value={stats.universeSize.toLocaleString()} hint="m-subsets" />
        </section>
      )}

      {/* Tickets Display */}
      {(tickets.length > 0 || isGenerating) && (
        <section className={`relative bg-slate-900/80 backdrop-blur-xl border-2 border-slate-800 rounded-3xl p-6 shadow-2xl ${isGenerating ? 'min-h-[500px]' : ''}`}>
          {isGenerating && <LoadingOverlay message={loadingMessage} />}

          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-cyan-400">
              Ticket Set {tickets.length > 0 && `(${tickets.length} tickets)`}
            </h3>
          </div>

          {!isGenerating && tickets.length > 0 && (
            <>
              {/* Pagination Controls - Top */}
              {totalPages > 1 && (
                <div className="mb-4">
                  <PaginationControls
                    currentPage={currentPage}
                    totalPages={totalPages}
                    rowsPerPage={ticketsPerPage}
                    totalRows={tickets.length}
                    onPageChange={setCurrentPage}
                    onRowsPerPageChange={(newValue) => {
                      setTicketsPerPage(newValue)
                      setCurrentPage(1)
                    }}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 p-2">
                {paginatedTickets.map((ticket, i) => {
                  const actualIndex = (currentPage - 1) * ticketsPerPage + i
                  return (
                    <div
                      key={actualIndex}
                      className="bg-slate-800/60 border border-slate-700 rounded-xl p-3 font-mono text-sm"
                    >
                      <span className="text-slate-500">{String(actualIndex + 1).padStart(3, '0')} |</span>{' '}
                      <span className="text-cyan-300 font-semibold">
                        {ticket.map((n) => String(n).padStart(2, ' ')).join(' ')}
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* Pagination Controls - Bottom */}
              {totalPages > 1 && (
                <div className="mt-4">
                  <PaginationControls
                    currentPage={currentPage}
                    totalPages={totalPages}
                    rowsPerPage={ticketsPerPage}
                    totalRows={tickets.length}
                    onPageChange={setCurrentPage}
                    onRowsPerPageChange={(newValue) => {
                      setTicketsPerPage(newValue)
                      setCurrentPage(1)
                    }}
                  />
                </div>
              )}
            </>
          )}

          {/* Proof Status */}
          {!isGenerating && proofStatus && (
            <div className="mt-6 bg-slate-800/60 border-2 border-slate-700 rounded-xl p-4">
              <h4 className="text-lg font-bold text-slate-300 mb-2">
                Coverage Proof Verification
              </h4>

              {proofStatus.status === 'queued' && (
                <div className="text-slate-400">
                  <div className="inline-block w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                  Queued...
                </div>
              )}

              {proofStatus.status === 'processing' && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-slate-400">
                    <div className="inline-block w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                    Processing... {((proofStatus.progress / proofStatus.total) * 100).toFixed(1)}%
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all"
                      style={{
                        width: `${(proofStatus.progress / proofStatus.total) * 100}%`,
                      }}
                    ></div>
                  </div>
                  <p className="text-xs text-slate-500">
                    Checking {proofStatus.progress.toLocaleString()} /{' '}
                    {proofStatus.total.toLocaleString()} m-subsets
                  </p>
                </div>
              )}

              {proofStatus.status === 'completed' && proofStatus.result && (
                <div>
                  {proofStatus.result.pass ? (
                    <div className="text-green-400 font-bold text-lg">
                      ✅ PASS - All m-subsets covered!
                    </div>
                  ) : (
                    <div className="text-red-400 font-bold text-lg">
                      ❌ FAIL - Uncovered m-subsets remain
                    </div>
                  )}
                  <div className="mt-2 text-sm text-slate-400 space-y-1">
                    <p>Universe C(n,m) = {proofStatus.result.total.toLocaleString()}</p>
                    <p>Uncovered = {proofStatus.result.uncoveredCount.toLocaleString()}</p>
                    {!proofStatus.result.pass && proofStatus.result.samples.length > 0 && (
                      <div className="mt-2">
                        <p className="font-semibold text-slate-300">Examples:</p>
                        <div className="space-y-1">
                          {proofStatus.result.samples.slice(0, 10).map((sample, i) => (
                            <div key={i} className="font-mono text-xs text-slate-500">
                              [{sample.join(', ')}]
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {proofStatus.status === 'error' && (
                <div className="text-red-400">
                  <p className="font-bold">Error: {proofStatus.error}</p>
                  {proofStatus.error.includes('server') && (
                    <p className="text-sm mt-2 text-slate-400">
                      Run: <code className="bg-slate-700 px-2 py-1 rounded">npm run dev:server</code>
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Coverage Breakdown */}
          {!isGenerating && coverageBreakdown && (
            <div className="mt-6 bg-slate-800/60 border-2 border-slate-700 rounded-xl p-4">
              <h4 className="text-lg font-bold text-slate-300 mb-3">
                Coverage Breakdown
              </h4>
              <p className="text-xs text-slate-400 mb-4">
                Shows the minimum number of winning tickets across all possible draw scenarios from your pool.
              </p>
              <div className="border-2 border-slate-700/50 rounded-xl bg-slate-900/60 backdrop-blur-sm shadow-inner overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-800/95 backdrop-blur-md">
                    <tr className="border-b-2 border-emerald-500/30">
                      <th className="px-3 sm:px-4 py-3 text-left text-xs font-black uppercase tracking-widest text-slate-300">
                        Match Level
                      </th>
                      <th className="px-3 sm:px-4 py-3 text-right text-xs font-black uppercase tracking-widest text-slate-300">
                        Min Winning Tickets
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {coverageBreakdown.map((breakdown, idx) => (
                      <tr
                        key={`${breakdown.level}-${idx}`}
                        className={`hover:bg-emerald-500/10 transition-all duration-200 ${
                          idx % 2 === 0 ? 'bg-slate-800/30' : 'bg-slate-800/50'
                        }`}
                      >
                        <td className="px-3 sm:px-4 py-3 text-sm font-bold text-slate-200 border-b border-slate-700/30">
                          {breakdown.level}
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-sm text-right font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-500 border-b border-slate-700/30">
                          {breakdown.tickets.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="mt-4 text-xs text-slate-500 border-t border-slate-700 pt-4">
            Exact coverage check runs on the backend server using bitset + combinatorial ranking with
            live progress updates.
          </div>
        </section>
      )}
    </main>
  )
}
