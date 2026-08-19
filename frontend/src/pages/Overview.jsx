import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMonths, createMonth, deleteMonth } from '../api'
import StatusBadge from '../components/StatusBadge'
import { MonthlyBarChart } from '../components/Charts'
import { formatINR, MONTH_NAMES } from '../utils'
import { Plus, Trash2, ChevronRight, TrendingDown, TrendingUp, Wallet } from 'lucide-react'

const YEAR_OPTIONS = [2024, 2025, 2026, 2027, 2028]

export default function Overview() {
  const [months, setMonths] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddMonth, setShowAddMonth] = useState(false)
  const [newMonth, setNewMonth] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear() })
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')
  const navigate = useNavigate()

  const load = async () => {
    setLoading(true)
    try {
      const res = await getMonths()
      setMonths(res.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const cumExpenses  = months.reduce((s, m) => s + m.totalExpenses, 0)
  const cumReceived  = months.reduce((s, m) => s + m.totalReceived, 0)
  const netBalance   = months.length > 0 ? months[months.length - 1].closingBalance : 0

  const handleAddMonth = async (e) => {
    e.preventDefault()
    setAdding(true)
    setAddError('')
    const name = `${MONTH_NAMES[newMonth.month]} ${newMonth.year}`
    try {
      await createMonth({ name, year: newMonth.year, month: newMonth.month })
      setShowAddMonth(false)
      load()
    } catch (err) {
      setAddError(err.response?.data?.error || 'Failed to create month.')
    } finally {
      setAdding(false)
    }
  }

  const handleDelete = async (e, id) => {
    e.stopPropagation()
    if (!window.confirm('Delete this month and all its data?')) return
    await deleteMonth(id)
    load()
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Household Expense Ledger</h1>
          <p className="text-slate-500 text-sm mt-1">Monthly Overview · All amounts in Indian Rupees (₹)</p>
        </div>
        <button onClick={() => setShowAddMonth(true)} className="btn-primary">
          <Plus size={16} /> Add New Month
        </button>
      </div>

      {/* Summary Cards */}
      {months.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-red-100 flex items-center justify-center">
              <TrendingDown size={22} className="text-red-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Total Expenses</p>
              <p className="text-xl font-bold text-slate-900 mt-0.5">{formatINR(cumExpenses)}</p>
            </div>
          </div>
          <div className="card p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-green-100 flex items-center justify-center">
              <TrendingUp size={22} className="text-green-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Total Received</p>
              <p className="text-xl font-bold text-slate-900 mt-0.5">{formatINR(cumReceived)}</p>
            </div>
          </div>
          <div className="card p-5 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${netBalance < 0 ? 'bg-purple-100' : netBalance > 0 ? 'bg-orange-100' : 'bg-green-100'}`}>
              <Wallet size={22} className={netBalance < 0 ? 'text-purple-600' : netBalance > 0 ? 'text-orange-600' : 'text-green-600'} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Current Balance</p>
              <p className={`text-xl font-bold mt-0.5 ${netBalance < 0 ? 'text-purple-700' : netBalance > 0 ? 'text-orange-700' : 'text-green-700'}`}>
                {formatINR(netBalance)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Months Table */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">Monthly Breakdown</h2>
          <span className="text-xs text-slate-400">{months.length} month{months.length !== 1 ? 's' : ''} tracked</span>
        </div>

        {loading ? (
          <div className="text-center py-16 text-slate-400">Loading…</div>
        ) : months.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-400 text-sm mb-4">No months added yet.</p>
            <button onClick={() => setShowAddMonth(true)} className="btn-primary mx-auto">
              <Plus size={16} /> Add Your First Month
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="table-th">Month</th>
                  <th className="table-th text-right">Opening Due</th>
                  <th className="table-th text-right">Total Expenses</th>
                  <th className="table-th text-right">Total Received</th>
                  <th className="table-th text-right">Closing Due</th>
                  <th className="table-th">Status</th>
                  <th className="table-th w-16"></th>
                </tr>
              </thead>
              <tbody>
                {months.map((m, i) => (
                  <tr key={m.id}
                    onClick={() => navigate(`/month/${m.id}`)}
                    className={`border-b border-slate-50 cursor-pointer hover:bg-blue-50/50 transition-colors group ${i % 2 === 1 ? 'bg-slate-50/30' : ''}`}>
                    <td className="table-td">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-blue-700">{m.name}</span>
                        <ChevronRight size={14} className="text-slate-300 group-hover:text-blue-400 transition-colors" />
                      </div>
                    </td>
                    <td className="table-td text-right tabular-nums">{formatINR(m.openingBalance)}</td>
                    <td className="table-td text-right tabular-nums text-red-600 font-medium">{formatINR(m.totalExpenses)}</td>
                    <td className="table-td text-right tabular-nums text-green-600 font-medium">{formatINR(m.totalReceived)}</td>
                    <td className="table-td text-right tabular-nums font-semibold">{formatINR(m.closingBalance)}</td>
                    <td className="table-td"><StatusBadge status={m.status} /></td>
                    <td className="table-td">
                      <button onClick={(e) => handleDelete(e, m.id)}
                        className="p-1.5 text-slate-300 hover:text-red-500 rounded hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              {months.length > 0 && (
                <tfoot>
                  <tr className="bg-blue-50 border-t-2 border-blue-200">
                    <td className="px-4 py-3 text-sm font-bold text-slate-800">Cumulative Total</td>
                    <td className="px-4 py-3 text-right text-sm font-semibold tabular-nums">
                      {formatINR(months[0]?.openingBalance || 0)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-red-600 tabular-nums">{formatINR(cumExpenses)}</td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-green-600 tabular-nums">{formatINR(cumReceived)}</td>
                    <td className="px-4 py-3 text-right text-sm font-bold tabular-nums">{formatINR(netBalance)}</td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>

      {/* Charts */}
      {months.length > 0 && (
        <div className="card p-6">
          <h2 className="font-semibold text-slate-800 mb-4">Month-wise: Expenses vs Received</h2>
          <MonthlyBarChart summaries={months} />
        </div>
      )}

      {/* Add Month Modal */}
      {showAddMonth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-800">Add New Month</h2>
              <button onClick={() => setShowAddMonth(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleAddMonth} className="p-6 space-y-4">
              {addError && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{addError}</p>}
              <div>
                <label className="label">Month</label>
                <select className="input" value={newMonth.month} onChange={(e) => setNewMonth((n) => ({ ...n, month: parseInt(e.target.value) }))}>
                  {MONTH_NAMES.slice(1).map((name, i) => (
                    <option key={i + 1} value={i + 1}>{name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Year</label>
                <select className="input" value={newMonth.year} onChange={(e) => setNewMonth((n) => ({ ...n, year: parseInt(e.target.value) }))}>
                  {YEAR_OPTIONS.map((y) => <option key={y}>{y}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddMonth(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={adding} className="btn-primary flex-1 justify-center">
                  {adding ? 'Creating…' : 'Create Month'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
