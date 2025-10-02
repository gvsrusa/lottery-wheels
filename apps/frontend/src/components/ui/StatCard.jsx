export function StatCard({ label, value }) {
  return (
    <div className="relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5 shadow-2xl hover:shadow-blue-500/10 hover:border-blue-500/30 transition-all duration-300 overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-violet-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <div className="relative z-10">
        <div className="text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider sm:tracking-widest mb-1 sm:mb-2 line-clamp-2">{label}</div>
        <div className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 text-lg sm:text-xl md:text-2xl font-black break-all">{value}</div>
      </div>
    </div>
  )
}
