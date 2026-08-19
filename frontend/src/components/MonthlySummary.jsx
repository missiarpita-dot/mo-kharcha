import StatusBadge from './StatusBadge'
import { formatINR } from '../utils'

export default function MonthlySummary({ summary }) {
  if (!summary) return null

  const rows = [
    { label: 'Opening Balance (Due from Previous Month)', value: summary.openingBalance, color: 'text-slate-700' },
    { label: 'Total Expenses (This Month)',               value: summary.totalExpenses,  color: 'text-red-600' },
    { label: 'Total Due (Opening + Expenses)',            value: summary.totalDue,        color: 'text-orange-600', bold: true },
    { label: 'Total Received from Father (This Month)',   value: summary.totalReceived,   color: 'text-green-600' },
    { label: 'Closing Balance (Carried to Next Month)',   value: summary.closingBalance,  color: summary.closingBalance < 0 ? 'text-purple-600' : summary.closingBalance > 0 ? 'text-red-700' : 'text-green-700', bold: true, large: true },
  ]

  return (
    <div className="card overflow-hidden">
      {/* Section Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-slate-800 to-slate-700">
        <p className="text-xs text-slate-400 uppercase tracking-widest font-medium">Section 3</p>
        <h2 className="text-white font-semibold text-base">Monthly Summary</h2>
        <p className="text-slate-400 text-xs mt-0.5">Auto-calculated — read only</p>
      </div>

      <div className="divide-y divide-slate-100">
        {rows.map((row, i) => (
          <div key={i} className={`flex items-center justify-between px-6 py-4 ${row.large ? 'bg-slate-50' : ''}`}>
            <span className={`text-sm ${row.bold ? 'font-semibold text-slate-800' : 'text-slate-600'}`}>
              {row.label}
            </span>
            <span className={`text-sm font-bold tabular-nums ${row.color} ${row.large ? 'text-lg' : ''}`}>
              {formatINR(row.value)}
            </span>
          </div>
        ))}

        {/* Status row */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50">
          <span className="text-sm font-semibold text-slate-800">Status</span>
          <StatusBadge status={summary.status} />
        </div>
      </div>
    </div>
  )
}
