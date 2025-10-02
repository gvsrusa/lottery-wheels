import { useState } from 'react'
import { GAME_CONFIGS } from './constants/gameConfigs'
import { CoverageAnalysisTab } from './components/CoverageAnalysisTab'
import { GameConfigsTab } from './components/GameConfigsTab'
import { WheelBuilderTab } from './components/WheelBuilderTab'

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
            <button
              onClick={() => setActiveTab('wheel-builder')}
              className={`px-6 py-3 font-bold text-sm transition-all duration-200 border-b-4 ${
                activeTab === 'wheel-builder'
                  ? 'border-cyan-500 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              Wheel Builder
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
