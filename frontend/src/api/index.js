import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

// ── Months ────────────────────────────────────────────────
export const getMonths       = ()            => api.get('/months')
export const getMonth        = (id)          => api.get(`/months/${id}`)
export const createMonth     = (data)        => api.post('/months', data)
export const deleteMonth     = (id)          => api.delete(`/months/${id}`)

// ── Expenses ──────────────────────────────────────────────
export const getExpenses     = (monthId)     => api.get(`/expenses/month/${monthId}`)
export const createExpense   = (data)        => api.post('/expenses', data)
export const updateExpense   = (id, data)    => api.put(`/expenses/${id}`, data)
export const deleteExpense   = (id)          => api.delete(`/expenses/${id}`)

// ── Payments ──────────────────────────────────────────────
export const getPayments     = (monthId)     => api.get(`/payments/month/${monthId}`)
export const createPayment   = (data)        => api.post('/payments', data)
export const updatePayment   = (id, data)    => api.put(`/payments/${id}`, data)
export const deletePayment   = (id)          => api.delete(`/payments/${id}`)

// ── Export ────────────────────────────────────────────────
export const exportExcel = () =>
  api.get('/export', { responseType: 'blob' }).then((res) => {
    const url = window.URL.createObjectURL(new Blob([res.data]))
    const a = document.createElement('a')
    a.href = url
    a.download = 'Household_Expense_Export.xlsx'
    a.click()
    window.URL.revokeObjectURL(url)
  })

export default api
