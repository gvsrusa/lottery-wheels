import { Loader } from "../common/Loader"
import { NumberChip } from "../common/NumberChip"
import { StatCard } from "../common/StatCard"
import { PaginationControls } from "../common/PaginationControls"
import { nCk, findMinimumCovering } from "../../utils/combinatorics"
import { formatNumbers, toCSV } from "../../utils/formatters"

export 
function CoverageAnalysisTab({
  gameConfig,
  NUMBER_RANGE,
  coveragePool,
  setCoveragePool,
  coverageGuarantee,
  setCoverageGuarantee,
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
  coverageLoading,
  setCoverageLoading,
  coverageBreakdown,
  setCoverageBreakdown,
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

  const handleGenerateCoverage = () => {
    setCoverageHint('')
    setCoverageSummary([])
    setCoverageResults([])
    setCoverageBreakdown([])
    setCoverageCurrentPage(1)

    if (coveragePool.length < minPool) {
      setCoverageHint(`Select at least ${minPool} numbers in your pool.`)
      return
    }

    if (coveragePool.length > maxPool) {
      setCoverageHint(`Pool cannot exceed ${maxPool} numbers.`)
      return
    }

    // Start loading
    setCoverageLoading(true)

    // Use setTimeout to allow UI to update with loading state
    setTimeout(() => {
      try {
        // Generate minimal covering for specific guarantee level
        const t = Number(coverageGuarantee)
        const combinations = findMinimumCovering(coveragePool, pickCount, t)

        // Calculate total possible combinations and theoretical coverage
        const totalPossible = nCk(coveragePool.length, pickCount)
        const totalSubsets = nCk(coveragePool.length, t)
        const coveragePercent = ((combinations.length / totalPossible) * 100).toFixed(2)

        const guaranteeLabels = {
          '4': `${pickCount}/${pickCount} (all ${pickCount} numbers)`,
          '3': `${pickCount - 1}+/${pickCount} (${pickCount - 1} or more)`,
          '2': `${pickCount - 2}+/${pickCount} (${pickCount - 2} or more)`,
        }

        const summary = [
          { label: 'Pool size', value: coveragePool.length.toLocaleString() },
          { label: 'Guarantee level', value: guaranteeLabels[coverageGuarantee] || `${t}/${pickCount}` },
          { label: 'Minimum combinations needed', value: combinations.length.toLocaleString() },
          { label: 'Total possible combinations', value: totalPossible.toLocaleString() },
          { label: 'Efficiency', value: `${coveragePercent}%` },
        ]

        // Create detailed breakdown
        const breakdown = [
          {
            label: `Total ${t}-subsets to cover`,
            value: totalSubsets.toLocaleString(),
            description: `All possible ${t}-number combinations from your pool of ${coveragePool.length}`
          },
          {
            label: `${t}-subsets per ${pickCount}-combination`,
            value: nCk(pickCount, t).toLocaleString(),
            description: `Each ${pickCount}-number ticket covers ${nCk(pickCount, t)} different ${t}-subsets`
          },
          {
            label: 'Coverage guarantee',
            value: '100%',
            description: `No matter which ${pickCount} numbers are drawn from your pool, at least one ticket will match ${t}+ numbers`
          },
        ]

        setCoverageBreakdown(breakdown)

        // Add combinations to results
        const results = []
        for (let i = 0; i < combinations.length; i++) {
          results.push({
            id: i + 1,
            mains: formatNumbers(combinations[i]),
            coverageLevel: guaranteeLabels[coverageGuarantee] || `${t}/${pickCount}`,
          })
        }

        setCoverageSummary(summary)
        setCoverageResults(results)
        setCoverageHint(`${results.length.toLocaleString()} combinations guarantee ${guaranteeLabels[coverageGuarantee]}.`)
      } finally {
        setCoverageLoading(false)
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

          {/* Coverage Guarantee */}
          <div className="mb-6">
            <label className="block text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-orange-500 font-black text-base mb-4 uppercase tracking-wider">
              Coverage Guarantee
            </label>
            <div className="grid grid-cols-1 gap-3">
              {coverageLevelOptions.map((level) => (
                <label
                  key={`coverage-${level}`}
                  className="flex items-center gap-3 text-sm bg-slate-800/50 border-2 border-slate-600/50 px-4 py-3.5 rounded-xl hover:bg-slate-700/50 hover:border-blue-500/50 cursor-pointer transition-all duration-200 active:scale-95"
                >
                  <input
                    type="radio"
                    name="coverage-guarantee"
                    value={level.toString()}
                    checked={coverageGuarantee === level.toString()}
                    onChange={(e) => setCoverageGuarantee(e.target.value)}
                    className="w-5 h-5 border-2 border-slate-500 text-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 cursor-pointer transition-all"
                  />
                  <div className="flex-1">
                    <div className="text-slate-200 font-bold">{level}-if-{pickCount}</div>
                    <div className="text-xs text-slate-400 mt-0.5">Guarantee at least one ticket matches {level}+ numbers</div>
                  </div>
                </label>
              ))}
            </div>
            <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
              <p className="text-xs text-slate-300 leading-relaxed">
                <strong className="text-cyan-400">How it works:</strong> Assuming all {pickCount} drawn numbers come from your pool (but you don't know which {pickCount}),
                this calculates the minimum combinations needed to guarantee at least one ticket with your selected match level.
                Higher guarantees require more combinations.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-4 mb-6">
            <button
              onClick={handleGenerateCoverage}
              className="relative w-full bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-600 text-white px-6 py-5 rounded-2xl font-black text-lg shadow-2xl shadow-blue-500/50 hover:shadow-3xl hover:shadow-blue-500/70 transition-all duration-300 transform hover:scale-[1.03] active:scale-[0.98] overflow-hidden group"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-violet-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              <span className="relative z-10 flex items-center justify-center gap-2">
                ✨ Calculate Coverage
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
        <div className="relative z-10">
          {/* Summary */}
          <h3 className="text-3xl font-black mb-6 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Summary</h3>

          {coverageLoading ? (
            <Loader message="Calculating coverage..." />
          ) : coverageSummary.length > 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {coverageSummary.map((card) => (
                  <StatCard key={card.label} label={card.label} value={card.value} />
                ))}
              </div>

              {/* Coverage Breakdown */}
              {coverageBreakdown.length > 0 && (
                <>
                  <h3 className="text-2xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-500">Coverage Breakdown</h3>
                  <div className="border-2 border-emerald-700/50 rounded-2xl bg-emerald-900/20 backdrop-blur-sm shadow-inner mb-8 overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-emerald-800/30 backdrop-blur-md">
                        <tr className="border-b-2 border-emerald-500/30">
                          <th className="px-4 py-4 text-left text-xs font-black uppercase tracking-widest text-emerald-300">Metric</th>
                          <th className="px-4 py-4 text-right text-xs font-black uppercase tracking-widest text-emerald-300">Value</th>
                          <th className="px-4 py-4 text-left text-xs font-black uppercase tracking-widest text-emerald-300">Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {coverageBreakdown.map((item, idx) => (
                          <tr key={idx} className={`hover:bg-emerald-500/10 transition-all duration-200 ${idx % 2 === 0 ? 'bg-slate-800/30' : 'bg-slate-800/50'}`}>
                            <td className="px-4 py-3 text-sm font-bold text-emerald-200 border-b border-emerald-700/30">{item.label}</td>
                            <td className="px-4 py-3 text-sm text-right font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-500 border-b border-emerald-700/30">{item.value}</td>
                            <td className="px-4 py-3 text-xs text-slate-300 border-b border-emerald-700/30">{item.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          )}

          {/* Results */}
          <h3 className="text-3xl font-black mb-6 text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-500">Coverage Combinations</h3>

          {coverageLoading ? (
            <div className="mt-8">
              <Loader message="Generating combinations..." />
            </div>
          ) : (
            <>
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
            </>
          )}
        </div>
      </section>
    </main>
  )
}
