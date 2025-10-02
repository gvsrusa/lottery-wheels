export function LoadingOverlay({ message }) {
  return (
    <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-md z-50 flex items-center justify-center rounded-3xl">
      <div className="flex flex-col items-center gap-6 p-8">
        {/* Animated Spinner */}
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 border-4 border-slate-700 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-transparent border-t-cyan-400 border-r-blue-500 rounded-full animate-spin"></div>
          <div className="absolute inset-2 border-4 border-transparent border-t-violet-400 border-r-purple-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
        </div>

        {/* Message */}
        <div className="text-center">
          <p className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 font-black text-xl mb-2">
            Processing...
          </p>
          <p className="text-slate-300 text-sm font-medium">
            {message}
          </p>
        </div>
      </div>
    </div>
  )
}
