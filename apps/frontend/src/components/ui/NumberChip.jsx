export function NumberChip({ number, selected, onToggle }) {
  const selectedClasses = selected
    ? 'bg-gradient-to-br from-cyan-400 via-blue-500 to-violet-600 text-white border-cyan-300 shadow-2xl shadow-blue-500/60 scale-105 ring-4 ring-blue-400/30'
    : 'bg-gradient-to-br from-slate-800 to-slate-700 border-slate-600 text-slate-300 hover:from-slate-700 hover:to-slate-600 hover:border-blue-500/50 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/20'

  return (
    <button
      type="button"
      className={`relative flex min-h-[44px] min-w-[44px] h-12 w-full items-center justify-center rounded-xl sm:rounded-2xl border-2 font-bold text-base sm:text-sm transition-all duration-300 ease-out active:scale-95 touch-manipulation ${selectedClasses}`}
      onClick={() => onToggle(number, selected)}
      aria-label={`Number ${number}`}
      aria-pressed={selected}
    >
      {number}
    </button>
  )
}
