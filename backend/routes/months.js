const express = require('express');
const router = express.Router();
const { db } = require('../db');

// ─── Helper: compute summary for a month ────────────────────────────────────
async function getMonthSummary(monthId) {
  const month = await db.getMonthById(monthId);
  if (!month) return null;

  const expenses = await db.getExpensesByMonth(monthId);
  const payments = await db.getPaymentsByMonth(monthId);

  const totalExpenses = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const totalReceived = payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);

  // Find previous month
  const allMonths = await db.getAllMonths();
  const sorted = [...allMonths].sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month);
  const currentIdx = sorted.findIndex(m => String(m.id) === String(monthId));

  let openingBalance = 0;
  if (currentIdx > 0) {
    const prev = await getMonthSummary(sorted[currentIdx - 1].id);
    openingBalance = prev ? prev.closingBalance : 0;
  }

  const totalDue = openingBalance + totalExpenses;
  const closingBalance = totalDue - totalReceived;

  let status = 'Settled';
  if (closingBalance > 0.005) status = 'Due from Father';
  else if (closingBalance < -0.005) status = 'Overpaid by Father';

  return { ...month, openingBalance, totalExpenses, totalReceived, totalDue, closingBalance, status };
}

// GET /api/months
router.get('/', async (req, res) => {
  try {
    const months = await db.getAllMonths();
    const summaries = await Promise.all(months.map(m => getMonthSummary(m.id)));
    res.json(summaries.filter(Boolean));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/months/:id
router.get('/:id', async (req, res) => {
  try {
    const summary = await getMonthSummary(req.params.id);
    if (!summary) return res.status(404).json({ error: 'Month not found' });
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/months
router.post('/', async (req, res) => {
  const { name, year, month } = req.body;
  if (!name || !year || !month) return res.status(400).json({ error: 'name, year, and month are required' });
  try {
    const newMonth = await db.createMonth({ name, year: parseInt(year), month: parseInt(month) });
    const summary = await getMonthSummary(newMonth.id);
    res.status(201).json(summary);
  } catch (err) {
    if (err.message.includes('already exists')) return res.status(409).json({ error: err.message });
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/months/:id
router.delete('/:id', async (req, res) => {
  try {
    await db.deleteMonth(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
module.exports.getMonthSummary = getMonthSummary;
