export function NumberChip({ number, selected, onToggle }) {
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
