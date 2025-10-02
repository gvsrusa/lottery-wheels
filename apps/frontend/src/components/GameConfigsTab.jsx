import { useMemo } from 'react'
import { NumberChip } from './ui/NumberChip'
import { StatCard } from './ui/StatCard'
import { LoadingOverlay } from './ui/LoadingOverlay'
import { PaginationControls } from './ui/PaginationControls'
import { nCk, kCombinations } from '../utils/combinatorics'
import { toCSV, formatNumbers } from '../utils/formatting'

export function GameConfigsTab({
  gameConfig,
  NUMBER_RANGE,
  BONUS_RANGE,
  pool,
  setPool,
  bonusCandidates,
  setBonusCandidates,
  drawn,
  setDrawn,
  drawnBonus,
  setDrawnBonus,
  tiers,
  setTiers,
  summaryCards,
  setSummaryCards,
  rows,
  setRows,
  hint,
  setHint,
  currentPage,
  setCurrentPage,
  rowsPerPage,
  setRowsPerPage,
  isGenerating,
  setIsGenerating,
  loadingMessage,
  setLoadingMessage,
}) {
  const poolsOverlap = useMemo(() => pool.filter((value) => drawn.includes(value)), [pool, drawn])

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

  // Pagination calculations
  const totalPages = Math.ceil(rows.length / rowsPerPage)
  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = startIndex + rowsPerPage
  const currentRows = rows.slice(startIndex, endIndex)

  return (
    <main className="relative grid grid-cols-1 lg:grid-cols-[380px_1fr] xl:grid-cols-[420px_1fr] gap-4 sm:gap-6 p-3 sm:p-4 md:p-6 max-w-[1800px] mx-auto">
      {/* LEFT: Controls */}
      <section className="relative bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl shadow-black/50 overflow-hidden">
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
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 gap-2 mb-4">
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
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 gap-2 mb-4">
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
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 gap-2 mb-4">
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
          <div className="flex flex-col gap-3 sm:gap-4 mb-6">
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="relative w-full bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-600 text-white px-4 sm:px-6 py-4 sm:py-5 rounded-xl sm:rounded-2xl font-black text-base sm:text-lg shadow-2xl shadow-blue-500/50 hover:shadow-3xl hover:shadow-blue-500/70 transition-all duration-300 transform hover:scale-[1.03] active:scale-[0.98] overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 min-h-[56px] touch-manipulation"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-violet-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              <span className="relative z-10 flex items-center justify-center gap-2">
                {isGenerating ? '⏳ Processing...' : '✨ Generate Combinations'}
              </span>
            </button>
            <button
              onClick={handleDownload}
              className="w-full bg-slate-800/80 border-2 border-slate-600 px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-sm sm:text-base font-bold hover:bg-slate-700 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-200 min-h-[52px] touch-manipulation"
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
      <section className="relative bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl shadow-black/50 overflow-hidden">
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
            <table className="w-full min-w-[600px]">
              <thead className="bg-slate-800/95 backdrop-blur-md">
                <tr className="border-b-2 border-blue-500/30">
                  <th className="px-2 sm:px-4 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-black uppercase tracking-wider sm:tracking-widest text-slate-300">#</th>
                  <th className="px-2 sm:px-4 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-black uppercase tracking-wider sm:tracking-widest text-slate-300">Mains</th>
                  <th className="px-2 sm:px-4 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-black uppercase tracking-wider sm:tracking-widest text-slate-300">Bonus</th>
                  <th className="px-2 sm:px-4 py-3 sm:py-4 text-right text-[10px] sm:text-xs font-black uppercase tracking-wider sm:tracking-widest text-slate-300">Match</th>
                  <th className="px-2 sm:px-4 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-black uppercase tracking-wider sm:tracking-widest text-slate-300 hidden md:table-cell">Bonus Hit</th>
                  <th className="px-2 sm:px-4 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-black uppercase tracking-wider sm:tracking-widest text-slate-300">Tier</th>
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
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-slate-500 border-b border-slate-700/30 font-medium">{row.id}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-bold text-slate-200 border-b border-slate-700/30">{row.mains}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-slate-300 border-b border-slate-700/30 font-medium">{row.bonus}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-right font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 border-b border-slate-700/30">{row.match}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-slate-300 border-b border-slate-700/30 font-medium hidden md:table-cell">{row.bonusHit}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm border-b border-slate-700/30">
                        <span className="inline-block text-[10px] sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-blue-500/30 to-violet-500/30 border border-blue-400/50 rounded-full text-blue-300 font-bold shadow-lg whitespace-nowrap">
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
  )
}
