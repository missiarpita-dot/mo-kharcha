const express = require('express');
const router = express.Router();
const { db } = require('../db');

// GET /api/payments/month/:monthId
router.get('/month/:monthId', async (req, res) => {
  try {
    const payments = await db.getPaymentsByMonth(req.params.monthId);
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/payments
router.post('/', async (req, res) => {
  const { month_id, date, amount, note } = req.body;
  if (!month_id || !date || amount === undefined) {
    return res.status(400).json({ error: 'month_id, date, and amount are required' });
  }
  try {
    const payment = await db.createPayment({ month_id, date, amount: parseFloat(amount), note });
    res.status(201).json(payment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/payments/:id
router.put('/:id', async (req, res) => {
  const { date, amount, note } = req.body;
  try {
    const payment = await db.updatePayment(req.params.id, { date, amount: parseFloat(amount), note });
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    res.json(payment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/payments/:id
router.delete('/:id', async (req, res) => {
  try {
    await db.deletePayment(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
