const express = require('express');
const router = express.Router();
const { readDb, writeDb } = require('../db');

// Helper: compute summary for a single month
function getMonthSummary(monthId) {
  const db = readDb();
  const month = db.months.find((m) => m.id === monthId);
  if (!month) return null;

  const monthExpenses = db.expenses.filter((e) => e.month_id === monthId);
  const totalExpenses = monthExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const monthPayments = db.payments.filter((p) => p.month_id === monthId);
  const totalReceived = monthPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  // Find the immediately preceding month
  const sortedMonths = [...db.months].sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.month - b.month;
  });

  const currentIndex = sortedMonths.findIndex((m) => m.id === monthId);
  let openingBalance = 0;

  if (currentIndex > 0) {
    const prevMonth = sortedMonths[currentIndex - 1];
    const prevSummary = getMonthSummary(prevMonth.id);
    openingBalance = prevSummary ? prevSummary.closingBalance : 0;
  }

  const totalDue = openingBalance + totalExpenses;
  const closingBalance = totalDue - totalReceived;

  let status = 'Settled';
  if (closingBalance > 0.005) status = 'Due from Father';
  else if (closingBalance < -0.005) status = 'Overpaid by Father';

  return {
    id: month.id,
    name: month.name,
    year: month.year,
    month: month.month,
    created_at: month.created_at,
    openingBalance,
    totalExpenses,
    totalReceived,
    totalDue,
    closingBalance,
    status,
  };
}

// GET /api/months - all months with summaries
router.get('/', (req, res) => {
  const db = readDb();
  const sortedMonths = [...db.months].sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.month - b.month;
  });
  const summaries = sortedMonths.map((m) => getMonthSummary(m.id));
  res.json(summaries);
});

// GET /api/months/:id
router.get('/:id', (req, res) => {
  const summary = getMonthSummary(parseInt(req.params.id, 10));
  if (!summary) return res.status(404).json({ error: 'Month not found' });
  res.json(summary);
});

// POST /api/months
router.post('/', (req, res) => {
  const { name, year, month } = req.body;
  if (!name || !year || !month) {
    return res.status(400).json({ error: 'name, year, and month are required' });
  }

  const db = readDb();
  const exists = db.months.some((m) => m.year === parseInt(year, 10) && m.month === parseInt(month, 10));
  if (exists) {
    return res.status(409).json({ error: 'This month already exists' });
  }

  const newId = db.months.length > 0 ? Math.max(...db.months.map((m) => m.id)) + 1 : 1;
  const newMonth = {
    id: newId,
    name,
    year: parseInt(year, 10),
    month: parseInt(month, 10),
    created_at: new Date().toISOString(),
  };

  db.months.push(newMonth);
  writeDb(db);

  const summary = getMonthSummary(newId);
  res.status(201).json(summary);
});

// DELETE /api/months/:id
router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const db = readDb();
  const exists = db.months.some((m) => m.id === id);
  if (!exists) return res.status(404).json({ error: 'Month not found' });

  db.months = db.months.filter((m) => m.id !== id);
  db.expenses = db.expenses.filter((e) => e.month_id !== id);
  db.payments = db.payments.filter((p) => p.month_id !== id);
  writeDb(db);

  res.json({ success: true });
});

module.exports = router;
module.exports.getMonthSummary = getMonthSummary;
