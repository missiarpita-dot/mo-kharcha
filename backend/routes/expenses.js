const express = require('express');
const router = express.Router();
const { db } = require('../db');

// GET /api/expenses/month/:monthId
router.get('/month/:monthId', async (req, res) => {
  try {
    const expenses = await db.getExpensesByMonth(req.params.monthId);
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/expenses
router.post('/', async (req, res) => {
  const { month_id, date, category, description, amount, paid_from } = req.body;
  if (!month_id || !date || !category || amount === undefined || !paid_from) {
    return res.status(400).json({ error: 'month_id, date, category, amount, and paid_from are required' });
  }
  try {
    const expense = await db.createExpense({ month_id, date, category, description, amount: parseFloat(amount), paid_from });
    res.status(201).json(expense);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/expenses/:id
router.put('/:id', async (req, res) => {
  const { date, category, description, amount, paid_from } = req.body;
  try {
    const expense = await db.updateExpense(req.params.id, { date, category, description, amount: parseFloat(amount), paid_from });
    if (!expense) return res.status(404).json({ error: 'Expense not found' });
    res.json(expense);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/expenses/:id
router.delete('/:id', async (req, res) => {
  try {
    await db.deleteExpense(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
