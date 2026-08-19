import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getMonth, getExpenses, getPayments } from '../api'
import ExpenseTable from '../components/ExpenseTable'
import PaymentsTable from '../components/PaymentsTable'
import MonthlySummary from '../components/MonthlySummary'
import { CategoryPieChart } from '../components/Charts'
import { ChevronLeft } from 'lucide-react'

export default function MonthlySheet() {
  const { id } = useParams()
  const [summary, setSummary] = useState(null)
  const [expenses, setExpenses] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [sumRes, expRes, payRes] = await Promise.all([
        getMonth(id),
        getExpenses(id),
        getPayments(id),
      ])
      setSummary(sumRes.data)
      setExpenses(expRes.data)
      setPayments(payRes.data)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Loading…</p>
        </div>
      </div>
    )
  }

  if (!summary) {
    return (
      <div className="text-center py-32">
        <p className="text-slate-500">Month not found.</p>
        <Link to="/" className="btn-primary mt-4 inline-flex">← Back to Overview</Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-3">
          <ChevronLeft size={16} /> Back to Overview
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Household Expense Ledger — {summary.name}
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Enter your data below. All totals and balances update automatically.
            </p>
          </div>
        </div>
      </div>

      {/* Section 1 — Expenses */}
      <ExpenseTable monthId={parseInt(id)} expenses={expenses} onRefresh={load} />

      {/* Section 2 — Payments */}
      <PaymentsTable monthId={parseInt(id)} payments={payments} onRefresh={load} />

      {/* Section 3 — Summary + Chart side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MonthlySummary summary={summary} />
        <div className="card p-6">
          <h3 className="font-semibold text-slate-800 mb-4 text-sm uppercase tracking-wide text-slate-500">
            Category Breakdown
          </h3>
          <CategoryPieChart expenses={expenses} />
        </div>
      </div>
    </div>
  )
}
