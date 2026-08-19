const express = require('express');
const router = express.Router();
const { readDb, writeDb } = require('../db');

// GET /api/expenses/month/:monthId
router.get('/month/:monthId', (req, res) => {
  const monthId = parseInt(req.params.monthId, 10);
  const db = readDb();
  const expenses = db.expenses
    .filter((e) => e.month_id === monthId)
    .sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id);
  res.json(expenses);
});

// POST /api/expenses
router.post('/', (req, res) => {
  const { month_id, date, category, description, amount, paid_from } = req.body;
  if (!month_id || !date || !category || amount === undefined || !paid_from) {
    return res.status(400).json({ error: 'month_id, date, category, amount, and paid_from are required' });
  }

  const db = readDb();
  const newId = db.expenses.length > 0 ? Math.max(...db.expenses.map((e) => e.id)) + 1 : 1;
  const status = paid_from === 'Own Money' ? 'Due from Father' : 'Settled';

  const newExpense = {
    id: newId,
    month_id: parseInt(month_id, 10),
    date,
    category,
    description: description || '',
    amount: parseFloat(amount),
    paid_from,
    status,
  };

  db.expenses.push(newExpense);
  writeDb(db);

  res.status(201).json(newExpense);
});

// PUT /api/expenses/:id
router.put('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { date, category, description, amount, paid_from } = req.body;
  const db = readDb();
  const expenseIndex = db.expenses.findIndex((e) => e.id === id);

  if (expenseIndex === -1) {
    return res.status(404).json({ error: 'Expense not found' });
  }

  const status = paid_from === 'Own Money' ? 'Due from Father' : 'Settled';
  db.expenses[expenseIndex] = {
    ...db.expenses[expenseIndex],
    date: date || db.expenses[expenseIndex].date,
    category: category || db.expenses[expenseIndex].category,
    description: description !== undefined ? description : db.expenses[expenseIndex].description,
    amount: amount !== undefined ? parseFloat(amount) : db.expenses[expenseIndex].amount,
    paid_from: paid_from || db.expenses[expenseIndex].paid_from,
    status,
  };

  writeDb(db);
  res.json(db.expenses[expenseIndex]);
});

// DELETE /api/expenses/:id
router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const db = readDb();
  const exists = db.expenses.some((e) => e.id === id);
  if (!exists) return res.status(404).json({ error: 'Expense not found' });

  db.expenses = db.expenses.filter((e) => e.id !== id);
  writeDb(db);
  res.json({ success: true });
});

module.exports = router;
