import { useState } from 'react'
import { Pencil, Trash2, Plus } from 'lucide-react'
import AddPaymentModal from './AddPaymentModal'
import ConfirmModal from './ConfirmModal'
import { deletePayment } from '../api'
import { formatINR } from '../utils'

export default function PaymentsTable({ monthId, payments, onRefresh }) {
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deletingItem, setDeletingItem] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleConfirmDelete = async () => {
    if (!deletingItem) return
    setIsDeleting(true)
    try {
      await deletePayment(deletingItem.id)
      await onRefresh()
      setDeletingItem(null)
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete payment. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  const total = payments.reduce((s, p) => s + (Number(p.amount) || 0), 0)

  return (
    <div className="card overflow-hidden">
      {/* Section Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-green-800 to-green-700">
        <div>
          <p className="text-xs text-green-300 uppercase tracking-widest font-medium">Section 2</p>
          <h2 className="text-white font-semibold text-base">Money Received from Father</h2>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white/15 hover:bg-white/25 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <Plus size={15} /> Add Payment
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/75">
              <th className="table-th">Date</th>
              <th className="table-th text-right">Amount Received</th>
              <th className="table-th">Note</th>
              <th className="table-th text-right w-24">Actions</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-12 text-slate-400 text-sm">
                  No payments received yet. Click "Add Payment" above.
                </td>
              </tr>
            ) : (
              payments.map((pay, i) => (
                <tr
                  key={pay.id}
                  className={`border-b border-slate-50 hover:bg-green-50/30 transition-colors ${
                    i % 2 === 1 ? 'bg-slate-50/50' : ''
                  }`}
                >
                  <td className="table-td font-mono text-xs text-slate-600">{pay.date}</td>
                  <td className="table-td text-right font-bold text-green-700 tabular-nums">
                    {formatINR(pay.amount)}
                  </td>
                  <td className="table-td text-slate-600">{pay.note || '—'}</td>
                  <td className="table-td text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setEditing(pay)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md hover:bg-blue-50 transition-colors"
                        title="Edit payment"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => setDeletingItem(pay)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
                        title="Delete payment"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {payments.length > 0 && (
            <tfoot>
              <tr className="bg-green-50/80 border-t-2 border-green-200">
                <td className="px-4 py-3 text-sm font-semibold text-slate-700">
                  Total Received (this month)
                </td>
                <td className="px-4 py-3 text-right font-bold text-green-700 tabular-nums">
                  {formatINR(total)}
                </td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {showAdd && (
        <AddPaymentModal
          monthId={monthId}
          onClose={() => setShowAdd(false)}
          onSaved={onRefresh}
        />
      )}
      {editing && (
        <AddPaymentModal
          monthId={monthId}
          payment={editing}
          onClose={() => setEditing(null)}
          onSaved={onRefresh}
        />
      )}

      {/* In-app Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingItem}
        title="Delete Payment"
        message={`Are you sure you want to delete this payment of ${formatINR(deletingItem?.amount || 0)}?`}
        loading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingItem(null)}
      />
    </div>
  )
}
