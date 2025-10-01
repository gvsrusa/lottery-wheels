export function Loader({ message = 'Calculating...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="relative w-16 h-16 mb-4">
        <div className="absolute inset-0 border-4 border-slate-700 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-transparent border-t-cyan-400 border-r-blue-500 rounded-full animate-spin"></div>
      </div>
      <p className="text-slate-300 font-semibold text-sm">{message}</p>
    </div>
  )
}
