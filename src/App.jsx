import { useMemo, useState } from 'react'

const NUMBER_RANGE = Array.from({ length: 35 }, (_, idx) => idx + 1)
const TIER_OPTIONS = [
  { id: '4of4b', label: '4/4 + Bonus', defaultChecked: true },
  { id: '4of4', label: '4/4', defaultChecked: true },
  { id: '3of4b', label: '3/4 + Bonus', defaultChecked: true },
  { id: '3of4', label: '3/4', defaultChecked: true },
  { id: '2of4b', label: '2/4 + Bonus', defaultChecked: false },
  { id: '2of4', label: '2/4', defaultChecked: false },
]
const TIER_LABEL = Object.fromEntries(TIER_OPTIONS.map((tier) => [tier.id, tier.label]))

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

function App() {
  const [pool, setPool] = useState([])
  const [bonusCandidates, setBonusCandidates] = useState([])
  const [drawn, setDrawn] = useState([])
  const [drawnBonus, setDrawnBonus] = useState('')
  const [tiers, setTiers] = useState(() =>
    Object.fromEntries(TIER_OPTIONS.map((tier) => [tier.id, tier.defaultChecked]))
  )
  const [summaryCards, setSummaryCards] = useState([])
  const [rows, setRows] = useState([])
  const [hint, setHint] = useState('')

  const poolsOverlap = useMemo(() => pool.filter((value) => drawn.includes(value)), [pool, drawn])

  const togglePool = (number, currentlySelected) => {
    setPool((prev) => {
      if (currentlySelected) {
        return prev.filter((value) => value !== number)
      }
      if (prev.length >= 25) {
        setHint('Pool is limited to 25 numbers. Remove one before adding another.')
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
      if (prev.length >= 6) {
        setHint('Bonus pool is limited to six candidates.')
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
      if (prev.length >= 4) {
        setHint('Drawn mains are capped at four numbers.')
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

    if (pool.length < 4) {
      setHint('Select at least 4 numbers in your pool.')
      return
    }

    if (pool.length > 25) {
      setHint('Pool cannot exceed 25 numbers.')
      return
    }

    if (drawn.length !== 4) {
      setHint('Choose exactly four drawn mains.')
      return
    }

    if (trimmedBonus !== '' && (Number.isNaN(parsedDrawBonus) || parsedDrawBonus < 1 || parsedDrawBonus > 35)) {
      setHint('Drawn bonus must be a number between 1 and 35 or left blank.')
      return
    }

    const K = poolsOverlap.length
    const totalPerBonus = nCk(pool.length, 4)
    const N4 = nCk(K, 4)
    const N3 = nCk(K, 3) * (pool.length - K)
    const N2 = nCk(K, 2) * nCk(pool.length - K, 2)
    const bonusPoolCount = bonusCandidates.length

    const summary = [
      { label: 'Pool size (s)', value: pool.length.toLocaleString() },
      { label: 'Drawn mains', value: formatNumbers(drawn) },
      { label: 'K = |S ∩ Draw|', value: K.toLocaleString() },
      { label: 'Tickets per bonus', value: totalPerBonus.toLocaleString() },
      { label: '3/4 (theory)', value: N3.toLocaleString() },
      { label: '4/4 (theory)', value: N4.toLocaleString() },
      { label: '2/4 (theory)', value: N2.toLocaleString() },
    ]

    if (bonusPoolCount > 0) {
      const bonusHit = parsedDrawBonus != null && bonusCandidates.includes(parsedDrawBonus)
      summary.push({ label: 'Bonus candidates', value: bonusCandidates.join(', ') || '—' })
      summary.push({ label: 'Drawn bonus', value: parsedDrawBonus ?? '—' })
      summary.push({ label: 'Bonus hit?', value: bonusHit ? 'Yes' : 'No' })
      summary.push({
        label: 'Tickets (all bonuses)',
        value: (totalPerBonus * bonusPoolCount).toLocaleString(),
      })
    }

    const mainsTickets = kCombinations(pool, 4)
    const bonuses = bonusPoolCount > 0 ? bonusCandidates : [null]
    const bonusLogicActive = parsedDrawBonus != null && bonusPoolCount > 0

    const activeRows = []
    let indexCounter = 1

    for (const ticket of mainsTickets) {
      const matchedMains = ticket.filter((value) => drawn.includes(value)).length

      for (const bonus of bonuses) {
        const bonusHit = bonusLogicActive && bonus === parsedDrawBonus
        let tierKey = null

        if (matchedMains === 4) {
          tierKey = bonusHit ? '4of4b' : '4of4'
        } else if (matchedMains === 3) {
          tierKey = bonusHit ? '3of4b' : '3of4'
        } else if (matchedMains === 2) {
          tierKey = bonusHit ? '2of4b' : '2of4'
        }

        if (!tierKey || !tiers[tierKey]) {
          continue
        }

        activeRows.push({
          id: indexCounter,
          mains: formatNumbers(ticket),
          bonus: bonus ?? '—',
          match: matchedMains,
          bonusHit: bonusLogicActive ? (bonusHit ? 'Yes' : 'No') : '—',
          tier: TIER_LABEL[tierKey],
        })
        indexCounter += 1
      }
    }

    if (activeRows.length > 12000) {
      setHint(`Large output (${activeRows.length.toLocaleString()} rows). Consider narrowing tiers or reducing pool size.`)
    } else {
      setHint(`${activeRows.length.toLocaleString()} rows generated.`)
    }

    setSummaryCards(summary)
    setRows(activeRows)
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
      <header className="relative border-b border-slate-800/50 bg-slate-900/60 backdrop-blur-xl px-6 py-8 shadow-2xl">
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500 bg-clip-text text-transparent drop-shadow-2xl">
          Texas Two Step
        </h1>
        <p className="text-slate-300 text-base sm:text-lg font-medium mt-2 flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
          Dynamic 4-of-N Combination Generator
        </p>
      </header>

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
              Mains: 1–35 · Bonus: 1–35
            </span>
          </div>

          {/* Pool Selection */}
          <div className="mb-6">
            <label className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 font-black text-base mb-4 uppercase tracking-wider">
              Your Pool <span className="text-slate-400 text-xs normal-case font-medium">(select 4–25)</span>
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

          {/* Bonus Selection */}
          <div className="mb-6">
            <label className="block text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-500 font-black text-base mb-4 uppercase tracking-wider">
              Bonus Candidates <span className="text-slate-400 text-xs normal-case font-medium">(optional, 0–6)</span>
            </label>
            <div className="grid grid-cols-5 sm:grid-cols-7 gap-2 sm:gap-2.5 mb-4">
              {NUMBER_RANGE.map((num) => (
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

          {/* Drawn Mains */}
          <div className="mb-6">
            <label className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-500 font-black text-base mb-4 uppercase tracking-wider">
              Drawn Mains <span className="text-slate-400 text-xs normal-case font-medium">(exactly 4)</span>
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
                Chosen: <strong className="text-green-400 text-base">{drawn.length}</strong>/4
              </span>
              <button
                onClick={clearDraw}
                className="bg-slate-700/50 border border-slate-600 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-600 hover:border-slate-500 transition-all duration-200"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Drawn Bonus */}
          <div className="mb-6">
            <label className="block text-slate-200 font-bold text-sm mb-3 uppercase tracking-wide">
              Drawn Bonus <span className="text-slate-400 text-xs normal-case">(optional)</span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="1"
                max="35"
                placeholder="—"
                value={drawnBonus}
                onChange={(event) => setDrawnBonus(event.target.value)}
                className="w-24 px-4 py-3 rounded-xl border-2 border-slate-600 bg-slate-700/50 text-slate-100 text-sm font-semibold focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
              <span className="text-slate-400 text-xs">Leave empty to ignore bonus tiers</span>
            </div>
          </div>

          <hr className="border-slate-700/50 my-6" />

          {/* Tiers */}
          <div className="mb-6">
            <label className="block text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-orange-500 font-black text-base mb-4 uppercase tracking-wider">Show Tiers</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {TIER_OPTIONS.map((tier) => (
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
              className="relative w-full bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-600 text-white px-6 py-5 rounded-2xl font-black text-lg shadow-2xl shadow-blue-500/50 hover:shadow-3xl hover:shadow-blue-500/70 transition-all duration-300 transform hover:scale-[1.03] active:scale-[0.98] overflow-hidden group"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-violet-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              <span className="relative z-10 flex items-center justify-center gap-2">
                ✨ Generate Combinations
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
          <div className="relative z-10">
          {/* Summary */}
          <h3 className="text-3xl font-black mb-6 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Summary</h3>
          {summaryCards.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
              {summaryCards.map((card) => (
                <StatCard key={card.label} label={card.label} value={card.value} />
              ))}
            </div>
          )}

          {/* Combinations */}
          <h3 className="text-3xl font-black mb-6 text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-500">Combinations</h3>
          <div className="max-h-[60vh] overflow-auto border-2 border-slate-700/50 rounded-2xl bg-slate-900/60 backdrop-blur-sm shadow-inner">
            <table className="w-full">
              <thead className="sticky top-0 bg-slate-800/95 z-10 backdrop-blur-md">
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
                {rows.map((row, idx) => (
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
                ))}
              </tbody>
            </table>
          </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App