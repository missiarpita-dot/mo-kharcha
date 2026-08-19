import { useState } from 'react'
import { X } from 'lucide-react'
import { createExpense, updateExpense } from '../api'
import { CATEGORIES } from '../utils'

const EMPTY = {
  date: new Date().toISOString().split('T')[0],
  category: 'Electricity',
  customCategory: '',
  description: '',
  amount: '',
  paid_from: 'Own Money',
}

export default function AddExpenseModal({ monthId, expense, onClose, onSaved }) {
  const isEdit = !!expense
  const [form, setForm] = useState(
    isEdit
      ? {
          date: expense.date,
          category: CATEGORIES.includes(expense.category) ? expense.category : 'Other',
          customCategory: CATEGORIES.includes(expense.category) ? '' : expense.category,
          description: expense.description || '',
          amount: String(expense.amount),
          paid_from: expense.paid_from,
        }
      : EMPTY
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.date || !form.amount || parseFloat(form.amount) <= 0) {
      setError('Please fill in all required fields with valid values.')
      return
    }
    const category = form.category === 'Other' ? (form.customCategory.trim() || 'Other') : form.category
    setLoading(true)
    setError('')
    try {
      const payload = {
        month_id: monthId,
        date: form.date,
        category,
        description: form.description.trim(),
        amount: parseFloat(form.amount),
        paid_from: form.paid_from,
      }
      if (isEdit) {
        await updateExpense(expense.id, payload)
      } else {
        await createExpense(payload)
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800">
            {isEdit ? 'Edit Expense' : 'Add Expense'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Date *</label>
              <input type="date" className="input" value={form.date} onChange={(e) => set('date', e.target.value)} required />
            </div>
            <div>
              <label className="label">Amount (₹) *</label>
              <input type="number" className="input" placeholder="0.00" min="0.01" step="0.01"
                value={form.amount} onChange={(e) => set('amount', e.target.value)} required />
            </div>
          </div>

          <div>
            <label className="label">Category *</label>
            <select className="input" value={form.category} onChange={(e) => set('category', e.target.value)}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              <option value="Other">Other (custom)</option>
            </select>
          </div>

          {form.category === 'Other' && (
            <div>
              <label className="label">Custom Category</label>
              <input type="text" className="input" placeholder="e.g. School Fees"
                value={form.customCategory} onChange={(e) => set('customCategory', e.target.value)} />
            </div>
          )}

          <div>
            <label className="label">Description</label>
            <input type="text" className="input" placeholder="e.g. Electric bill for July"
              value={form.description} onChange={(e) => set('description', e.target.value)} />
          </div>

          <div>
            <label className="label">Paid From *</label>
            <div className="flex gap-3">
              {['Own Money', "Father's Money"].map((opt) => (
                <label key={opt} className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 cursor-pointer text-sm font-medium transition-all
                  ${form.paid_from === opt ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                  <input type="radio" name="paid_from" value={opt} checked={form.paid_from === opt}
                    onChange={() => set('paid_from', opt)} className="sr-only" />
                  {opt === 'Own Money' ? '👤 Own Money' : "👴 Father's Money"}
                </label>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {form.paid_from === 'Own Money'
                ? '→ Status will be: Due from Father'
                : '→ Status will be: Settled'}
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading ? 'Saving…' : isEdit ? 'Update Expense' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
