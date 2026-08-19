export default function StatusBadge({ status }) {
  if (!status) return null
  if (status === 'Settled')
    return <span className="badge-settled">✓ Settled</span>
  if (status === 'Due from Father')
    return <span className="badge-due">↑ Due from Father</span>
  if (status === 'Overpaid by Father')
    return <span className="badge-overpaid">↓ Overpaid by Father</span>
  return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">{status}</span>
}
