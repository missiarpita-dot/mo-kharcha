import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Overview from './pages/Overview'
import MonthlySheet from './pages/MonthlySheet'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/month/:id" element={<MonthlySheet />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
