import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import { formatINR } from '../utils'

const PIE_COLORS = ['#1d4ed8', '#0891b2', '#0d9488', '#65a30d', '#ca8a04', '#dc2626', '#7c3aed', '#db2777']

const INRTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-sm">
        <p className="font-semibold text-slate-800">{payload[0].name}</p>
        <p className="text-blue-600 font-bold">{formatINR(payload[0].value)}</p>
      </div>
    )
  }
  return null
}

export function CategoryPieChart({ expenses }) {
  const data = Object.entries(
    expenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount
      return acc
    }, {})
  ).map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  if (data.length === 0) return <p className="text-center text-slate-400 text-sm py-8">No data yet</p>

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" outerRadius={100} dataKey="value" nameKey="name"
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          labelLine={false}>
          {data.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
        </Pie>
        <Tooltip content={<INRTooltip />} />
      </PieChart>
    </ResponsiveContainer>
  )
}

export function MonthlyBarChart({ summaries }) {
  const data = summaries.map((s) => ({
    name: s.name.replace(' 2026', '').replace(' 2025', ''),
    Expenses: s.totalExpenses,
    Received: s.totalReceived,
  }))

  if (data.length === 0) return <p className="text-center text-slate-400 text-sm py-8">No data yet</p>

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
        <Tooltip formatter={(v) => formatINR(v)} />
        <Legend />
        <Bar dataKey="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
        <Bar dataKey="Received" fill="#22c55e" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
