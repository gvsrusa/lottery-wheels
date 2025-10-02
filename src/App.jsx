import { useMemo, useState } from 'react'

// Game configurations
const GAME_CONFIGS = {
  'texas-two-step': {
    name: 'Texas Two Step',
    mainNumbers: { min: 1, max: 35, pick: 4 },
    bonusNumbers: { min: 1, max: 35, pick: 1 },
    hasBonus: true,
    poolRange: { min: 4, max: 25 },
    bonusCandidatesMax: 6,
    description: 'Pick 4 numbers from 1-35 + 1 bonus',
    tiers: [
      { id: '4of4b', label: '4/4 + Bonus', defaultChecked: true },
      { id: '4of4', label: '4/4', defaultChecked: true },
      { id: '3of4b', label: '3/4 + Bonus', defaultChecked: true },
      { id: '3of4', label: '3/4', defaultChecked: true },
      { id: '2of4b', label: '2/4 + Bonus', defaultChecked: false },
      { id: '2of4', label: '2/4', defaultChecked: false },
    ],
  },
  'lotto-texas': {
    name: 'Lotto Texas',
    mainNumbers: { min: 1, max: 54, pick: 6 },
    bonusNumbers: null,
    hasBonus: false,
    poolRange: { min: 6, max: 30 },
    bonusCandidatesMax: 0,
    description: 'Pick 6 numbers from 1-54',
    tiers: [
      { id: '6of6', label: '6/6 (Jackpot)', defaultChecked: true },
      { id: '5of6', label: '5/6', defaultChecked: true },
      { id: '4of6', label: '4/6', defaultChecked: true },
      { id: '3of6', label: '3/6', defaultChecked: false },
    ],
  },
  'cash-five': {
    name: 'Texas Cash Five',
    mainNumbers: { min: 1, max: 35, pick: 5 },
    bonusNumbers: null,
    hasBonus: false,
    poolRange: { min: 5, max: 25 },
    bonusCandidatesMax: 0,
    description: 'Pick 5 numbers from 1-35',
    tiers: [
      { id: '5of5', label: '5/5 (Jackpot)', defaultChecked: true },
      { id: '4of5', label: '4/5', defaultChecked: true },
      { id: '3of5', label: '3/5', defaultChecked: true },
      { id: '2of5', label: '2/5', defaultChecked: false },
    ],
  },
  'powerball': {
    name: 'Powerball',
    mainNumbers: { min: 1, max: 69, pick: 5 },
    bonusNumbers: { min: 1, max: 26, pick: 1 },
    hasBonus: true,
    poolRange: { min: 5, max: 35 },
    bonusCandidatesMax: 10,
    description: 'Pick 5 numbers from 1-69 + Powerball from 1-26',
    tiers: [
      { id: '5of5b', label: '5/5 + PB (Jackpot)', defaultChecked: true },
      { id: '5of5', label: '5/5', defaultChecked: true },
      { id: '4of5b', label: '4/5 + PB', defaultChecked: true },
      { id: '4of5', label: '4/5', defaultChecked: true },
      { id: '3of5b', label: '3/5 + PB', defaultChecked: false },
      { id: '3of5', label: '3/5', defaultChecked: false },
    ],
  },
  'mega-millions': {
    name: 'Mega Millions',
    mainNumbers: { min: 1, max: 70, pick: 5 },
    bonusNumbers: { min: 1, max: 25, pick: 1 },
    hasBonus: true,
    poolRange: { min: 5, max: 35 },
    bonusCandidatesMax: 10,
    description: 'Pick 5 numbers from 1-70 + Mega Ball from 1-25',
    tiers: [
      { id: '5of5b', label: '5/5 + MB (Jackpot)', defaultChecked: true },
      { id: '5of5', label: '5/5', defaultChecked: true },
      { id: '4of5b', label: '4/5 + MB', defaultChecked: true },
      { id: '4of5', label: '4/5', defaultChecked: true },
      { id: '3of5b', label: '3/5 + MB', defaultChecked: false },
      { id: '3of5', label: '3/5', defaultChecked: false },
    ],
  },
}

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

function toCSV(rows) {
  return rows
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')
}

function formatNumbers(numbers) {
  return numbers.join('-')
}

// Greedy covering design algorithm
function findMinimumCoverage(pool, k, minMatches) {
  // Generate all possible k-combinations from the pool
  const allCombinations = kCombinations(pool, k)

  // Generate all possible k-combinations that could be drawn from the pool
  const allPossibleDraws = allCombinations

  const selectedCombinations = []
  const uncoveredDraws = new Set(allPossibleDraws.map(draw => draw.join(',')))

  // Greedy algorithm: repeatedly pick the combination that covers the most uncovered draws
  while (uncoveredDraws.size > 0) {
    let bestCombo = null
    let bestCoverage = 0

    for (const combo of allCombinations) {
      let coverage = 0

      // Count how many uncovered draws this combo would cover
      for (const drawKey of uncoveredDraws) {
        const draw = drawKey.split(',').map(Number)
        const matches = combo.filter(num => draw.includes(num)).length

        if (matches >= minMatches) {
          coverage++
        }
      }

      if (coverage > bestCoverage) {
        bestCoverage = coverage
        bestCombo = combo
      }
    }

    if (bestCombo === null) {
      break
    }

    selectedCombinations.push(bestCombo)

    // Remove all draws covered by this combination
    const newUncovered = new Set()
    for (const drawKey of uncoveredDraws) {
      const draw = drawKey.split(',').map(Number)
      const matches = bestCombo.filter(num => draw.includes(num)).length

      if (matches < minMatches) {
        newUncovered.add(drawKey)
      }
    }

    uncoveredDraws.clear()
    newUncovered.forEach(key => uncoveredDraws.add(key))
  }

  return selectedCombinations
}

// Check if a set of combinations provides coverage for a given match level
function checkCoverageLevel(combinations, pool, k, minMatches) {
  const allPossibleDraws = kCombinations(pool, k)

  for (const draw of allPossibleDraws) {
    let hasCoverage = false

    for (const combo of combinations) {
      const matches = combo.filter(num => draw.includes(num)).length
      if (matches >= minMatches) {
        hasCoverage = true
        break
      }
    }

    if (!hasCoverage) {
      return false
    }
  }

  return true
}

function NumberChip({ number, selected, onToggle }) {
  const selectedClasses = selected
    ? 'bg-gradient-to-br from-cyan-400 via-blue-500 to-violet-600 text-white border-cyan-300 shadow-2xl shadow-blue-500/60 scale-110 ring-4 ring-blue-400/30'
    : 'bg-gradient-to-br from-slate-800 to-slate-700 border-slate-600 text-slate-300 hover:from-slate-700 hover:to-slate-600 hover:border-blue-500/50 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/20'

  return (
    <button
      type="button"
      className={`relative flex h-12 sm:h-11 w-full items-center justify-center rounded-2xl border-2 font-bold text-base sm:text-sm transition-all duration-300 ease-out active:scale-95 ${selectedClasses}`}
      onClick={() => onToggle(number, selected)}
    >
      {number}
    </button>
  )
}

function StatCard({ label, value }) {
  return (
    <div className="relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-5 shadow-2xl hover:shadow-blue-500/10 hover:border-blue-500/30 transition-all duration-300 overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-violet-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <div className="relative z-10">
        <div className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">{label}</div>
        <div className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 text-2xl font-black">{value}</div>
      </div>
    </div>
  )
}

function LoadingOverlay({ message }) {
  return (
    <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-md z-50 flex items-center justify-center rounded-3xl">
      <div className="flex flex-col items-center gap-6 p-8">
        {/* Animated Spinner */}
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 border-4 border-slate-700 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-transparent border-t-cyan-400 border-r-blue-500 rounded-full animate-spin"></div>
          <div className="absolute inset-2 border-4 border-transparent border-t-violet-400 border-r-purple-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
        </div>

        {/* Message */}
        <div className="text-center">
          <p className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 font-black text-xl mb-2">
            Processing...
          </p>
          <p className="text-slate-300 text-sm font-medium">
            {message}
          </p>
        </div>
      </div>
    </div>
  )
}

function PaginationControls({ currentPage, totalPages, rowsPerPage, totalRows, onPageChange, onRowsPerPageChange }) {
  const pageNumbers = []
  const maxVisiblePages = 5

  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

  if (endPage - startPage < maxVisiblePages - 1) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1)
  }

  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i)
  }

  if (totalRows === 0) return null

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
      {/* Rows per page */}
      <div className="flex items-center gap-3">
        <label className="text-slate-300 text-sm font-medium">Rows per page:</label>
        <select
          value={rowsPerPage}
          onChange={(e) => onRowsPerPageChange(Number(e.target.value))}
          className="px-3 py-2 rounded-lg bg-slate-800 border-2 border-slate-600 text-slate-200 font-semibold focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
        >
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
          <option value={200}>200</option>
        </select>
      </div>

      {/* Page info */}
      <div className="text-slate-300 text-sm font-medium">
        Showing <span className="text-cyan-400 font-bold">{(currentPage - 1) * rowsPerPage + 1}</span> to{' '}
        <span className="text-cyan-400 font-bold">{Math.min(currentPage * rowsPerPage, totalRows)}</span> of{' '}
        <span className="text-cyan-400 font-bold">{totalRows}</span> results
      </div>

      {/* Page navigation */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="px-3 py-2 rounded-lg bg-slate-800 border-2 border-slate-600 text-slate-300 font-bold hover:bg-slate-700 hover:border-blue-500/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          ««
        </button>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-2 rounded-lg bg-slate-800 border-2 border-slate-600 text-slate-300 font-bold hover:bg-slate-700 hover:border-blue-500/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          ‹
        </button>

        {startPage > 1 && (
          <span className="px-2 text-slate-500">...</span>
        )}

        {pageNumbers.map((pageNum) => (
          <button
            key={pageNum}
            onClick={() => onPageChange(pageNum)}
            className={`px-4 py-2 rounded-lg font-bold transition-all ${
              pageNum === currentPage
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-2 border-cyan-400 shadow-lg shadow-blue-500/50'
                : 'bg-slate-800 border-2 border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-blue-500/50'
            }`}
          >
            {pageNum}
          </button>
        ))}

        {endPage < totalPages && (
          <span className="px-2 text-slate-500">...</span>
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-2 rounded-lg bg-slate-800 border-2 border-slate-600 text-slate-300 font-bold hover:bg-slate-700 hover:border-blue-500/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          ›
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="px-3 py-2 rounded-lg bg-slate-800 border-2 border-slate-600 text-slate-300 font-bold hover:bg-slate-700 hover:border-blue-500/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          »»
        </button>
      </div>
    </div>
  )
}

function CoverageAnalysisTab({
  gameConfig,
  NUMBER_RANGE,
  coveragePool,
  setCoveragePool,
  coverageLevels,
  setCoverageLevels,
  coverageResults,
  setCoverageResults,
  coverageSummary,
  setCoverageSummary,
  coverageHint,
  setCoverageHint,
  coverageCurrentPage,
  setCoverageCurrentPage,
  coverageRowsPerPage,
  setCoverageRowsPerPage,
  isCoverageGenerating,
  setIsCoverageGenerating,
  coverageLoadingMessage,
  setCoverageLoadingMessage,
}) {
  const { pick: pickCount } = gameConfig.mainNumbers
  const minPool = gameConfig.poolRange.min
  const maxPool = gameConfig.poolRange.max

  const toggleCoveragePool = (number, currentlySelected) => {
    setCoveragePool((prev) => {
      if (currentlySelected) {
        return prev.filter((value) => value !== number)
      }
      if (prev.length >= maxPool) {
        setCoverageHint(`Pool is limited to ${maxPool} numbers. Remove one before adding another.`)
        return prev
      }
      return [...prev, number].sort((a, b) => a - b)
    })
  }

  const clearCoveragePool = () => setCoveragePool([])

  const toggleCoverageLevel = (level) => {
    setCoverageLevels((prev) => ({ ...prev, [level]: !prev[level] }))
  }

  const handleGenerateCoverage = () => {
    setCoverageHint('')
    setCoverageSummary([])
    setCoverageResults([])
    setCoverageCurrentPage(1)

    if (coveragePool.length < minPool) {
      setCoverageHint(`Select at least ${minPool} numbers in your pool.`)
      return
    }

    if (coveragePool.length > maxPool) {
      setCoverageHint(`Pool cannot exceed ${maxPool} numbers.`)
      return
    }

    const checkedLevels = Object.entries(coverageLevels)
      .filter(([, checked]) => checked)
      .map(([level]) => Number(level))

    if (checkedLevels.length === 0) {
      setCoverageHint('Please select at least one coverage level.')
      return
    }

    // Start loading
    setIsCoverageGenerating(true)
    setCoverageLoadingMessage('Generating all combinations from pool...')

    // Use setTimeout to allow UI to update before heavy computation
    setTimeout(() => {
      try {
        // Generate ALL possible combinations from the pool
        const allCombos = kCombinations(coveragePool, pickCount)

        const summary = [
          { label: 'Pool size', value: coveragePool.length.toLocaleString() },
          { label: `Total ${pickCount}-number combinations`, value: allCombos.length.toLocaleString() },
        ]

        // Update loading message
        setCoverageLoadingMessage('Analyzing coverage breakdown...')

        // Calculate breakdown: for each match level, calculate statistics
        const coverageBreakdown = []

        for (let matchLevel = pickCount; matchLevel >= 2; matchLevel--) {
          // Calculate: if exactly 'matchLevel' numbers from pool are drawn,
          // how many of our combinations will have exactly 'matchLevel' matches?

          // Generate all possible scenarios where exactly matchLevel numbers from pool are drawn
          const poolSubsets = kCombinations(coveragePool, matchLevel)

          let minWinningCombos = Infinity

          // For each scenario, count how many combos win
          for (const drawnFromPool of poolSubsets) {
            let winningCount = 0

            for (const combo of allCombos) {
              // Count matches between combo and drawn pool numbers
              const matches = combo.filter(num => drawnFromPool.includes(num)).length
              if (matches === matchLevel) {
                winningCount++
              }
            }

            minWinningCombos = Math.min(minWinningCombos, winningCount)
          }

          coverageBreakdown.push({
            level: `${matchLevel}/${pickCount}`,
            combos: minWinningCombos === Infinity ? 0 : minWinningCombos,
            type: checkedLevels.includes(matchLevel) ? 'Selected' : 'Info',
          })
        }

        summary.push({
          label: 'Match breakdown',
          value: 'See table below',
        })

        // Update loading message
        setCoverageLoadingMessage('Building results table...')

        // Add all combinations to results
        const allResults = []
        let indexCounter = 1

        for (const combo of allCombos) {
          allResults.push({
            id: indexCounter,
            mains: formatNumbers(combo),
            coverageLevel: 'All combinations',
            breakdownData: coverageBreakdown,
          })
          indexCounter += 1
        }

        setCoverageSummary(summary)
        setCoverageResults(allResults)
        setCoverageHint(`${allResults.length.toLocaleString()} combinations generated from your pool.`)
      } catch (error) {
        setCoverageHint('An error occurred while generating coverage. Please try with a smaller pool.')
        console.error('Coverage generation error:', error)
      } finally {
        // Stop loading
        setIsCoverageGenerating(false)
        setCoverageLoadingMessage('')
      }
    }, 100)
  }

  const handleDownloadCoverage = () => {
    if (coverageResults.length === 0) {
      setCoverageHint('Generate coverage combinations before downloading.')
      return
    }

    const csv = toCSV([
      ['#', 'Mains', 'Coverage Level'],
      ...coverageResults.map((row) => [row.id, row.mains, row.coverageLevel]),
    ])

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'coverage-combinations.csv'
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
  }

  // Pagination
  const totalPages = Math.ceil(coverageResults.length / coverageRowsPerPage)
  const startIndex = (coverageCurrentPage - 1) * coverageRowsPerPage
  const endIndex = startIndex + coverageRowsPerPage
  const currentRows = coverageResults.slice(startIndex, endIndex)

  // Generate coverage level options dynamically
  const coverageLevelOptions = []
  for (let i = pickCount; i >= 2; i--) {
    coverageLevelOptions.push(i)
  }

  return (
    <main className="relative grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6 p-4 sm:p-6 max-w-[1800px] mx-auto">
      {/* LEFT: Controls */}
      <section className="relative bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/50 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-violet-500/5 pointer-events-none"></div>
        <div className="relative z-10">
          {/* Pool Selection */}
          <div className="mb-6">
            <label className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 font-black text-base mb-4 uppercase tracking-wider">
              Your Pool <span className="text-slate-400 text-xs normal-case font-medium">(select {minPool}–{maxPool})</span>
            </label>
            <div className="grid grid-cols-5 sm:grid-cols-7 gap-2 sm:gap-2.5 mb-4">
              {NUMBER_RANGE.map((num) => (
                <NumberChip
                  key={`coverage-pool-${num}`}
                  number={num}
                  selected={coveragePool.includes(num)}
                  onToggle={toggleCoveragePool}
                />
              ))}
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 px-4 py-2 rounded-full text-xs text-slate-300 font-medium">
                Selected: <strong className="text-blue-400 text-base">{coveragePool.length}</strong>
              </span>
              <button
                onClick={clearCoveragePool}
                className="bg-slate-700/50 border border-slate-600 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-600 hover:border-slate-500 transition-all duration-200"
              >
                Clear
              </button>
            </div>
          </div>

          <hr className="border-slate-700/50 my-6" />

          {/* Coverage Levels */}
          <div className="mb-6">
            <label className="block text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-orange-500 font-black text-base mb-4 uppercase tracking-wider">
              Coverage Levels
            </label>
            <div className="grid grid-cols-1 gap-3">
              {coverageLevelOptions.map((level) => (
                <label
                  key={`coverage-${level}`}
                  className="flex items-center gap-3 text-sm bg-slate-800/50 border-2 border-slate-600/50 px-4 py-3.5 rounded-xl hover:bg-slate-700/50 hover:border-blue-500/50 cursor-pointer transition-all duration-200 active:scale-95"
                >
                  <input
                    type="checkbox"
                    checked={coverageLevels[level] || false}
                    onChange={() => toggleCoverageLevel(level)}
                    className="w-5 h-5 rounded-lg border-2 border-slate-500 text-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 cursor-pointer transition-all"
                  />
                  <span className="text-slate-200 font-bold">{level}/{pickCount} Match</span>
                  <span className="ml-auto text-xs text-slate-400">Guarantee at least {level} matches</span>
                </label>
              ))}
            </div>
            <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
              <p className="text-xs text-slate-300 leading-relaxed">
                <strong className="text-cyan-400">How it works:</strong> Select coverage levels to find the minimum combinations needed.
                For example, {pickCount}/{pickCount} coverage guarantees you'll have at least one ticket with all {pickCount} matches,
                no matter which {pickCount} numbers are drawn from your pool.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-4 mb-6">
            <button
              onClick={handleGenerateCoverage}
              disabled={isCoverageGenerating}
              className="relative w-full bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-600 text-white px-6 py-5 rounded-2xl font-black text-lg shadow-2xl shadow-blue-500/50 hover:shadow-3xl hover:shadow-blue-500/70 transition-all duration-300 transform hover:scale-[1.03] active:scale-[0.98] overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-violet-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              <span className="relative z-10 flex items-center justify-center gap-2">
                {isCoverageGenerating ? '⏳ Processing...' : '✨ Calculate Coverage'}
              </span>
            </button>
            <button
              onClick={handleDownloadCoverage}
              className="w-full bg-slate-800/80 border-2 border-slate-600 px-6 py-4 rounded-2xl text-base font-bold hover:bg-slate-700 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-200"
            >
              📥 Download CSV
            </button>
          </div>

          {/* Hint */}
          {coverageHint && (
            <div className="text-sm rounded-2xl px-5 py-4 border-2 backdrop-blur-sm">
              {coverageHint.includes('generated') ? (
                <div className="bg-emerald-500/10 border-emerald-500/50 text-emerald-400 font-bold flex items-center gap-2">
                  <span className="text-lg">✓</span> {coverageHint}
                </div>
              ) : (
                <div className="bg-slate-700/30 border-slate-600/50 text-slate-300 font-medium">{coverageHint}</div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* RIGHT: Results */}
      <section className="relative bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/50 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-blue-500/5 pointer-events-none"></div>

        {/* Loading Overlay */}
        {isCoverageGenerating && <LoadingOverlay message={coverageLoadingMessage} />}

        <div className="relative z-10">
          {/* Summary */}
          <h3 className="text-3xl font-black mb-6 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Summary</h3>

          {coverageSummary.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {coverageSummary.map((card) => (
                <StatCard key={card.label} label={card.label} value={card.value} />
              ))}
            </div>
          )}

          {/* Coverage Breakdown Table */}
          {coverageResults.length > 0 && coverageResults[0]?.breakdownData && (
            <>
              <h3 className="text-3xl font-black mb-6 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-500">Coverage Breakdown</h3>
              <div className="border-2 border-slate-700/50 rounded-2xl bg-slate-900/60 backdrop-blur-sm shadow-inner mb-8 overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-800/95 backdrop-blur-md">
                    <tr className="border-b-2 border-emerald-500/30">
                      <th className="px-3 sm:px-4 py-4 text-left text-xs font-black uppercase tracking-widest text-slate-300">Coverage Level</th>
                      <th className="px-3 sm:px-4 py-4 text-right text-xs font-black uppercase tracking-widest text-slate-300">Combinations</th>
                      <th className="px-3 sm:px-4 py-4 text-left text-xs font-black uppercase tracking-widest text-slate-300">Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coverageResults[0].breakdownData.map((breakdown, idx) => (
                      <tr key={`${breakdown.level}-${idx}`} className={`hover:bg-emerald-500/10 transition-all duration-200 ${idx % 2 === 0 ? 'bg-slate-800/30' : 'bg-slate-800/50'}`}>
                        <td className="px-3 sm:px-4 py-3 text-sm font-bold text-slate-200 border-b border-slate-700/30">{breakdown.level}</td>
                        <td className="px-3 sm:px-4 py-3 text-sm text-right font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-500 border-b border-slate-700/30">{breakdown.combos}</td>
                        <td className="px-3 sm:px-4 py-3 text-sm border-b border-slate-700/30">
                          <span className={`inline-block text-xs px-3 py-1.5 rounded-full font-bold shadow-lg ${
                            breakdown.type === 'Primary'
                              ? 'bg-gradient-to-r from-cyan-500/30 to-blue-500/30 border border-cyan-400/50 text-cyan-300'
                              : 'bg-gradient-to-r from-green-500/30 to-emerald-500/30 border border-green-400/50 text-green-300'
                          }`}>
                            {breakdown.type}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Results */}
          <h3 className="text-3xl font-black mb-6 text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-500">Coverage Combinations</h3>

          {/* Pagination Controls - Top */}
          <PaginationControls
            currentPage={coverageCurrentPage}
            totalPages={totalPages}
            rowsPerPage={coverageRowsPerPage}
            totalRows={coverageResults.length}
            onPageChange={setCoverageCurrentPage}
            onRowsPerPageChange={(newRowsPerPage) => {
              setCoverageRowsPerPage(newRowsPerPage)
              setCoverageCurrentPage(1)
            }}
          />

          {/* Table */}
          <div className="border-2 border-slate-700/50 rounded-2xl bg-slate-900/60 backdrop-blur-sm shadow-inner mt-4 overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800/95 backdrop-blur-md">
                <tr className="border-b-2 border-blue-500/30">
                  <th className="px-3 sm:px-4 py-4 text-left text-xs font-black uppercase tracking-widest text-slate-300">#</th>
                  <th className="px-3 sm:px-4 py-4 text-left text-xs font-black uppercase tracking-widest text-slate-300">Mains</th>
                  <th className="px-3 sm:px-4 py-4 text-left text-xs font-black uppercase tracking-widest text-slate-300">Coverage Level</th>
                </tr>
              </thead>
              <tbody>
                {currentRows.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="px-4 py-12 text-center text-slate-400 text-sm">
                      No coverage combinations to display. Calculate coverage to see results here.
                    </td>
                  </tr>
                ) : (
                  currentRows.map((row, idx) => (
                    <tr key={row.id} className={`hover:bg-blue-500/10 transition-all duration-200 ${idx % 2 === 0 ? 'bg-slate-800/30' : 'bg-slate-800/50'}`}>
                      <td className="px-3 sm:px-4 py-3 text-sm text-slate-500 border-b border-slate-700/30 font-medium">{row.id}</td>
                      <td className="px-3 sm:px-4 py-3 text-sm font-bold text-slate-200 border-b border-slate-700/30">{row.mains}</td>
                      <td className="px-3 sm:px-4 py-3 text-sm border-b border-slate-700/30">
                        <span className="inline-block text-xs px-3 py-1.5 bg-gradient-to-r from-green-500/30 to-emerald-500/30 border border-green-400/50 rounded-full text-green-300 font-bold shadow-lg">
                          {row.coverageLevel}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls - Bottom */}
          {coverageResults.length > 0 && (
            <div className="mt-4">
              <PaginationControls
                currentPage={coverageCurrentPage}
                totalPages={totalPages}
                rowsPerPage={coverageRowsPerPage}
                totalRows={coverageResults.length}
                onPageChange={setCoverageCurrentPage}
                onRowsPerPageChange={(newRowsPerPage) => {
                  setCoverageRowsPerPage(newRowsPerPage)
                  setCoverageCurrentPage(1)
                }}
              />
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

function App() {
  const [activeTab, setActiveTab] = useState('coverage-analysis')
  const [selectedGame, setSelectedGame] = useState('texas-two-step')
  const [pool, setPool] = useState([])
  const [bonusCandidates, setBonusCandidates] = useState([])
  const [drawn, setDrawn] = useState([])
  const [drawnBonus, setDrawnBonus] = useState('')
  const [tiers, setTiers] = useState(() =>
    Object.fromEntries(GAME_CONFIGS['texas-two-step'].tiers.map((tier) => [tier.id, tier.defaultChecked]))
  )
  const [summaryCards, setSummaryCards] = useState([])
  const [rows, setRows] = useState([])
  const [hint, setHint] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(50)

  // Coverage Analysis Tab States
  const [coveragePool, setCoveragePool] = useState([])
  const [coverageLevels, setCoverageLevels] = useState({})
  const [coverageResults, setCoverageResults] = useState([])
  const [coverageSummary, setCoverageSummary] = useState([])
  const [coverageHint, setCoverageHint] = useState('')
  const [coverageCurrentPage, setCoverageCurrentPage] = useState(1)
  const [coverageRowsPerPage, setCoverageRowsPerPage] = useState(50)
  const [isCoverageGenerating, setIsCoverageGenerating] = useState(false)
  const [coverageLoadingMessage, setCoverageLoadingMessage] = useState('')

  // Game Configs Tab Loading States
  const [isGenerating, setIsGenerating] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('')

  const gameConfig = GAME_CONFIGS[selectedGame]
  const NUMBER_RANGE = Array.from(
    { length: gameConfig.mainNumbers.max },
    (_, idx) => idx + 1
  )
  const BONUS_RANGE = gameConfig.hasBonus
    ? Array.from({ length: gameConfig.bonusNumbers.max }, (_, idx) => idx + 1)
    : []

  const poolsOverlap = useMemo(() => pool.filter((value) => drawn.includes(value)), [pool, drawn])

  // Pagination calculations
  const totalPages = Math.ceil(rows.length / rowsPerPage)
  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = startIndex + rowsPerPage
  const currentRows = rows.slice(startIndex, endIndex)

  // Handle game change
  const handleGameChange = (newGame) => {
    setSelectedGame(newGame)
    setPool([])
    setBonusCandidates([])
    setDrawn([])
    setDrawnBonus('')
    setRows([])
    setSummaryCards([])
    setHint('')
    setCurrentPage(1)
    setTiers(
      Object.fromEntries(
        GAME_CONFIGS[newGame].tiers.map((tier) => [tier.id, tier.defaultChecked])
      )
    )

    // Reset coverage tab
    setCoveragePool([])
    setCoverageLevels({})
    setCoverageResults([])
    setCoverageSummary([])
    setCoverageHint('')
    setCoverageCurrentPage(1)
  }

  const togglePool = (number, currentlySelected) => {
    setPool((prev) => {
      if (currentlySelected) {
        return prev.filter((value) => value !== number)
      }
      if (prev.length >= gameConfig.poolRange.max) {
        setHint(`Pool is limited to ${gameConfig.poolRange.max} numbers. Remove one before adding another.`)
        return prev
      }
      return [...prev, number].sort((a, b) => a - b)
    })
  }

  const toggleBonus = (number, currentlySelected) => {
    setBonusCandidates((prev) => {
      if (currentlySelected) {
        return prev.filter((value) => value !== number)
      }
      if (prev.length >= gameConfig.bonusCandidatesMax) {
        setHint(`Bonus pool is limited to ${gameConfig.bonusCandidatesMax} candidates.`)
        return prev
      }
      return [...prev, number].sort((a, b) => a - b)
    })
  }

  const toggleDrawn = (number, currentlySelected) => {
    setDrawn((prev) => {
      if (currentlySelected) {
        const next = prev.filter((value) => value !== number)
        return next
      }
      if (prev.length >= gameConfig.mainNumbers.pick) {
        setHint(`Drawn mains are capped at ${gameConfig.mainNumbers.pick} numbers.`)
        return prev
      }
      return [...prev, number].sort((a, b) => a - b)
    })
  }

  const clearPool = () => setPool([])
  const clearBonus = () => setBonusCandidates([])
  const clearDraw = () => setDrawn([])

  const toggleTier = (tierId) => {
    setTiers((prev) => ({ ...prev, [tierId]: !prev[tierId] }))
  }

  const handleGenerate = () => {
    const trimmedBonus = drawnBonus.trim()
    const parsedDrawBonus = trimmedBonus === '' ? null : Number(trimmedBonus)

    setHint('')
    setSummaryCards([])
    setRows([])
    setCurrentPage(1) // Reset to first page

    const { pick: pickCount } = gameConfig.mainNumbers
    const minPool = gameConfig.poolRange.min
    const maxPool = gameConfig.poolRange.max

    if (pool.length < minPool) {
      setHint(`Select at least ${minPool} numbers in your pool.`)
      return
    }

    if (pool.length > maxPool) {
      setHint(`Pool cannot exceed ${maxPool} numbers.`)
      return
    }

    if (drawn.length !== pickCount) {
      setHint(`Choose exactly ${pickCount} drawn mains.`)
      return
    }

    if (gameConfig.hasBonus && trimmedBonus !== '') {
      const bonusMax = gameConfig.bonusNumbers.max
      if (Number.isNaN(parsedDrawBonus) || parsedDrawBonus < 1 || parsedDrawBonus > bonusMax) {
        setHint(`Drawn bonus must be a number between 1 and ${bonusMax} or left blank.`)
        return
      }
    }

    // Start loading
    setIsGenerating(true)
    setLoadingMessage('Generating combinations...')

    // Use setTimeout to allow UI to update before heavy computation
    setTimeout(() => {
      try {
        const K = poolsOverlap.length
        const totalPerBonus = nCk(pool.length, pickCount)

        // Calculate theoretical matches for different tiers
        const matchTheory = {}
        for (let i = pickCount; i >= 2; i--) {
          const matched = nCk(K, i)
          const unmatched = i < pickCount ? nCk(pool.length - K, pickCount - i) : 1
          matchTheory[i] = matched * unmatched
        }
        const bonusPoolCount = bonusCandidates.length

        const summary = [
          { label: 'Pool size', value: pool.length.toLocaleString() },
          { label: 'Drawn numbers', value: formatNumbers(drawn) },
          { label: 'Matching numbers (K)', value: K.toLocaleString() },
          { label: `Main combos (${pickCount}-number)`, value: totalPerBonus.toLocaleString() },
        ]

        // Add match theory cards dynamically
        for (let i = pickCount; i >= Math.max(2, pickCount - 3); i--) {
          if (matchTheory[i] !== undefined) {
            summary.push({
              label: `${i}/${pickCount} (theory)`,
              value: matchTheory[i].toLocaleString(),
            })
          }
        }

        if (bonusPoolCount > 0) {
          const bonusHit = parsedDrawBonus != null && bonusCandidates.includes(parsedDrawBonus)
          summary.push({ label: 'Bonus candidates', value: bonusCandidates.join(', ') || '—' })
          summary.push({ label: 'Drawn bonus', value: parsedDrawBonus ?? '—' })
          summary.push({ label: 'Bonus hit?', value: bonusHit ? 'Yes' : 'No' })
          summary.push({
            label: 'Total tickets',
            value: (totalPerBonus * bonusPoolCount).toLocaleString(),
          })
        }

        // Update loading message
        setLoadingMessage('Building results table...')

        const mainsTickets = kCombinations(pool, pickCount)
        const bonuses = gameConfig.hasBonus && bonusPoolCount > 0 ? bonusCandidates : [null]
        const bonusLogicActive = gameConfig.hasBonus && parsedDrawBonus != null && bonusPoolCount > 0

        const activeRows = []
        let indexCounter = 1
        const TIER_LABEL = Object.fromEntries(gameConfig.tiers.map((tier) => [tier.id, tier.label]))

        for (const ticket of mainsTickets) {
          const matchedMains = ticket.filter((value) => drawn.includes(value)).length

          for (const bonus of bonuses) {
            const bonusHit = bonusLogicActive && bonus === parsedDrawBonus
            let tierKey = null

            // Dynamic tier key generation based on matches
            if (gameConfig.hasBonus) {
              tierKey = bonusHit ? `${matchedMains}of${pickCount}b` : `${matchedMains}of${pickCount}`
            } else {
              tierKey = `${matchedMains}of${pickCount}`
            }

            if (!tiers[tierKey]) {
              continue
            }

            activeRows.push({
              id: indexCounter,
              mains: formatNumbers(ticket),
              bonus: bonus ?? '—',
              match: matchedMains,
              bonusHit: bonusLogicActive ? (bonusHit ? 'Yes' : 'No') : '—',
              tier: TIER_LABEL[tierKey] || tierKey,
            })
            indexCounter += 1
          }
        }

        // Add filtered results count to summary
        summary.splice(4, 0, {
          label: 'Filtered results',
          value: activeRows.length.toLocaleString(),
          tooltip: 'Combinations matching your selected tiers (shown in table below)'
        })

        if (activeRows.length > 12000) {
          setHint(`Large output (${activeRows.length.toLocaleString()} rows). Consider narrowing tiers or reducing pool size.`)
        } else {
          setHint(`${activeRows.length.toLocaleString()} rows generated.`)
        }

        setSummaryCards(summary)
        setRows(activeRows)
      } catch (error) {
        setHint('An error occurred while generating combinations. Please try with a smaller pool.')
        console.error('Generation error:', error)
      } finally {
        // Stop loading
        setIsGenerating(false)
        setLoadingMessage('')
      }
    }, 100)
  }

  const handleDownload = () => {
    if (rows.length === 0) {
      setHint('Generate combinations before downloading a CSV.')
      return
    }

    const csv = toCSV([
      ['#', 'Mains', 'Bonus', 'Match (mains)', 'Bonus hit', 'Tier'],
      ...rows.map((row) => [row.id, row.mains, row.bonus, row.match, row.bonusHit, row.tier]),
    ])

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'two-step-combinations.csv'
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950/20 to-slate-950 text-slate-100">
      {/* Animated background gradient overlay */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-violet-900/20 pointer-events-none"></div>

      {/* Header */}
      <header className="relative border-b border-slate-800/50 bg-slate-900/60 backdrop-blur-xl px-6 py-6 sm:py-8 shadow-2xl">
        <div className="max-w-[1800px] mx-auto">
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500 bg-clip-text text-transparent drop-shadow-2xl">
            {gameConfig.name}
          </h1>
          <p className="text-slate-300 text-sm sm:text-lg font-medium mt-2 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            {gameConfig.description}
          </p>

          {/* Game Selector */}
          <div className="mt-6 flex flex-wrap gap-2">
            {Object.entries(GAME_CONFIGS).map(([key, config]) => (
              <button
                key={key}
                onClick={() => handleGameChange(key)}
                className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 ${
                  selectedGame === key
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-blue-500/50 scale-105'
                    : 'bg-slate-800/80 text-slate-300 border-2 border-slate-700 hover:border-blue-500/50 hover:bg-slate-700'
                }`}
              >
                {config.name}
              </button>
            ))}
          </div>

          {/* Tab Navigation */}
          <div className="mt-6 flex gap-2 border-b border-slate-700/50">
            <button
              onClick={() => setActiveTab('coverage-analysis')}
              className={`px-6 py-3 font-bold text-sm transition-all duration-200 border-b-4 ${
                activeTab === 'coverage-analysis'
                  ? 'border-cyan-500 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              Coverage Analysis
            </button>
            <button
              onClick={() => setActiveTab('game-configs')}
              className={`px-6 py-3 font-bold text-sm transition-all duration-200 border-b-4 ${
                activeTab === 'game-configs'
                  ? 'border-cyan-500 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              Game Configs
            </button>
          </div>
        </div>
      </header>

      {/* Game Configs Tab */}
      {activeTab === 'game-configs' && (
      <main className="relative grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6 p-4 sm:p-6 max-w-[1800px] mx-auto">
        {/* LEFT: Controls */}
        <section className="relative bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/50 overflow-hidden">
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-violet-500/5 pointer-events-none"></div>
          <div className="relative z-10">
          {/* Game Range */}
          <div className="flex justify-between items-center mb-6">
            <label className="text-slate-200 font-bold text-sm uppercase tracking-wide">Game Range</label>
            <span className="inline-flex items-center gap-2 bg-slate-700/50 border border-slate-600 px-4 py-2 rounded-full text-xs text-slate-300 font-medium">
              Mains: {gameConfig.mainNumbers.min}–{gameConfig.mainNumbers.max}
              {gameConfig.hasBonus && ` · Bonus: ${gameConfig.bonusNumbers.min}–${gameConfig.bonusNumbers.max}`}
            </span>
          </div>

          {/* Pool Selection */}
          <div className="mb-6">
            <label className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 font-black text-base mb-4 uppercase tracking-wider">
              Your Pool <span className="text-slate-400 text-xs normal-case font-medium">(select {gameConfig.poolRange.min}–{gameConfig.poolRange.max})</span>
            </label>
            <div className="grid grid-cols-5 sm:grid-cols-7 gap-2 sm:gap-2.5 mb-4">
              {NUMBER_RANGE.map((num) => (
                <NumberChip
                  key={`pool-${num}`}
                  number={num}
                  selected={pool.includes(num)}
                  onToggle={togglePool}
                />
              ))}
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 px-4 py-2 rounded-full text-xs text-slate-300 font-medium">
                Selected: <strong className="text-blue-400 text-base">{pool.length}</strong>
              </span>
              <button
                onClick={clearPool}
                className="bg-slate-700/50 border border-slate-600 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-600 hover:border-slate-500 transition-all duration-200"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Bonus Selection - Only show if game has bonus */}
          {gameConfig.hasBonus && (
            <>
              <div className="mb-6">
                <label className="block text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-500 font-black text-base mb-4 uppercase tracking-wider">
                  Bonus Candidates <span className="text-slate-400 text-xs normal-case font-medium">(optional, 0–{gameConfig.bonusCandidatesMax})</span>
                </label>
                <div className="grid grid-cols-5 sm:grid-cols-7 gap-2 sm:gap-2.5 mb-4">
                  {BONUS_RANGE.map((num) => (
                    <NumberChip
                      key={`bonus-${num}`}
                      number={num}
                      selected={bonusCandidates.includes(num)}
                      onToggle={toggleBonus}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 px-4 py-2 rounded-full text-xs text-slate-300 font-medium">
                    Selected: <strong className="text-purple-400 text-base">{bonusCandidates.length}</strong>
                  </span>
                  <button
                    onClick={clearBonus}
                    className="bg-slate-700/50 border border-slate-600 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-600 hover:border-slate-500 transition-all duration-200"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <hr className="border-slate-700/50 my-6" />
            </>
          )}

          {/* Drawn Mains */}
          <div className="mb-6">
            <label className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-500 font-black text-base mb-4 uppercase tracking-wider">
              Drawn Mains <span className="text-slate-400 text-xs normal-case font-medium">(exactly {gameConfig.mainNumbers.pick})</span>
            </label>
            <div className="grid grid-cols-5 sm:grid-cols-7 gap-2 sm:gap-2.5 mb-4">
              {NUMBER_RANGE.map((num) => (
                <NumberChip
                  key={`draw-${num}`}
                  number={num}
                  selected={drawn.includes(num)}
                  onToggle={toggleDrawn}
                />
              ))}
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 px-4 py-2 rounded-full text-xs text-slate-300 font-medium">
                Chosen: <strong className="text-green-400 text-base">{drawn.length}</strong>/{gameConfig.mainNumbers.pick}
              </span>
              <button
                onClick={clearDraw}
                className="bg-slate-700/50 border border-slate-600 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-600 hover:border-slate-500 transition-all duration-200"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Drawn Bonus - Only show if game has bonus */}
          {gameConfig.hasBonus && (
            <>
              <div className="mb-6">
                <label className="block text-slate-200 font-bold text-sm mb-3 uppercase tracking-wide">
                  Drawn Bonus <span className="text-slate-400 text-xs normal-case">(optional)</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={gameConfig.bonusNumbers.min}
                    max={gameConfig.bonusNumbers.max}
                    placeholder="—"
                    value={drawnBonus}
                    onChange={(event) => setDrawnBonus(event.target.value)}
                    className="w-24 px-4 py-3 rounded-xl border-2 border-slate-600 bg-slate-700/50 text-slate-100 text-sm font-semibold focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                  <span className="text-slate-400 text-xs">Leave empty to ignore bonus tiers</span>
                </div>
              </div>

              <hr className="border-slate-700/50 my-6" />
            </>
          )}

          {/* Tiers */}
          <div className="mb-6">
            <label className="block text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-orange-500 font-black text-base mb-4 uppercase tracking-wider">Show Tiers</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {gameConfig.tiers.map((tier) => (
                <label key={tier.id} className="flex items-center gap-3 text-sm bg-slate-800/50 border-2 border-slate-600/50 px-4 py-3.5 rounded-xl hover:bg-slate-700/50 hover:border-blue-500/50 cursor-pointer transition-all duration-200 active:scale-95">
                  <input
                    type="checkbox"
                    checked={tiers[tier.id]}
                    onChange={() => toggleTier(tier.id)}
                    className="w-5 h-5 rounded-lg border-2 border-slate-500 text-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 cursor-pointer transition-all"
                  />
                  <span className="text-slate-200 font-bold">{tier.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-4 mb-6">
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="relative w-full bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-600 text-white px-6 py-5 rounded-2xl font-black text-lg shadow-2xl shadow-blue-500/50 hover:shadow-3xl hover:shadow-blue-500/70 transition-all duration-300 transform hover:scale-[1.03] active:scale-[0.98] overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-violet-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              <span className="relative z-10 flex items-center justify-center gap-2">
                {isGenerating ? '⏳ Processing...' : '✨ Generate Combinations'}
              </span>
            </button>
            <button
              onClick={handleDownload}
              className="w-full bg-slate-800/80 border-2 border-slate-600 px-6 py-4 rounded-2xl text-base font-bold hover:bg-slate-700 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-200"
            >
              📥 Download CSV
            </button>
          </div>

          {/* Hint */}
          {hint && (
            <div className="text-sm rounded-2xl px-5 py-4 border-2 backdrop-blur-sm">
              {hint.includes('Large output') ? (
                <div className="bg-red-500/10 border-red-500/50 text-red-400 font-bold">{hint}</div>
              ) : hint.includes('generated') ? (
                <div className="bg-emerald-500/10 border-emerald-500/50 text-emerald-400 font-bold flex items-center gap-2">
                  <span className="text-lg">✓</span> {hint}
                </div>
              ) : (
                <div className="bg-slate-700/30 border-slate-600/50 text-slate-300 font-medium">{hint}</div>
              )}
            </div>
          )}
          </div>
        </section>

        {/* RIGHT: Output */}
        <section className="relative bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/50 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-blue-500/5 pointer-events-none"></div>

          {/* Loading Overlay */}
          {isGenerating && <LoadingOverlay message={loadingMessage} />}

          <div className="relative z-10">
          {/* Summary */}
          <h3 className="text-3xl font-black mb-6 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Summary</h3>

          {summaryCards.length > 0 && (
            <>
              {/* Explanation Card */}
              <div className="mb-6 p-5 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-2 border-blue-500/30 rounded-2xl">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">💡</div>
                  <div className="flex-1">
                    <h4 className="text-cyan-400 font-bold text-base mb-2">Understanding the Numbers:</h4>
                    <div className="text-slate-300 text-sm space-y-2">
                      <div className="flex items-start gap-2">
                        <span className="text-cyan-400 font-bold min-w-[140px]">Main combos:</span>
                        <span>All possible {gameConfig.mainNumbers.pick}-number combinations from your pool</span>
                      </div>
                      {bonusCandidates.length > 0 && (
                        <div className="flex items-start gap-2">
                          <span className="text-violet-400 font-bold min-w-[140px]">Total tickets:</span>
                          <span>Main combos × {bonusCandidates.length} bonus numbers = Every possible ticket</span>
                        </div>
                      )}
                      <div className="flex items-start gap-2">
                        <span className="text-green-400 font-bold min-w-[140px]">Filtered results:</span>
                        <span>Only tickets matching your checked tiers (shown in table)</span>
                      </div>
                    </div>
                    {bonusCandidates.length > 0 && (
                      <div className="mt-3 p-3 bg-violet-500/10 border border-violet-500/30 rounded-lg">
                        <div className="text-xs text-violet-300">
                          <strong>Example:</strong> If you have 5 main combos and 3 bonus candidates, you get 5 × 3 = <strong>15 total tickets</strong>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
                {summaryCards.map((card) => (
                  <StatCard key={card.label} label={card.label} value={card.value} />
                ))}
              </div>
            </>
          )}

          {/* Combinations */}
          <h3 className="text-3xl font-black mb-6 text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-500">Combinations</h3>

          {/* Pagination Controls - Top */}
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            rowsPerPage={rowsPerPage}
            totalRows={rows.length}
            onPageChange={setCurrentPage}
            onRowsPerPageChange={(newRowsPerPage) => {
              setRowsPerPage(newRowsPerPage)
              setCurrentPage(1)
            }}
          />

          {/* Table */}
          <div className="border-2 border-slate-700/50 rounded-2xl bg-slate-900/60 backdrop-blur-sm shadow-inner mt-4 overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800/95 backdrop-blur-md">
                <tr className="border-b-2 border-blue-500/30">
                  <th className="px-3 sm:px-4 py-4 text-left text-xs font-black uppercase tracking-widest text-slate-300">#</th>
                  <th className="px-3 sm:px-4 py-4 text-left text-xs font-black uppercase tracking-widest text-slate-300">Mains</th>
                  <th className="px-3 sm:px-4 py-4 text-left text-xs font-black uppercase tracking-widest text-slate-300">Bonus</th>
                  <th className="px-3 sm:px-4 py-4 text-right text-xs font-black uppercase tracking-widest text-slate-300">Match</th>
                  <th className="px-3 sm:px-4 py-4 text-left text-xs font-black uppercase tracking-widest text-slate-300 hidden sm:table-cell">Bonus Hit</th>
                  <th className="px-3 sm:px-4 py-4 text-left text-xs font-black uppercase tracking-widest text-slate-300">Tier</th>
                </tr>
              </thead>
              <tbody>
                {currentRows.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-12 text-center text-slate-400 text-sm">
                      No combinations to display. Generate results to see combinations here.
                    </td>
                  </tr>
                ) : (
                  currentRows.map((row, idx) => (
                    <tr key={row.id} className={`hover:bg-blue-500/10 transition-all duration-200 ${idx % 2 === 0 ? 'bg-slate-800/30' : 'bg-slate-800/50'}`}>
                      <td className="px-3 sm:px-4 py-3 text-sm text-slate-500 border-b border-slate-700/30 font-medium">{row.id}</td>
                      <td className="px-3 sm:px-4 py-3 text-sm font-bold text-slate-200 border-b border-slate-700/30">{row.mains}</td>
                      <td className="px-3 sm:px-4 py-3 text-sm text-slate-300 border-b border-slate-700/30 font-medium">{row.bonus}</td>
                      <td className="px-3 sm:px-4 py-3 text-sm text-right font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 border-b border-slate-700/30">{row.match}</td>
                      <td className="px-3 sm:px-4 py-3 text-sm text-slate-300 border-b border-slate-700/30 font-medium hidden sm:table-cell">{row.bonusHit}</td>
                      <td className="px-3 sm:px-4 py-3 text-sm border-b border-slate-700/30">
                        <span className="inline-block text-xs px-3 py-1.5 bg-gradient-to-r from-blue-500/30 to-violet-500/30 border border-blue-400/50 rounded-full text-blue-300 font-bold shadow-lg">
                          {row.tier}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls - Bottom */}
          {rows.length > 0 && (
            <div className="mt-4">
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                rowsPerPage={rowsPerPage}
                totalRows={rows.length}
                onPageChange={setCurrentPage}
                onRowsPerPageChange={(newRowsPerPage) => {
                  setRowsPerPage(newRowsPerPage)
                  setCurrentPage(1)
                }}
              />
            </div>
          )}
          </div>
        </section>
      </main>
      )}

      {/* Coverage Analysis Tab */}
      {activeTab === 'coverage-analysis' && (
        <CoverageAnalysisTab
          gameConfig={gameConfig}
          NUMBER_RANGE={NUMBER_RANGE}
          coveragePool={coveragePool}
          setCoveragePool={setCoveragePool}
          coverageLevels={coverageLevels}
          setCoverageLevels={setCoverageLevels}
          coverageResults={coverageResults}
          setCoverageResults={setCoverageResults}
          coverageSummary={coverageSummary}
          setCoverageSummary={setCoverageSummary}
          coverageHint={coverageHint}
          setCoverageHint={setCoverageHint}
          coverageCurrentPage={coverageCurrentPage}
          setCoverageCurrentPage={setCoverageCurrentPage}
          coverageRowsPerPage={coverageRowsPerPage}
          setCoverageRowsPerPage={setCoverageRowsPerPage}
          isCoverageGenerating={isCoverageGenerating}
          setIsCoverageGenerating={setIsCoverageGenerating}
          coverageLoadingMessage={coverageLoadingMessage}
          setCoverageLoadingMessage={setCoverageLoadingMessage}
        />
      )}
    </div>
  )
}

export default App