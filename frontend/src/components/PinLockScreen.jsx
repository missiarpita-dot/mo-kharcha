import { useState, useEffect } from 'react'
import { Lock, KeyRound, IndianRupee } from 'lucide-react'

export default function PinLockScreen({ onUnlock }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)

  const savedPin = localStorage.getItem('kharcha_pin') || '1234'

  const handleKeyPress = (num) => {
    if (pin.length < 4) {
      const nextPin = pin + num
      setPin(nextPin)
      setError('')
      if (nextPin.length === 4) {
        verifyPin(nextPin)
      }
    }
  }

  const handleDelete = () => {
    setPin((p) => p.slice(0, -1))
    setError('')
  }

  const verifyPin = (enteredPin) => {
    if (enteredPin === savedPin) {
      sessionStorage.setItem('kharcha_unlocked', 'true')
      onUnlock()
    } else {
      setError('Incorrect PIN. Please try again.')
      setShake(true)
      setTimeout(() => {
        setShake(false)
        setPin('')
      }, 500)
    }
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
  }, [pin])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/95 backdrop-blur-md p-4">
      <div className={`w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8 text-center space-y-6 ${shake ? 'animate-bounce' : ''}`}>
        
        {/* Icon & Title */}
        <div className="mx-auto w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
          <IndianRupee size={32} />
        </div>

        <div>
          <h1 className="text-xl font-bold text-slate-800">Mo-Kharcha Locked</h1>
          <p className="text-xs text-slate-500 mt-1">Enter your 4-digit PIN to access</p>
        </div>

        {/* PIN Dots */}
        <div className="flex justify-center gap-4 py-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full border-2 transition-all ${
                i < pin.length
                  ? 'bg-blue-600 border-blue-600 scale-110'
                  : 'border-slate-300 bg-slate-100'
              }`}
            />
          ))}
        </div>

        {/* Error message */}
        {error ? (
          <p className="text-xs font-semibold text-red-600 bg-red-50 py-1.5 px-3 rounded-full inline-block">
            {error}
          </p>
        ) : (
          <p className="text-xs text-slate-400">Default PIN: <span className="font-mono font-bold text-slate-600">1234</span></p>
        )}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-3 max-w-[240px] mx-auto pt-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleKeyPress(String(num))}
              className="w-16 h-16 rounded-2xl bg-slate-100 hover:bg-blue-50 text-slate-800 hover:text-blue-700 font-semibold text-xl flex items-center justify-center transition-all active:scale-95 shadow-sm"
            >
              {num}
            </button>
          ))}
          <button
            onClick={() => setPin('')}
            className="w-16 h-16 rounded-2xl bg-slate-50 text-slate-400 hover:text-slate-600 text-xs font-medium flex items-center justify-center"
          >
            Clear
          </button>
          <button
            onClick={() => handleKeyPress('0')}
            className="w-16 h-16 rounded-2xl bg-slate-100 hover:bg-blue-50 text-slate-800 hover:text-blue-700 font-semibold text-xl flex items-center justify-center transition-all active:scale-95 shadow-sm"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="w-16 h-16 rounded-2xl bg-slate-50 text-slate-500 hover:bg-red-50 hover:text-red-600 text-sm flex items-center justify-center transition-colors"
          >
            ⌫
          </button>
        </div>
      </div>
    </div>
  )
}
