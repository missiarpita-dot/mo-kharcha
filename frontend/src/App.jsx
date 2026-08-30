import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Overview from './pages/Overview'
import MonthlySheet from './pages/MonthlySheet'
import PinLockScreen from './components/PinLockScreen'

export default function App() {
  const [isUnlocked, setIsUnlocked] = useState(false)

  useEffect(() => {
    // Clear any legacy client-side cached pins
    localStorage.removeItem('kharcha_pin')
    
    const status = sessionStorage.getItem('kharcha_unlocked') === 'true'
    setIsUnlocked(status)
  }, [])

  const handleUnlock = () => {
    setIsUnlocked(true)
  }

  const handleLock = () => {
    sessionStorage.removeItem('kharcha_unlocked')
    setIsUnlocked(false)
  }

  return (
    <BrowserRouter>
      {!isUnlocked ? (
        <PinLockScreen onUnlock={handleUnlock} />
      ) : (
        <div className="min-h-screen bg-slate-50">
          <Navbar onLock={handleLock} />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            <Routes>
              <Route path="/" element={<Overview />} />
              <Route path="/month/:id" element={<MonthlySheet />} />
            </Routes>
          </main>
        </div>
      )}
    </BrowserRouter>
  )
}
