import { useState, useEffect } from 'react'
import { IndianRupee, Loader2 } from 'lucide-react'
import { verifyPin as apiVerifyPin } from '../api'

export default function PinLockScreen({ onUnlock }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [shake, setShake] = useState(false)

  const handleKeyPress = (num) => {
    if (loading) return
    if (pin.length < 4) {
      const nextPin = pin + num
      setPin(nextPin)
      setError('')
      if (nextPin.length === 4) {
        submitPin(nextPin)
      }
    }
  }

  const handleDelete = () => {
    if (loading) return
    setPin((p) => p.slice(0, -1))
    setError('')
  }

  const submitPin = async (enteredPin) => {
    setLoading(true)
    setError('')
    try {
      const res = await apiVerifyPin(enteredPin)
      if (res.data && res.data.success) {
        sessionStorage.setItem('kharcha_unlocked', 'true')
        onUnlock()
      } else {
        triggerError('Incorrect PIN. Please try again.')
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Incorrect PIN. Please try again.'
      triggerError(msg)
    } finally {
      setLoading(false)
    }
  }

  const triggerError = (msg) => {
    setError(msg)
    setShake(true)
    setTimeout(() => {
      setShake(false)
      setPin('')
    }, 600)
  }

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (/^[0-9]$/.test(e.key)) {
        handleKeyPress(e.key)
      } else if (e.key === 'Backspace') {
        handleDelete()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [pin, loading])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/95 backdrop-blur-md p-4">
      <div className={`w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8 text-center space-y-6 ${shake ? 'animate-bounce' : ''}`}>
        
        {/* Icon & Title */}
        <div className="mx-auto w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
          <IndianRupee size={32} />
        </div>

        <div>
          <h1 className="text-xl font-bold text-slate-800">Mo-Kharcha</h1>
          <p className="text-xs text-slate-500 mt-1">Enter your 4-digit PIN to unlock</p>
        </div>

        {/* PIN Dots or Loading Spinner */}
        <div className="flex justify-center items-center gap-4 py-2 min-h-[32px]">
          {loading ? (
            <div className="flex items-center gap-2 text-blue-600 text-sm font-medium">
              <Loader2 size={20} className="animate-spin" />
              <span>Verifying PIN…</span>
            </div>
          ) : (
            [0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full border-2 transition-all ${
                  i < pin.length
                    ? 'bg-blue-600 border-blue-600 scale-110'
                    : 'border-slate-300 bg-slate-100'
                }`}
              />
            ))
          )}
        </div>

        {/* Error message */}
        {error ? (
          <p className="text-xs font-semibold text-red-600 bg-red-50 py-1.5 px-3 rounded-full inline-block">
            {error}
          </p>
        ) : (
          <p className="text-xs text-slate-400">Secure Cloud PIN Protection</p>
        )}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-3 max-w-[240px] mx-auto pt-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              disabled={loading}
              onClick={() => handleKeyPress(String(num))}
              className="w-16 h-16 rounded-2xl bg-slate-100 hover:bg-blue-50 text-slate-800 hover:text-blue-700 font-semibold text-xl flex items-center justify-center transition-all active:scale-95 shadow-sm disabled:opacity-50"
            >
              {num}
            </button>
          ))}
          <button
            disabled={loading}
            onClick={() => setPin('')}
            className="w-16 h-16 rounded-2xl bg-slate-50 text-slate-400 hover:text-slate-600 text-xs font-medium flex items-center justify-center disabled:opacity-50"
          >
            Clear
          </button>
          <button
            disabled={loading}
            onClick={() => handleKeyPress('0')}
            className="w-16 h-16 rounded-2xl bg-slate-100 hover:bg-blue-50 text-slate-800 hover:text-blue-700 font-semibold text-xl flex items-center justify-center transition-all active:scale-95 shadow-sm disabled:opacity-50"
          >
            0
          </button>
          <button
            disabled={loading}
            onClick={handleDelete}
            className="w-16 h-16 rounded-2xl bg-slate-50 text-slate-500 hover:bg-red-50 hover:text-red-600 text-sm flex items-center justify-center transition-colors disabled:opacity-50"
          >
            ⌫
          </button>
        </div>
      </div>
    </div>
  )
}
