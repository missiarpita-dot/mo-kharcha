// Format number as Indian Rupee: ₹1,23,456.00
export function formatINR(amount) {
  if (amount === undefined || amount === null) return '₹0.00'
  const num = parseFloat(amount)
  const abs = Math.abs(num)
  const formatted = abs.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return num < 0 ? `-₹${formatted}` : `₹${formatted}`
}

// Month names
export const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

// Category options
export const CATEGORIES = [
  'Electricity',
  'Water',
  'Groceries',
  'Medicine',
  'Newspaper',
  'Rent',
  'Gas',
  'Internet',
  'Mobile Recharge',
  'Transport',
  'Miscellaneous',
]
