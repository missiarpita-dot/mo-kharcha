const express = require('express');
const router = express.Router();
const { readDb, writeDb } = require('../db');

// GET /api/payments/month/:monthId
router.get('/month/:monthId', (req, res) => {
  const monthId = parseInt(req.params.monthId, 10);
  const db = readDb();
  const payments = db.payments
    .filter((p) => p.month_id === monthId)
    .sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id);
  res.json(payments);
});

// POST /api/payments
router.post('/', (req, res) => {
  const { month_id, date, amount, note } = req.body;
  if (!month_id || !date || amount === undefined) {
    return res.status(400).json({ error: 'month_id, date, and amount are required' });
  }

  const db = readDb();
  const newId = db.payments.length > 0 ? Math.max(...db.payments.map((p) => p.id)) + 1 : 1;

  const newPayment = {
    id: newId,
    month_id: parseInt(month_id, 10),
    date,
    amount: parseFloat(amount),
    note: note || '',
  };

  db.payments.push(newPayment);
  writeDb(db);

  res.status(201).json(newPayment);
});

// PUT /api/payments/:id
router.put('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { date, amount, note } = req.body;
  const db = readDb();
  const paymentIndex = db.payments.findIndex((p) => p.id === id);

  if (paymentIndex === -1) {
    return res.status(404).json({ error: 'Payment not found' });
  }

  db.payments[paymentIndex] = {
    ...db.payments[paymentIndex],
    date: date || db.payments[paymentIndex].date,
    amount: amount !== undefined ? parseFloat(amount) : db.payments[paymentIndex].amount,
    note: note !== undefined ? note : db.payments[paymentIndex].note,
  };

  writeDb(db);
  res.json(db.payments[paymentIndex]);
});

// DELETE /api/payments/:id
router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const db = readDb();
  const exists = db.payments.some((p) => p.id === id);
  if (!exists) return res.status(404).json({ error: 'Payment not found' });

  db.payments = db.payments.filter((p) => p.id !== id);
  writeDb(db);
  res.json({ success: true });
});

module.exports = router;
