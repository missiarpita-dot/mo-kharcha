import { Link } from 'react-router-dom'
import { Home, IndianRupee } from 'lucide-react'
import { exportExcel } from '../api'
import { useState } from 'react'

export default function Navbar() {
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    try {
      await exportExcel()
    } catch (e) {
      alert('Export failed. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <nav className="bg-blue-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 font-semibold text-lg tracking-tight hover:opacity-90">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <IndianRupee size={18} />
          </div>
          <span>Household Expense Tracker</span>
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-1.5 text-sm text-blue-200 hover:text-white transition-colors">
            <Home size={16} />
            <span className="hidden sm:inline">Overview</span>
          </Link>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-400 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            {exporting ? 'Exporting…' : 'Export Excel'}
          </button>
        </div>
      </div>
    </nav>
  )
}
