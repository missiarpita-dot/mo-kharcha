import { useState } from 'react'
import { X, KeyRound, Check, Loader2 } from 'lucide-react'
import { changePin as apiChangePin } from '../api'

export default function ChangePinModal({ onClose }) {
  const [currentPin, setCurrentPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      setError('New PIN must be exactly 4 numeric digits.')
      return
    }
    if (newPin !== confirmPin) {
      setError('New PIN and Confirm PIN do not match.')
      return
    }

    setLoading(true)
    try {
      const res = await apiChangePin(currentPin, newPin)
      if (res.data && res.data.success) {
        setSuccess(true)
        setTimeout(() => {
          onClose()
        }, 1500)
      } else {
        setError(res.data?.error || 'Failed to change PIN.')
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to change PIN. Please check current PIN.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2 text-slate-800 font-semibold">
            <KeyRound size={18} className="text-blue-600" />
            <h2>Change Security PIN</h2>
          </div>
          <button onClick={onClose} disabled={loading} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        {success ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
              <Check size={24} />
            </div>
            <p className="font-semibold text-slate-800">PIN Changed Successfully!</p>
            <p className="text-xs text-slate-500">Updated securely across all devices and browsers.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg">{error}</p>}

            <div>
              <label className="label">Current PIN</label>
              <input
                type="password"
                maxLength={4}
                disabled={loading}
                className="input font-mono text-center text-lg tracking-widest"
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value)}
                placeholder="••••"
                required
              />
            </div>

            <div>
              <label className="label">New 4-Digit PIN</label>
              <input
                type="password"
                maxLength={4}
                disabled={loading}
                className="input font-mono text-center text-lg tracking-widest"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                placeholder="••••"
                required
              />
            </div>

            <div>
              <label className="label">Confirm New PIN</label>
              <input
                type="password"
                maxLength={4}
                disabled={loading}
                className="input font-mono text-center text-lg tracking-widest"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                placeholder="••••"
                required
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} disabled={loading} className="btn-secondary flex-1">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
                {loading ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 size={16} className="animate-spin" /> Saving…
                  </span>
                ) : (
                  'Save New PIN'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
