import { useState } from 'react'
import { Pencil, Trash2, Plus } from 'lucide-react'
import AddPaymentModal from './AddPaymentModal'
import { deletePayment } from '../api'
import { formatINR } from '../utils'

export default function PaymentsTable({ monthId, payments, onRefresh }) {
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState(null)

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this payment?')) return
    await deletePayment(id)
    onRefresh()
  }

  const total = payments.reduce((s, p) => s + p.amount, 0)

  return (
    <div className="card overflow-hidden">
      {/* Section Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-green-800 to-green-700">
        <div>
          <p className="text-xs text-green-300 uppercase tracking-widest font-medium">Section 2</p>
          <h2 className="text-white font-semibold text-base">Money Received from Father</h2>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition-colors">
          <Plus size={15} /> Add Payment
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="table-th">Date</th>
              <th className="table-th text-right">Amount Received</th>
              <th className="table-th">Note</th>
              <th className="table-th w-20">Actions</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-10 text-slate-400 text-sm">
                  No payments received yet.
                </td>
              </tr>
            ) : (
              payments.map((pay, i) => (
                <tr key={pay.id}
                  className={`border-b border-slate-50 hover:bg-slate-50 transition-colors ${i % 2 === 1 ? 'bg-slate-50/50' : ''}`}>
                  <td className="table-td font-mono text-xs">{pay.date}</td>
                  <td className="table-td text-right font-semibold text-green-700">{formatINR(pay.amount)}</td>
                  <td className="table-td text-slate-500">{pay.note || '—'}</td>
                  <td className="table-td">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setEditing(pay)} className="p-1.5 text-slate-400 hover:text-blue-600 rounded hover:bg-blue-50 transition-colors">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleDelete(pay.id)} className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {payments.length > 0 && (
            <tfoot>
              <tr className="bg-green-50 border-t-2 border-green-200">
                <td className="px-4 py-3 text-sm font-semibold text-slate-600">Total Received (this month)</td>
                <td className="px-4 py-3 text-right font-bold text-green-700">{formatINR(total)}</td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {showAdd && (
        <AddPaymentModal monthId={monthId} onClose={() => setShowAdd(false)} onSaved={onRefresh} />
      )}
      {editing && (
        <AddPaymentModal monthId={monthId} payment={editing} onClose={() => setEditing(null)} onSaved={onRefresh} />
      )}
    </div>
  )
}
