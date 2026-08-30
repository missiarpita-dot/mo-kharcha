import { AlertTriangle, Loader2 } from 'lucide-react'

export default function ConfirmModal({ isOpen, title, message, confirmText = 'Delete', confirmColor = 'bg-red-600 hover:bg-red-700', loading = false, onConfirm, onCancel }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden p-6 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
          <AlertTriangle size={24} />
        </div>
        
        <div>
          <h3 className="text-lg font-bold text-slate-800">{title || 'Confirm Action'}</h3>
          <p className="text-sm text-slate-500 mt-1">{message || 'Are you sure you want to proceed?'}</p>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="btn-secondary flex-1 justify-center disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={`px-4 py-2 text-white font-medium rounded-lg text-sm transition-colors flex-1 justify-center flex items-center gap-2 ${confirmColor} disabled:opacity-50`}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Deleting…
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
