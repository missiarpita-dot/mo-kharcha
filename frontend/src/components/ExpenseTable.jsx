import { useState } from 'react'
import { Pencil, Trash2, Plus, Loader2 } from 'lucide-react'
import StatusBadge from './StatusBadge'
import AddExpenseModal from './AddExpenseModal'
import ConfirmModal from './ConfirmModal'
import { deleteExpense } from '../api'
import { formatINR } from '../utils'

export default function ExpenseTable({ monthId, expenses, onRefresh }) {
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deletingItem, setDeletingItem] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleConfirmDelete = async () => {
    if (!deletingItem) return
    setIsDeleting(true)
    try {
      await deleteExpense(deletingItem.id)
      await onRefresh()
      setDeletingItem(null)
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete expense. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  const total = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0)

  return (
    <div className="card overflow-hidden">
      {/* Section Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-900 to-blue-800">
        <div>
          <p className="text-xs text-blue-300 uppercase tracking-widest font-medium">Section 1</p>
          <h2 className="text-white font-semibold text-base">Monthly Expenses</h2>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white/15 hover:bg-white/25 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <Plus size={15} /> Add Expense
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/75">
              <th className="table-th">Date</th>
              <th className="table-th">Category</th>
              <th className="table-th">Description</th>
              <th className="table-th text-right">Amount</th>
              <th className="table-th">Paid From</th>
              <th className="table-th">Status</th>
              <th className="table-th text-right w-24">Actions</th>
            </tr>
          </thead>
          <tbody>
            {expenses.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-slate-400 text-sm">
                  No expenses added for this month yet. Click "Add Expense" above.
                </td>
              </tr>
            ) : (
              expenses.map((exp, i) => (
                <tr
                  key={exp.id}
                  className={`border-b border-slate-50 hover:bg-blue-50/30 transition-colors ${
                    i % 2 === 1 ? 'bg-slate-50/50' : ''
                  }`}
                >
                  <td className="table-td font-mono text-xs text-slate-600">{exp.date}</td>
                  <td className="table-td">
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-semibold">
                      {exp.category}
                    </span>
                  </td>
                  <td className="table-td text-slate-600">{exp.description || '—'}</td>
                  <td className="table-td text-right font-semibold text-slate-800 tabular-nums">
                    {formatINR(exp.amount)}
                  </td>
                  <td className="table-td">
                    <span
                      className={`text-xs font-semibold ${
                        exp.paid_from === 'Own Money' ? 'text-orange-600' : 'text-slate-600'
                      }`}
                    >
                      {exp.paid_from === 'Own Money' ? '👤 Own' : "👴 Father's"}
                    </span>
                  </td>
                  <td className="table-td">
                    <StatusBadge status={exp.status} />
                  </td>
                  <td className="table-td text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setEditing(exp)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md hover:bg-blue-50 transition-colors"
                        title="Edit expense"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => setDeletingItem(exp)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
                        title="Delete expense"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {expenses.length > 0 && (
            <tfoot>
              <tr className="bg-amber-50/80 border-t-2 border-amber-200">
                <td colSpan={3} className="px-4 py-3 text-sm font-semibold text-slate-700 text-right">
                  Total Expenses (this month)
                </td>
                <td className="px-4 py-3 text-right font-bold text-slate-900 tabular-nums">
                  {formatINR(total)}
                </td>
                <td colSpan={3}></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Modals */}
      {showAdd && (
        <AddExpenseModal
          monthId={monthId}
          onClose={() => setShowAdd(false)}
          onSaved={onRefresh}
        />
      )}
      {editing && (
        <AddExpenseModal
          monthId={monthId}
          expense={editing}
          onClose={() => setEditing(null)}
          onSaved={onRefresh}
        />
      )}
      
      {/* In-app Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingItem}
        title="Delete Expense"
        message={`Are you sure you want to delete "${deletingItem?.category} - ${formatINR(deletingItem?.amount || 0)}"?`}
        loading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingItem(null)}
      />
    </div>
  )
}
