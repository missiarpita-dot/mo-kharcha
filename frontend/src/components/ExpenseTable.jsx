import { useState } from 'react'
import { Pencil, Trash2, Plus } from 'lucide-react'
import StatusBadge from './StatusBadge'
import AddExpenseModal from './AddExpenseModal'
import { deleteExpense } from '../api'
import { formatINR } from '../utils'

export default function ExpenseTable({ monthId, expenses, onRefresh }) {
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState(null)

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense?')) return
    await deleteExpense(id)
    onRefresh()
  }

  const total = expenses.reduce((s, e) => s + e.amount, 0)

  return (
    <div className="card overflow-hidden">
      {/* Section Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-900 to-blue-800">
        <div>
          <p className="text-xs text-blue-300 uppercase tracking-widest font-medium">Section 1</p>
          <h2 className="text-white font-semibold text-base">Monthly Expenses</h2>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition-colors">
          <Plus size={15} /> Add Expense
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="table-th">Date</th>
              <th className="table-th">Category</th>
              <th className="table-th">Description</th>
              <th className="table-th text-right">Amount</th>
              <th className="table-th">Paid From</th>
              <th className="table-th">Status</th>
              <th className="table-th w-20">Actions</th>
            </tr>
          </thead>
          <tbody>
            {expenses.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-10 text-slate-400 text-sm">
                  No expenses yet. Click "Add Expense" to get started.
                </td>
              </tr>
            ) : (
              expenses.map((exp, i) => (
                <tr key={exp.id}
                  className={`border-b border-slate-50 hover:bg-slate-50 transition-colors ${i % 2 === 1 ? 'bg-slate-50/50' : ''}`}>
                  <td className="table-td font-mono text-xs">{exp.date}</td>
                  <td className="table-td">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                      {exp.category}
                    </span>
                  </td>
                  <td className="table-td text-slate-500">{exp.description || '—'}</td>
                  <td className="table-td text-right font-semibold text-slate-800">{formatINR(exp.amount)}</td>
                  <td className="table-td">
                    <span className={`text-xs font-medium ${exp.paid_from === 'Own Money' ? 'text-orange-600' : 'text-slate-500'}`}>
                      {exp.paid_from === 'Own Money' ? '👤 Own' : "👴 Father's"}
                    </span>
                  </td>
                  <td className="table-td"><StatusBadge status={exp.status} /></td>
                  <td className="table-td">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setEditing(exp)} className="p-1.5 text-slate-400 hover:text-blue-600 rounded hover:bg-blue-50 transition-colors">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleDelete(exp.id)} className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {expenses.length > 0 && (
            <tfoot>
              <tr className="bg-amber-50 border-t-2 border-amber-200">
                <td colSpan={3} className="px-4 py-3 text-sm font-semibold text-slate-600 text-right">
                  Total Expenses (this month)
                </td>
                <td className="px-4 py-3 text-right font-bold text-slate-800">{formatINR(total)}</td>
                <td colSpan={3}></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Modals */}
      {showAdd && (
        <AddExpenseModal monthId={monthId} onClose={() => setShowAdd(false)} onSaved={onRefresh} />
      )}
      {editing && (
        <AddExpenseModal monthId={monthId} expense={editing} onClose={() => setEditing(null)} onSaved={onRefresh} />
      )}
    </div>
  )
}
