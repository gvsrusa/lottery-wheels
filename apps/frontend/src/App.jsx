import { useState } from 'react'
import { GAME_CONFIGS } from './constants/gameConfigs'
import { CoverageAnalysisTab } from './components/CoverageAnalysisTab'
import { GameConfigsTab } from './components/GameConfigsTab'
import { WheelBuilderTab } from './components/WheelBuilderTab'

function App() {
  const [activeTab, setActiveTab] = useState('wheel-builder')
  const [selectedState, setSelectedState] = useState('TX')
  const [selectedGame, setSelectedGame] = useState('texas-two-step')
  const [pool, setPool] = useState([])
  const [bonusCandidates, setBonusCandidates] = useState([])
  const [drawn, setDrawn] = useState([])
  const [drawnBonus, setDrawnBonus] = useState('')
  const [tiers, setTiers] = useState(() =>
    Object.fromEntries(
      GAME_CONFIGS['TX'].games['texas-two-step'].tiers.map((tier) => [
        tier.id,
        tier.defaultChecked,
      ])
    )
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

  const gameConfig = GAME_CONFIGS[selectedState].games[selectedGame]
  const NUMBER_RANGE = Array.from(
    { length: gameConfig.mainNumbers.max },
    (_, idx) => idx + 1
  )
  const BONUS_RANGE = gameConfig.hasBonus
    ? Array.from({ length: gameConfig.bonusNumbers.max }, (_, idx) => idx + 1)
    : []

  // Handle state change
  const handleStateChange = (newState) => {
    setSelectedState(newState)
    const newGame = Object.keys(GAME_CONFIGS[newState].games)[0]
    handleGameChange(newGame, newState)
  }

  // Handle game change
  const handleGameChange = (newGame, newState = selectedState) => {
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
        GAME_CONFIGS[newState].games[newGame].tiers.map((tier) => [
          tier.id,
          tier.defaultChecked,
        ])
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950/20 to-slate-950 text-slate-100">
      {/* Animated background gradient overlay */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-violet-900/20 pointer-events-none"></div>

      {/* Header */}
      <header className="relative border-b border-slate-800/50 bg-slate-900/60 backdrop-blur-xl px-4 sm:px-6 py-4 sm:py-6 shadow-2xl">
        <div className="max-w-[1800px] mx-auto">
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500 bg-clip-text text-transparent drop-shadow-2xl">
            {gameConfig.name}
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm md:text-lg font-medium mt-2 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            <span className="line-clamp-2">{gameConfig.description}</span>
          </p>

          {/* State Selector */}
          <div className="mt-4 sm:mt-6 flex flex-wrap gap-2">
            {Object.entries(GAME_CONFIGS).map(([stateCode, config]) => (
              <button
                key={stateCode}
                onClick={() => handleStateChange(stateCode)}
                className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 min-h-[44px] touch-manipulation ${selectedState === stateCode
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-500/50'
                  : 'bg-slate-800/80 text-slate-300 border-2 border-slate-700 hover:border-purple-500/50 hover:bg-slate-700'
                  }`}
              >
                {config.name}
              </button>
            ))}
          </div>

          {/* Game Selector */}
          <div className="mt-4 flex flex-wrap gap-2">
            {Object.entries(GAME_CONFIGS[selectedState].games).map(([key, config]) => (
              <button
                key={key}
                onClick={() => handleGameChange(key)}
                className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 min-h-[44px] touch-manipulation ${selectedGame === key
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-blue-500/50'
                  : 'bg-slate-800/80 text-slate-300 border-2 border-slate-700 hover:border-blue-500/50 hover:bg-slate-700'
                  }`}
              >
                {config.name}
              </button>
            ))}
          </div>

          {/* Tab Navigation */}
          <div className="mt-4 sm:mt-6 flex flex-wrap gap-2 border-b border-slate-700/50 pb-0">
            <button
              onClick={() => setActiveTab('wheel-builder')}
              className={`px-3 sm:px-6 py-2 sm:py-3 font-bold text-xs sm:text-sm transition-all duration-200 border-b-4 min-h-[44px] touch-manipulation ${activeTab === 'wheel-builder'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-300'
                }`}
            >
              Wheel Builder
            </button>
            <button
              onClick={() => setActiveTab('coverage-analysis')}
              className={`px-3 sm:px-6 py-2 sm:py-3 font-bold text-xs sm:text-sm transition-all duration-200 border-b-4 min-h-[44px] touch-manipulation ${activeTab === 'coverage-analysis'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-300'
                }`}
            >
              Coverage Analysis
            </button>
            <button
              onClick={() => setActiveTab('game-configs')}
              className={`px-3 sm:px-6 py-2 sm:py-3 font-bold text-xs sm:text-sm transition-all duration-200 border-b-4 min-h-[44px] touch-manipulation ${activeTab === 'game-configs'
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
        <GameConfigsTab
          gameConfig={gameConfig}
          NUMBER_RANGE={NUMBER_RANGE}
          BONUS_RANGE={BONUS_RANGE}
          pool={pool}
          setPool={setPool}
          bonusCandidates={bonusCandidates}
          setBonusCandidates={setBonusCandidates}
          drawn={drawn}
          setDrawn={setDrawn}
          drawnBonus={drawnBonus}
          setDrawnBonus={setDrawnBonus}
          tiers={tiers}
          setTiers={setTiers}
          summaryCards={summaryCards}
          setSummaryCards={setSummaryCards}
          rows={rows}
          setRows={setRows}
          hint={hint}
          setHint={setHint}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          rowsPerPage={rowsPerPage}
          setRowsPerPage={setRowsPerPage}
          isGenerating={isGenerating}
          setIsGenerating={setIsGenerating}
          loadingMessage={loadingMessage}
          setLoadingMessage={setLoadingMessage}
        />
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

      {/* Wheel Builder Tab */}
      {activeTab === 'wheel-builder' && <WheelBuilderTab gameConfig={gameConfig} />}
    </div>
  )
}

export default App
