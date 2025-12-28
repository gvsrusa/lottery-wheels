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
  const [fixedNumbers, setFixedNumbers] = useState([])
  const [fixedBonusNumbers, setFixedBonusNumbers] = useState([]) // New state for bonus numbers
  const [ticketBonuses, setTicketBonuses] = useState([]) // Randomly assigned bonuses per ticket


  // Group Constraints (10 groups: 0-9)
  const [isGroupConstraintsEnabled, setIsGroupConstraintsEnabled] = useState(false)
  const [groupConstraints, setGroupConstraints] = useState(
    Array.from({ length: 10 }, (_, i) => ({
      id: i, // Groups 0-9
      numbers: [],
      rawInput: '',
      min: 0,
      max: 1 // Default max is 1
    }))
  )
  const [bonusInputMode, setBonusInputMode] = useState('grid') // 'grid' or 'text'
  const [bonusTextInput, setBonusTextInput] = useState('')
  const [inputMode, setInputMode] = useState('grid') // 'grid' or 'text'
  const [textInput, setTextInput] = useState('')
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
    setFixedNumbers([])
    setFixedBonusNumbers([]) // Reset bonus numbers
    // Reset group constraints
    setIsGroupConstraintsEnabled(false)
    setGroupConstraints(
      Array.from({ length: 10 }, (_, i) => ({
        id: i, // Groups 0-9
        numbers: [],
        rawInput: '',
        min: 0,
        max: 1 // Default max is 1
      }))
    )
    setBonusTextInput('')
    setTickets([])
    setTicketBonuses([])
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
    setSelectedPool((prev) => {
      const newPool = prev.includes(num) ? prev.filter((n) => n !== num) : [...prev, num].sort((a, b) => a - b)
      // If removing from pool, also remove from fixed
      if (prev.includes(num)) {
        setFixedNumbers(f => f.filter(n => n !== num))
      }
      return newPool
    })
  }

  const toggleFixedNumber = (num) => {
    if (!selectedPool.includes(num)) return
    setFixedNumbers((prev) =>
      prev.includes(num) ? prev.filter((n) => n !== num) : [...prev, num].sort((a, b) => a - b)
    )
  }

  const toggleFixedBonusNumber = (num) => {
    setFixedBonusNumbers((prev) => {
      let newNums
      // If already selected, remove it
      if (prev.includes(num)) {
        newNums = prev.filter((n) => n !== num)
      } else {
        // Allow selecting as many as desired (no limit)
        newNums = [...prev, num].sort((a, b) => a - b)
      }
      setBonusTextInput(newNums.join(', '))
      return newNums
    })
  }

  // Effect to randomize bonus numbers across tickets
  useEffect(() => {
    if (!tickets.length || !gameConfig.hasBonus) {
      setTicketBonuses([])
      return
    }

    const pick = gameConfig.bonusNumbers.pick
    const totalSlots = tickets.length * pick
    let pool = []

    // If user selected specific bonus numbers, use them.
    // Otherwise, use ALL possible bonus numbers for a balanced random distribution.
    let sourcePool = fixedBonusNumbers.length > 0
      ? [...fixedBonusNumbers]
      : Array.from({ length: gameConfig.bonusNumbers.max }, (_, i) => i + 1)

    // Fill pool to meet demand, cycling through available source numbers
    // We want a roughly equal distribution
    while (pool.length < totalSlots) {
      pool = pool.concat(sourcePool)
    }
    // Trim to exact size required
    pool = pool.slice(0, totalSlots)

    // Shuffle (Fisher-Yates)
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    // Chunk for each ticket
    const bonuses = []
    for (let i = 0; i < tickets.length; i++) {
      bonuses.push(pool.slice(i * pick, (i + 1) * pick).sort((a, b) => a - b))
    }
    setTicketBonuses(bonuses)
  }, [tickets, fixedBonusNumbers, gameConfig])

  // Helper to get bonus numbers for a specific ticket index
  const getBonusForTicket = (ticketIndex) => {
    if (!gameConfig.hasBonus || !ticketBonuses[ticketIndex]) return []
    return ticketBonuses[ticketIndex]
  }

  // Handle text input parsing
  const handleTextInputChange = (e) => {
    const value = e.target.value
    setTextInput(value)

    // Parse comma-separated numbers
    const numbers = value
      .split(',')
      .map(s => parseInt(s.trim(), 10))
      .filter(n => !isNaN(n) && n >= 1 && n <= maxN)
      .filter((n, idx, arr) => arr.indexOf(n) === idx) // Remove duplicates
      .sort((a, b) => a - b)

    setSelectedPool(numbers)
    setFixedNumbers([]) // Reset fixed numbers when pool changes
  }

  // Handle bonus text input parsing
  const handleBonusTextInputChange = (e) => {
    const value = e.target.value
    setBonusTextInput(value)

    const maxBonus = gameConfig.bonusNumbers.max

    // Parse comma-separated numbers
    const numbers = value
      .split(/[\s,]+/) // Split by comma or whitespace
      .map(s => parseInt(s.trim(), 10))
      .filter(n => !isNaN(n) && n >= 1 && n <= maxBonus)
      .filter((n, idx, arr) => arr.indexOf(n) === idx) // Remove duplicates
      .sort((a, b) => a - b)

    setFixedBonusNumbers(numbers)
  }

  // Toggle number in a group (Exclusive selection)
  const toggleGroupNumber = (groupId, num) => {
    setGroupConstraints(prev => prev.map(g => {
      if (g.id !== groupId) return g

      const isSelected = g.numbers.includes(num)
      let newNumbers
      if (isSelected) {
        newNumbers = g.numbers.filter(n => n !== num)
      } else {
        newNumbers = [...g.numbers, num].sort((a, b) => a - b)
      }
      return { ...g, numbers: newNumbers }
    }))
  }

  // Update Min/Max for a group
  const updateGroupConstraint = (id, field, value) => {
    const val = parseInt(value, 10)
    if (isNaN(val) || val < 0) return

    setGroupConstraints(prev => prev.map(g => {
      if (g.id !== id) return g

      let newData = { ...g }

      if (field === 'min') {
        newData.min = val
        // If new min is greater than current max, increase max to match
        if (val > g.max) {
          newData.max = val
        }
      } else if (field === 'max') {
        newData.max = val
        // If new max is less than current min, decrease min to match
        if (val < g.min) {
          newData.min = val
        }
      }

      return newData
    }))
  }

  // Apply text input to pool
  const applyTextInput = () => {
    const numbers = textInput
      .split(',')
      .map(s => parseInt(s.trim(), 10))
      .filter(n => !isNaN(n) && n >= 1 && n <= maxN)
      .filter((n, idx, arr) => arr.indexOf(n) === idx)
      .sort((a, b) => a - b)

    setSelectedPool(numbers)
    setFixedNumbers([]) // Reset fixed numbers when pool changes
  }

  // Clear all selections and reset state
  const clearPool = () => {
    setSelectedPool([])
    setFixedNumbers([])
    setFixedNumbers([])
    setFixedBonusNumbers([]) // Reset bonus numbers
    setBonusTextInput('')
    setTextInput('')
    setTickets([])
    setTicketBonuses([])
    setIsGenerating(false)
    setLoadingMessage('')
    setProofStatus(null)
    setProofJobId(null)
    setCoverageBreakdown(null)
    setCurrentPage(1)
  }

  // Select all numbers
  const selectAll = () => {
    setSelectedPool([...NUMBER_RANGE])
    setFixedNumbers([]) // Reset fixed numbers when pool changes
  }

  // Quick select random pool
  const quickSelectRandom = (count) => {
    const shuffled = [...NUMBER_RANGE].sort(() => Math.random() - 0.5)
    setSelectedPool(shuffled.slice(0, count).sort((a, b) => a - b))
    setFixedNumbers([]) // Reset fixed numbers when pool changes
  }

  // Calculate statistics
  const stats = useMemo(() => {
    const variablePoolSize = selectedPool.length - fixedNumbers.length
    const variableK = k - fixedNumbers.length
    // guarantee is now TOTAL guarantee. Variable guarantee = total - fixed
    const variableM = guarantee - fixedNumbers.length

    if (variablePoolSize < variableK || variableK <= 0 || variableM <= 0) {
      return {
        lbCount: 0,
        lbSch: 0,
        lowerBound: 0,
        universeSize: 0,
        allTickets: 0,
        hasActiveConstraints: false,
      }
    }

    // Check if group constraints are active and meaningful
    const hasActiveConstraints = isGroupConstraintsEnabled &&
      groupConstraints.some(g => g.numbers.length > 0 && (g.min > 0 || g.max < k))

    const baseStats = calculateWheelStats(variablePoolSize, variableK, variableM)

    return {
      ...baseStats,
      hasActiveConstraints,
    }
  }, [selectedPool, fixedNumbers, guarantee, k, isGroupConstraintsEnabled, groupConstraints])

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
  const verifyProof = async (pool, k, m, tickets, constraints) => {
    setProofStatus({ status: 'queued', progress: 0, total: 0 })

    try {
      const response = await fetch(`${API_BASE_URL}/api/verify-proof`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pool, k, m, tickets, groupConstraints: constraints }),
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
    // guarantee is TOTAL. variableM = guarantee - fixedNumbers.length
    const m = guarantee - fixedNumbers.length

    // Validation
    if (n < k) {
      alert(`Please select at least ${k} numbers for ${gameConfig.name}`)
      return
    }

    if (fixedNumbers.length >= k) {
      alert(`Cannot fix ${fixedNumbers.length} numbers for a pick-${k} game. Max fixed is ${k - 1}.`)
      return
    }

    // Check if guarantee is possible with fixed numbers
    const variableK = k - fixedNumbers.length
    if (m > variableK) {
      // This shouldn't happen with UI constraints, but good to check
      alert(`Guarantee ${guarantee} is too high for the remaining ${variableK} spots.`)
      return
    }

    if (m <= 0) {
      alert(`Guarantee must be greater than fixed numbers count.`)
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
          fixedNumbers,
          groupConstraints: isGroupConstraintsEnabled ? groupConstraints : [],
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
      // Submit proof verification to backend
      await verifyProof(
        selectedPool,
        k,
        m,
        data.tickets,
        isGroupConstraintsEnabled ? groupConstraints : []
      )
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
    if (gameConfig.hasBonus) {
      headers.push('bonus')
    }
    const rows = tickets.map((t, i) => {
      const row = [i + 1, ...t]
      if (gameConfig.hasBonus) {
        const bonus = getBonusForTicket(i)
        row.push(bonus.join(' '))
      }
      return row
    })
    const csv = toCSV([headers, ...rows])

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

    const txt = tickets.map((t, i) => {
      let line = t.join(' ')
      if (gameConfig.hasBonus) {
        const bonus = getBonusForTicket(i)
        line += ` + ${bonus.join(' ')}`
      }
      return line
    }).join('\n')
    try {
      await navigator.clipboard.writeText(txt)
      alert('Copied to clipboard!')
    } catch (error) {
      alert(`Copy failed: ${error.message}`)
    }
  }

  return (
    <main className="max-w-[1800px] mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 space-y-4 sm:space-y-6 md:space-y-8">
      {/* Number Selection Card */}
      <section className="relative bg-slate-900/80 backdrop-blur-xl border-2 border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl">
        <h2 className="text-xl sm:text-2xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
          Select Your Number Pool
        </h2>
        <p className="text-slate-400 text-xs sm:text-sm mb-4">
          Choose at least {k} numbers from 1-{maxN} for {gameConfig.name}. Selected: {selectedPool.length}
        </p>

        {/* Input Mode Toggle */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setInputMode('grid')}
            className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all min-h-[44px] touch-manipulation ${inputMode === 'grid'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
          >
            Grid Selection
          </button>
          <button
            onClick={() => setInputMode('text')}
            className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all min-h-[44px] touch-manipulation ${inputMode === 'text'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
          >
            Text Input
          </button>
        </div>

        {/* Text Input Mode */}
        {inputMode === 'text' && (
          <div className="mb-4 space-y-3">
            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-300 mb-2">
                Enter comma-separated numbers (e.g., 1, 2, 3, 6, 8, 9, 10)
              </label>
              <textarea
                value={textInput}
                onChange={handleTextInputChange}
                placeholder="1, 2, 3, 6, 8, 9, 10, 11, 12, 14, 15, 18, 19, 20..."
                className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-slate-800 border-2 border-slate-700 rounded-lg sm:rounded-xl text-slate-100 text-sm focus:border-cyan-500 focus:outline-none font-mono min-h-[100px]"
              />
            </div>
            {textInput && selectedPool.length > 0 && (
              <p className="text-xs text-slate-400">
                {selectedPool.length} valid numbers parsed: {selectedPool.join(', ')}
              </p>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => quickSelectRandom(10)}
            className="px-3 sm:px-4 py-2 bg-slate-700 text-white text-xs sm:text-sm font-bold rounded-lg sm:rounded-xl hover:bg-slate-600 transition-all min-h-[44px] touch-manipulation"
          >
            Quick: 10 Random
          </button>
          <button
            onClick={() => quickSelectRandom(15)}
            className="px-3 sm:px-4 py-2 bg-slate-700 text-white text-xs sm:text-sm font-bold rounded-lg sm:rounded-xl hover:bg-slate-600 transition-all min-h-[44px] touch-manipulation"
          >
            Quick: 15 Random
          </button>
          <button
            onClick={() => quickSelectRandom(20)}
            className="px-3 sm:px-4 py-2 bg-slate-700 text-white text-xs sm:text-sm font-bold rounded-lg sm:rounded-xl hover:bg-slate-600 transition-all min-h-[44px] touch-manipulation"
          >
            Quick: 20 Random
          </button>
          <button
            onClick={selectAll}
            className="px-3 sm:px-4 py-2 bg-slate-700 text-white text-xs sm:text-sm font-bold rounded-lg sm:rounded-xl hover:bg-slate-600 transition-all min-h-[44px] touch-manipulation"
          >
            Select All
          </button>
          <button
            onClick={clearPool}
            className="px-3 sm:px-4 py-2 bg-red-700 text-white text-xs sm:text-sm font-bold rounded-lg sm:rounded-xl hover:bg-red-600 transition-all min-h-[44px] touch-manipulation"
          >
            Clear All
          </button>
        </div>

        {/* Number Grid */}
        {inputMode === 'grid' && (
          <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 xl:grid-cols-15 gap-2">
            {NUMBER_RANGE.map((num) => (
              <NumberChip
                key={num}
                number={num}
                selected={selectedPool.includes(num)}
                onToggle={() => toggleNumber(num)}
              />
            ))}
          </div>
        )}

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

        {/* Fixed Numbers Selection */}
        {selectedPool.length > 0 && (
          <div className="mt-4 p-4 bg-slate-800/60 border border-slate-700 rounded-xl">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-bold text-slate-300">
                Select Fixed Numbers (Bankers):
              </p>
              <span className="text-xs text-slate-400">
                {fixedNumbers.length} / {k - 1} max
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {selectedPool.map((num) => {
                const isFixed = fixedNumbers.includes(num)
                return (
                  <button
                    key={num}
                    onClick={() => toggleFixedNumber(num)}
                    className={`w-10 h-10 rounded-lg font-bold shadow-lg transition-all ${isFixed
                      ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white ring-2 ring-amber-300'
                      : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                      }`}
                  >
                    {num}
                  </button>
                )
              })}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Click numbers above to toggle them as "Fixed". Fixed numbers appear in every ticket.
            </p>
          </div>
        )}

        {/* Bonus Number Selection */}
        {gameConfig.hasBonus && (
          <div className="mt-4 p-4 bg-slate-800/60 border border-slate-700 rounded-xl">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-bold text-slate-300">
                Select Bonus Numbers (Optional):
              </p>
              <span className="text-xs text-slate-400">
                {fixedBonusNumbers.length} / {gameConfig.bonusNumbers.pick}
              </span>
            </div>

            {/* Bonus Input Mode Toggle */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setBonusInputMode('grid')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${bonusInputMode === 'grid'
                  ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
              >
                Grid
              </button>
              <button
                onClick={() => setBonusInputMode('text')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${bonusInputMode === 'text'
                  ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
              >
                Text
              </button>
            </div>

            {bonusInputMode === 'text' ? (
              <div className="mb-2">
                <textarea
                  value={bonusTextInput}
                  onChange={handleBonusTextInputChange}
                  placeholder={`Enter bonus numbers (1-${gameConfig.bonusNumbers.max})`}
                  className="w-full px-3 py-2 bg-slate-800 border-2 border-slate-700 rounded-lg text-slate-100 text-sm focus:border-pink-500 focus:outline-none font-mono min-h-[60px]"
                />
                <p className="text-xs text-slate-400 mt-1">
                  {fixedBonusNumbers.length} valid bonus numbers: {fixedBonusNumbers.join(', ')}
                </p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: gameConfig.bonusNumbers.max }, (_, i) => i + 1).map((num) => {
                  const isSelected = fixedBonusNumbers.includes(num)
                  return (
                    <button
                      key={num}
                      onClick={() => toggleFixedBonusNumber(num)}
                      className={`w-10 h-10 rounded-full font-bold shadow-lg transition-all ${isSelected
                        ? 'bg-gradient-to-br from-red-500 to-pink-600 text-white ring-2 ring-red-300'
                        : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                        }`}
                    >
                      {num}
                    </button>
                  )
                })}
              </div>
            )}

            <p className="text-xs text-slate-500 mt-2">
              These bonus numbers will be appended to every ticket.
              <br />
              <b>Note:</b> If none are selected, all available bonus numbers ({gameConfig.bonusNumbers.max}) will be distributed randomly and evenly across tickets.
            </p>
          </div>
        )}
      </section>

      <section className={`relative transition-all duration-300 border-2 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl ${isGroupConstraintsEnabled
        ? 'bg-slate-900/80 backdrop-blur-xl border-slate-700'
        : 'bg-slate-900/60 backdrop-blur-xl border-slate-800'
        }`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className={`text-xl sm:text-2xl font-bold bg-gradient-to-r bg-clip-text text-transparent transition-all ${isGroupConstraintsEnabled
              ? 'from-cyan-400 to-blue-500'
              : 'from-cyan-400/50 to-blue-500/50'
              }`}>
              Group Constraints
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm">
              Divide numbers into groups and set Min/Max occurrences.
            </p>
          </div>

          <button
            onClick={() => setIsGroupConstraintsEnabled(!isGroupConstraintsEnabled)}
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${isGroupConstraintsEnabled ? 'bg-cyan-600' : 'bg-slate-700'
              }`}
          >
            <span className="sr-only">Enable Group Constraints</span>
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${isGroupConstraintsEnabled ? 'translate-x-7' : 'translate-x-1'
                }`}
            />
          </button>
        </div>

        {/* Info box explaining what group constraints do */}
        {isGroupConstraintsEnabled && (
          <div className="mb-4 p-3 bg-cyan-900/20 border border-cyan-700/30 rounded-lg">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="text-xs text-cyan-100 leading-relaxed">
                <p className="font-semibold mb-1">How Group Constraints Work:</p>
                <p className="text-cyan-200/90">
                  Organize your numbers into groups (e.g., Group 0: hot numbers, Group 1: cold numbers).
                  Set Min/Max to control how many numbers from each group appear in <strong>every ticket</strong>.
                  For example: "Min: 2, Max: 3" means each ticket must have 2-3 numbers from that group.
                </p>
              </div>
            </div>
          </div>
        )}

        {isGroupConstraintsEnabled && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {groupConstraints.map((group) => (
                <div key={group.id} className="p-3 bg-slate-800/50 border border-slate-700 rounded-xl">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-slate-200 text-sm">Group {group.id}</span>
                    <span className="text-xs text-slate-500">{group.numbers.length} nums</span>
                  </div>

                  {/* Exclusive Number Selection Grid */}
                  <div className="mb-3">
                    <p className="text-[10px] uppercase text-slate-500 font-bold mb-1">Select Numbers</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedPool.map(num => {
                        // Check if this number is taken by ANY OTHER group
                        const takenByOther = groupConstraints.some(g => g.id !== group.id && g.numbers.includes(num))

                        // If taken by other, hide it (as requested: "removed from selection")
                        if (takenByOther) return null

                        const isSelected = group.numbers.includes(num)

                        return (
                          <button
                            key={num}
                            onClick={() => toggleGroupNumber(group.id, num)}
                            className={`w-8 h-8 flex items-center justify-center rounded text-xs font-bold transition-all ${isSelected
                              ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg scale-105'
                              : 'bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-slate-200'
                              }`}
                          >
                            {num}
                          </button>
                        )
                      })}
                      {/* Show placeholder if no numbers available */}
                      {selectedPool.every(num => groupConstraints.some(g => g.id !== group.id && g.numbers.includes(num)) && !group.numbers.includes(num)) && (
                        <span className="text-xs text-slate-600 italic">No available numbers</span>
                      )}
                    </div>
                  </div>

                  {/* Min/Max Controls */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Min</label>
                      <input
                        type="number"
                        min="0"
                        max={k}
                        value={group.min}
                        onChange={(e) => updateGroupConstraint(group.id, 'min', e.target.value)}
                        className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-slate-200 text-xs focus:border-cyan-500 focus:outline-none"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Max</label>
                      <input
                        type="number"
                        min="0"
                        max={k}
                        value={group.max}
                        onChange={(e) => updateGroupConstraint(group.id, 'max', e.target.value)}
                        className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-slate-200 text-xs focus:border-cyan-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Configuration Card */}
      <section className="relative bg-slate-900/80 backdrop-blur-xl border-2 border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl">
        <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
          Wheel Builder Configuration
        </h2>
        <p className="text-slate-400 text-xs sm:text-sm mb-4 sm:mb-6 leading-relaxed">
          Generate optimized lottery wheels with coverage guarantees. Use <b>Generate</b> for greedy
          wheels, <b>Scan Here</b> for fixed count, <b>Lower Bound</b> for minimal tickets,{' '}
          <b>Universe</b> for all k-combinations, or <b>Universe C(n,m)</b> for all m-subsets.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          {/* Guarantee */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-slate-300 mb-2">
              Guarantee (m of {k})
            </label>
            <select
              value={guarantee}
              onChange={(e) => setGuarantee(parseInt(e.target.value, 10))}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-800 border-2 border-slate-700 rounded-lg sm:rounded-xl text-slate-100 text-sm focus:border-cyan-500 focus:outline-none min-h-[44px]"
            >
              {/* Show options from (fixed + 1) up to k. 
                  Example: Pick 6, Fixed 1. Range: 2 to 6.
              */}
              {Array.from({ length: k - fixedNumbers.length }, (_, i) => i + fixedNumbers.length + 1).map((m) => (
                <option key={m} value={m}>
                  {m} / {k}
                </option>
              ))}
            </select>
          </div>

          {/* Effort */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-slate-300 mb-2">
              Search Effort
            </label>
            <input
              type="number"
              min={100}
              step={100}
              value={effort}
              onChange={(e) => setEffort(parseInt(e.target.value, 10))}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-800 border-2 border-slate-700 rounded-lg sm:rounded-xl text-slate-100 text-sm focus:border-cyan-500 focus:outline-none min-h-[44px]"
            />
            <p className="text-xs text-slate-500 mt-1">Higher = better quality</p>
          </div>

          {/* Seed */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-slate-300 mb-2">
              Seed (optional)
            </label>
            <input
              type="text"
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              placeholder="random"
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-800 border-2 border-slate-700 rounded-lg sm:rounded-xl text-slate-100 text-sm focus:border-cyan-500 focus:outline-none min-h-[44px]"
            />
            <p className="text-xs text-slate-500 mt-1">For reproducibility</p>
          </div>

          {/* Scan Count */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-slate-300 mb-2">
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
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-800 border-2 border-slate-700 rounded-lg sm:rounded-xl text-slate-100 text-sm focus:border-cyan-500 focus:outline-none min-h-[44px]"
            />
            <p className="text-xs text-slate-500 mt-1">For "Scan Here" mode</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <button
            onClick={() => handleGenerate('greedy')}
            disabled={isGenerating || selectedPool.length < k}
            className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs sm:text-base rounded-lg sm:rounded-xl shadow-lg hover:shadow-cyan-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all min-h-[44px] touch-manipulation"
          >
            Generate
          </button>
          <button
            onClick={() => handleGenerate('scan')}
            disabled={isGenerating || selectedPool.length < k}
            className="px-4 sm:px-6 py-2 sm:py-3 bg-slate-700 text-white font-bold text-xs sm:text-base rounded-lg sm:rounded-xl hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all min-h-[44px] touch-manipulation"
          >
            Scan Here
          </button>
          <button
            onClick={() => handleGenerate('lb')}
            disabled={isGenerating || selectedPool.length < k}
            className="px-4 sm:px-6 py-2 sm:py-3 bg-slate-700 text-white font-bold text-xs sm:text-base rounded-lg sm:rounded-xl hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all min-h-[44px] touch-manipulation"
          >
            Lower Bound
          </button>
          <button
            onClick={() => handleGenerate('universe')}
            disabled={isGenerating || selectedPool.length < k}
            className="px-4 sm:px-6 py-2 sm:py-3 bg-slate-700 text-white font-bold text-xs sm:text-base rounded-lg sm:rounded-xl hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all min-h-[44px] touch-manipulation"
          >
            Universe
          </button>
          <button
            onClick={() => handleGenerate('universe-m')}
            disabled={isGenerating || selectedPool.length < guarantee}
            className="px-4 sm:px-6 py-2 sm:py-3 bg-slate-700 text-white font-bold text-xs sm:text-base rounded-lg sm:rounded-xl hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all min-h-[44px] touch-manipulation whitespace-nowrap"
          >
            Universe C(n,m)
          </button>

          <div className="flex-1 hidden md:block"></div>

          <button
            onClick={handleDownload}
            disabled={tickets.length === 0}
            className="px-4 sm:px-6 py-2 sm:py-3 bg-slate-700 text-white font-bold text-xs sm:text-base rounded-lg sm:rounded-xl hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all min-h-[44px] touch-manipulation"
          >
            Download CSV
          </button>
          <button
            onClick={handleCopy}
            disabled={tickets.length === 0}
            className="px-4 sm:px-6 py-2 sm:py-3 bg-slate-700 text-white font-bold text-xs sm:text-base rounded-lg sm:rounded-xl hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all min-h-[44px] touch-manipulation"
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
        <>
          {stats.hasActiveConstraints && (
            <div className="mb-3 p-3 bg-amber-900/20 border border-amber-700/30 rounded-lg flex items-start gap-2">
              <svg className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="text-xs text-amber-200 leading-relaxed">
                <strong>Group Constraints Active:</strong> Statistics shown below are calculated without considering group constraints.
                The actual search space may be significantly smaller, resulting in fewer valid ticket combinations.
              </div>
            </div>
          )}
          <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
            <StatCard label="Pool Size (n)" value={selectedPool.length} />
            <StatCard label="Fixed Numbers" value={fixedNumbers.length} />
            <StatCard label="Variable Spots" value={k - fixedNumbers.length} />
            <StatCard label="Guarantee" value={`${guarantee} / ${k}`} />
            <StatCard label="Lower Bound" value={stats.lowerBound.toLocaleString()} />
          </section>
        </>
      )}

      {/* Tickets Display */}
      {(tickets.length > 0 || isGenerating) && (
        <section className={`relative bg-slate-900/80 backdrop-blur-xl border-2 border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl ${isGenerating ? 'min-h-[500px]' : ''}`}>
          {isGenerating && <LoadingOverlay message={loadingMessage} />}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
            <h3 className="text-lg sm:text-xl font-bold text-cyan-400">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2 sm:gap-3">
                {paginatedTickets.map((ticket, i) => {
                  const actualIndex = (currentPage - 1) * ticketsPerPage + i
                  return (
                    <div
                      key={actualIndex}
                      className="bg-slate-800/60 border border-slate-700 rounded-lg sm:rounded-xl p-2.5 sm:p-3 font-mono text-xs sm:text-sm"
                    >
                      <span className="text-slate-500">{String(actualIndex + 1).padStart(3, '0')} |</span>{' '}
                      <span className="text-cyan-300 font-semibold">
                        {ticket.map((n) => String(n).padStart(2, ' ')).join(' ')}
                      </span>
                      {gameConfig.hasBonus && getBonusForTicket(actualIndex).length > 0 && (
                        <span className="text-pink-400 font-bold ml-2">
                          + {getBonusForTicket(actualIndex).join(' ')}
                        </span>
                      )}
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
                <table className="w-full min-w-[350px]">
                  <thead className="bg-slate-800/95 backdrop-blur-md">
                    <tr className="border-b-2 border-emerald-500/30">
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-black uppercase tracking-wider sm:tracking-widest text-slate-300">
                        Match Level
                      </th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-right text-[10px] sm:text-xs font-black uppercase tracking-wider sm:tracking-widest text-slate-300">
                        Min Winning Tickets
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {coverageBreakdown.map((breakdown, idx) => (
                      <tr
                        key={`${breakdown.level}-${idx}`}
                        className={`hover:bg-emerald-500/10 transition-all duration-200 ${idx % 2 === 0 ? 'bg-slate-800/30' : 'bg-slate-800/50'
                          }`}
                      >
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-bold text-slate-200 border-b border-slate-700/30">
                          {breakdown.level}
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-right font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-500 border-b border-slate-700/30">
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
