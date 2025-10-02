export function PaginationControls({ currentPage, totalPages, rowsPerPage, totalRows, onPageChange, onRowsPerPageChange }) {
  const pageNumbers = []
  const maxVisiblePages = 5

  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

  if (endPage - startPage < maxVisiblePages - 1) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1)
  }

  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i)
  }

  if (totalRows === 0) return null

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
      {/* Rows per page */}
      <div className="flex items-center gap-3">
        <label className="text-slate-300 text-sm font-medium">Rows per page:</label>
        <select
          value={rowsPerPage}
          onChange={(e) => onRowsPerPageChange(Number(e.target.value))}
          className="px-3 py-2 rounded-lg bg-slate-800 border-2 border-slate-600 text-slate-200 font-semibold focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
        >
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
          <option value={200}>200</option>
        </select>
      </div>

      {/* Page info */}
      <div className="text-slate-300 text-sm font-medium">
        Showing <span className="text-cyan-400 font-bold">{(currentPage - 1) * rowsPerPage + 1}</span> to{' '}
        <span className="text-cyan-400 font-bold">{Math.min(currentPage * rowsPerPage, totalRows)}</span> of{' '}
        <span className="text-cyan-400 font-bold">{totalRows}</span> results
      </div>

      {/* Page navigation */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="px-3 py-2 rounded-lg bg-slate-800 border-2 border-slate-600 text-slate-300 font-bold hover:bg-slate-700 hover:border-blue-500/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          ««
        </button>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-2 rounded-lg bg-slate-800 border-2 border-slate-600 text-slate-300 font-bold hover:bg-slate-700 hover:border-blue-500/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          ‹
        </button>

        {startPage > 1 && (
          <span className="px-2 text-slate-500">...</span>
        )}

        {pageNumbers.map((pageNum) => (
          <button
            key={pageNum}
            onClick={() => onPageChange(pageNum)}
            className={`px-4 py-2 rounded-lg font-bold transition-all ${
              pageNum === currentPage
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-2 border-cyan-400 shadow-lg shadow-blue-500/50'
                : 'bg-slate-800 border-2 border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-blue-500/50'
            }`}
          >
            {pageNum}
          </button>
        ))}

        {endPage < totalPages && (
          <span className="px-2 text-slate-500">...</span>
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-2 rounded-lg bg-slate-800 border-2 border-slate-600 text-slate-300 font-bold hover:bg-slate-700 hover:border-blue-500/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          ›
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="px-3 py-2 rounded-lg bg-slate-800 border-2 border-slate-600 text-slate-300 font-bold hover:bg-slate-700 hover:border-blue-500/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          »»
        </button>
      </div>
    </div>
  )
}
