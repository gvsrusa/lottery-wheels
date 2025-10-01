import { useMemo, useState } from 'react'
import { GAME_CONFIGS } from './utils/constants'
import { nCk, kCombinations } from './utils/combinatorics'
import { toCSV } from './utils/formatters'
import { WheelBuilderTab } from './components/tabs/WheelBuilderTab'
import { CoverageAnalysisTab } from './components/tabs/CoverageAnalysisTab'

function App() {
  const [activeTab, setActiveTab] = useState('wheel-builder')
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
  const [loading, setLoading] = useState(false)

  // Wheel Builder Tab States
  const [wheelPool, setWheelPool] = useState([])
  const [wheelGuarantee, setWheelGuarantee] = useState('4') // '4', '3', '2'
  const [wheelResults, setWheelResults] = useState([])
  const [wheelSummary, setWheelSummary] = useState([])
  const [wheelHint, setWheelHint] = useState('')
  const [wheelCurrentPage, setWheelCurrentPage] = useState(1)
  const [wheelRowsPerPage, setWheelRowsPerPage] = useState(50)
  const [wheelLoading, setWheelLoading] = useState(false)

  // Coverage Analysis Tab States
  const [coveragePool, setCoveragePool] = useState([])
  const [coverageGuarantee, setCoverageGuarantee] = useState('4') // '4', '3', '2'
  const [coverageResults, setCoverageResults] = useState([])
  const [coverageSummary, setCoverageSummary] = useState([])
  const [coverageHint, setCoverageHint] = useState('')
  const [coverageCurrentPage, setCoverageCurrentPage] = useState(1)
  const [coverageRowsPerPage, setCoverageRowsPerPage] = useState(50)
  const [coverageLoading, setCoverageLoading] = useState(false)
  const [coverageBreakdown, setCoverageBreakdown] = useState([])

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

    // Reset wheel builder tab
    setWheelPool([])
    setWheelGuarantee('4')
    setWheelResults([])
    setWheelSummary([])
    setWheelHint('')
    setWheelCurrentPage(1)

    // Reset coverage tab
    setCoveragePool([])
    setCoverageGuarantee('4')
    setCoverageResults([])
    setCoverageSummary([])
    setCoverageHint('')
    setCoverageCurrentPage(1)
    setCoverageBreakdown([])
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

  const clearPool = () => setPool([])

  const toggleBonusCandidate = (number, currentlySelected) => {
    setBonusCandidates((prev) => {
      if (currentlySelected) {
        return prev.filter((value) => value !== number)
      }
      if (prev.length >= gameConfig.bonusCandidatesMax) {
        setHint(`Bonus candidates are limited to ${gameConfig.bonusCandidatesMax}. Remove one before adding another.`)
        return prev
      }
      return [...prev, number].sort((a, b) => a - b)
    })
  }

  const clearBonusCandidates = () => setBonusCandidates([])

  const toggleDrawn = (number, currentlySelected) => {
    setDrawn((prev) => {
      if (currentlySelected) {
        return prev.filter((value) => value !== number)
      }
      if (prev.length >= gameConfig.mainNumbers.pick) {
        setHint(`You can only select ${gameConfig.mainNumbers.pick} drawn numbers.`)
        return prev
      }
      return [...prev, number].sort((a, b) => a - b)
    })
  }

  const clearDrawn = () => {
    setDrawn([])
    setDrawnBonus('')
  }

  const handleGenerate = () => {
    setHint('')
    setSummaryCards([])
    setRows([])
    setCurrentPage(1)

    if (pool.length < gameConfig.poolRange.min) {
      setHint(`Select at least ${gameConfig.poolRange.min} numbers in your pool.`)
      return
    }

    if (pool.length > gameConfig.poolRange.max) {
      setHint(`Pool cannot exceed ${gameConfig.poolRange.max} numbers.`)
      return
    }

    if (drawn.length !== gameConfig.mainNumbers.pick) {
      setHint(`Please select exactly ${gameConfig.mainNumbers.pick} drawn main numbers.`)
      return
    }

    if (gameConfig.hasBonus && bonusCandidates.length > 0 && !drawnBonus) {
      setHint('Specify a drawn bonus number or clear bonus candidates.')
      return
    }

    // Start loading
    setLoading(true)

    // Use setTimeout to allow UI to update with loading state
    setTimeout(() => {
      try {
        const { pick } = gameConfig.mainNumbers
        const allMainCombinations = kCombinations(pool, pick)
        const bonusOptions = bonusCandidates.length > 0 ? bonusCandidates : [null]

        const expandedCombinations = []
        for (const mains of allMainCombinations) {
          for (const bonus of bonusOptions) {
            expandedCombinations.push({
              mains,
              bonus,
            })
          }
        }

        const selectedTiers = Object.keys(tiers).filter((tierId) => tiers[tierId])
        const bonusMatch = drawnBonus && bonusCandidates.includes(Number(drawnBonus))

        const results = expandedCombinations.map((combo, index) => {
          const mainMatches = combo.mains.filter((n) => drawn.includes(n)).length
          const hasBonus = combo.bonus !== null && combo.bonus === Number(drawnBonus)
          const tier = matchesToTier(mainMatches, hasBonus, gameConfig)
          return {
            id: index + 1,
            mains: combo.mains.join('-'),
            bonus: combo.bonus !== null ? combo.bonus.toString() : '—',
            match: `${mainMatches}/${pick}`,
            bonusHit: combo.bonus !== null ? (hasBonus ? 'Yes' : 'No') : '—',
            tier: tier || '—',
          }
        })

        const filteredResults = results.filter((row) => {
          if (row.tier === '—') return false
          return selectedTiers.includes(row.tier.split(' ')[0])
        })

        const matchingSummary = summarizeResults(filteredResults, allMainCombinations.length, bonusOptions.length, drawn, drawnBonus, bonusMatch, gameConfig)
        setSummaryCards(matchingSummary)
        setRows(filteredResults)

        if (filteredResults.length === 0) {
          setHint('No combinations match the selected prize tiers.')
        } else {
          setHint(`${filteredResults.length.toLocaleString()} combinations generated!`)
        }
      } finally {
        setLoading(false)
      }
    }, 100)
  }

  function matchesToTier(mainMatches, hasBonus, gameConfig) {
    const { pick } = gameConfig.mainNumbers
    if (mainMatches === pick && hasBonus) return '4of4b 4/4 + Bonus'
    if (mainMatches === pick) return '4of4 4/4'
    if (mainMatches === pick - 1 && hasBonus) return '3of4b 3/4 + Bonus'
    if (mainMatches === pick - 1) return '3of4 3/4'
    if (mainMatches === pick - 2 && hasBonus) return '2of4b 2/4 + Bonus'
    if (mainMatches === pick - 2) return '2of4 2/4'
    return null
  }

  function summarizeResults(filteredResults, totalMainCombos, bonusOptionsLength, drawn, drawnBonus, bonusMatch, gameConfig) {
    const overlapCount = poolsOverlap.length
    const noOverlapCount = pool.length - overlapCount

    const summary = [
      { label: 'Pool size', value: pool.length.toLocaleString() },
      { label: 'Overlap with drawn', value: `${overlapCount}/${gameConfig.mainNumbers.pick}` },
      { label: 'Main combinations', value: totalMainCombos.toLocaleString() },
    ]

    if (bonusOptionsLength > 1) {
      summary.push({ label: 'Bonus options', value: bonusOptionsLength.toLocaleString() })
      summary.push({ label: 'Total combinations', value: (totalMainCombos * bonusOptionsLength).toLocaleString() })
    }

    summary.push({ label: 'Matching results', value: filteredResults.length.toLocaleString() })

    return summary
  }

  const handleDownload = () => {
    if (rows.length === 0) {
      setHint('Generate results before downloading.')
      return
    }

    const csv = toCSV([
      ['#', 'Mains', 'Bonus', 'Match', 'Bonus Hit', 'Tier'],
      ...rows.map((row) => [row.id, row.mains, row.bonus, row.match, row.bonusHit, row.tier]),
    ])

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'lottery-combinations.csv'
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-2xl bg-slate-900/90 border-b border-slate-700/50 shadow-2xl shadow-black/50">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <h1 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-600 drop-shadow-2xl tracking-tight">
              🎰 Lottery Wheels
            </h1>
            <select
              value={selectedGame}
              onChange={(e) => handleGameChange(e.target.value)}
              className="bg-slate-800/80 border-2 border-slate-600 px-4 py-3 rounded-xl text-base font-semibold focus:outline-none focus:ring-4 focus:ring-blue-500/50 hover:bg-slate-700 transition-all cursor-pointer shadow-lg"
            >
              {Object.entries(GAME_CONFIGS).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 mt-6">
        <div className="flex gap-2 border-b-2 border-slate-700/50">
          <button
            onClick={() => setActiveTab('wheel-builder')}
            className={`px-6 py-3 font-bold text-sm transition-all duration-200 border-b-2 ${
              activeTab === 'wheel-builder'
                ? 'text-cyan-400 border-cyan-400'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            Wheel Builder
          </button>
          <button
            onClick={() => setActiveTab('coverage-analysis')}
            className={`px-6 py-3 font-bold text-sm transition-all duration-200 border-b-2 ${
              activeTab === 'coverage-analysis'
                ? 'text-cyan-400 border-cyan-400'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            Coverage Analysis
          </button>
        </div>
      </div>

      {/* Wheel Builder Tab */}
      {activeTab === 'wheel-builder' && (
        <WheelBuilderTab
          gameConfig={gameConfig}
          NUMBER_RANGE={NUMBER_RANGE}
          wheelPool={wheelPool}
          setWheelPool={setWheelPool}
          wheelGuarantee={wheelGuarantee}
          setWheelGuarantee={setWheelGuarantee}
          wheelResults={wheelResults}
          setWheelResults={setWheelResults}
          wheelSummary={wheelSummary}
          setWheelSummary={setWheelSummary}
          wheelHint={wheelHint}
          setWheelHint={setWheelHint}
          wheelCurrentPage={wheelCurrentPage}
          setWheelCurrentPage={setWheelCurrentPage}
          wheelRowsPerPage={wheelRowsPerPage}
          setWheelRowsPerPage={setWheelRowsPerPage}
          wheelLoading={wheelLoading}
          setWheelLoading={setWheelLoading}
        />
      )}

      {/* Coverage Analysis Tab */}
      {activeTab === 'coverage-analysis' && (
        <CoverageAnalysisTab
          gameConfig={gameConfig}
          NUMBER_RANGE={NUMBER_RANGE}
          coveragePool={coveragePool}
          setCoveragePool={setCoveragePool}
          coverageGuarantee={coverageGuarantee}
          setCoverageGuarantee={setCoverageGuarantee}
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
          coverageLoading={coverageLoading}
          setCoverageLoading={setCoverageLoading}
          coverageBreakdown={coverageBreakdown}
          setCoverageBreakdown={setCoverageBreakdown}
        />
      )}
    </div>
  )
}

export default App
