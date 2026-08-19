const express = require('express');
const router = express.Router();
const { createWorkbookFromDb } = require('../excelSync');

// GET /api/export
router.get('/', async (req, res) => {
  try {
    const workbook = await createWorkbookFromDb();

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="Household_Expense.xlsx"'
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Export error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
