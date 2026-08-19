import { useState } from 'react'
import { X } from 'lucide-react'
import { createPayment, updatePayment } from '../api'

const today = new Date().toISOString().split('T')[0]

export default function AddPaymentModal({ monthId, payment, onClose, onSaved }) {
  const isEdit = !!payment
  const [form, setForm] = useState(
    isEdit
      ? { date: payment.date, amount: String(payment.amount), note: payment.note || '' }
      : { date: today, amount: '', note: '' }
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.date || !form.amount || parseFloat(form.amount) <= 0) {
      setError('Please enter a valid date and amount.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const payload = {
        month_id: monthId,
        date: form.date,
        amount: parseFloat(form.amount),
        note: form.note.trim(),
      }
      if (isEdit) {
        await updatePayment(payment.id, payload)
      } else {
        await createPayment(payload)
      }
      onSaved()
      onClose()
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800">
            {isEdit ? 'Edit Payment' : 'Add Money Received'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>}

          <div>
            <label className="label">Date *</label>
            <input type="date" className="input" value={form.date}
              onChange={(e) => set('date', e.target.value)} required />
          </div>

          <div>
            <label className="label">Amount Received (₹) *</label>
            <input type="number" className="input" placeholder="0.00" min="0.01" step="0.01"
              value={form.amount} onChange={(e) => set('amount', e.target.value)} required />
          </div>

          <div>
            <label className="label">Note</label>
            <input type="text" className="input" placeholder="e.g. July allowance"
              value={form.note} onChange={(e) => set('note', e.target.value)} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center bg-green-600 hover:bg-green-700">
              {loading ? 'Saving…' : isEdit ? 'Update' : 'Add Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
