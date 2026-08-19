const express = require('express');
const router = express.Router();
const ExcelJS = require('exceljs');
const { readDb } = require('../db');
const { getMonthSummary } = require('./months');

// Colour constants matching the original Excel file
const HEADER_BG = 'FFD9E1F2';   // blue-grey header
const TITLE_BG  = 'FF1F4E79';   // dark navy for sheet titles
const SECTION_BG = 'FFDAE3F3';  // light blue section headers
const TOTAL_BG   = 'FFFFF2CC';  // yellow for totals
const DUE_COLOR  = 'FFC00000';  // red for "Due from Father"
const SETTLED_COLOR = '00B050';  // green for Settled / Overpaid

const INR_FMT = '₹#,##0.00';

function applyBorder(cell) {
  cell.border = {
    top: { style: 'thin', color: { argb: 'FFB8CCE4' } },
    left: { style: 'thin', color: { argb: 'FFB8CCE4' } },
    bottom: { style: 'thin', color: { argb: 'FFB8CCE4' } },
    right: { style: 'thin', color: { argb: 'FFB8CCE4' } },
  };
}

function styleHeaderCell(cell, text) {
  cell.value = text;
  cell.font = { bold: true, color: { argb: 'FF1F4E79' }, size: 11 };
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_BG } };
  cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  applyBorder(cell);
}

function styleSectionHeader(cell, text) {
  cell.value = text;
  cell.font = { bold: true, color: { argb: 'FF1F4E79' }, size: 11 };
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SECTION_BG } };
  cell.alignment = { vertical: 'middle' };
}

function buildOverviewSheet(workbook, summaries) {
  const ws = workbook.addWorksheet('Overview');

  ws.columns = [
    { width: 20 },
    { width: 18 },
    { width: 20 },
    { width: 20 },
    { width: 18 },
    { width: 24 },
  ];

  // Row 1 — Title
  ws.mergeCells('A1:F1');
  const title = ws.getCell('A1');
  title.value = 'Household Expense Ledger - Monthly Overview';
  title.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
  title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: TITLE_BG } };
  title.alignment = { vertical: 'middle', horizontal: 'center' };
  ws.getRow(1).height = 30;

  // Row 2 — Instructions
  ws.mergeCells('A2:F2');
  const instr = ws.getCell('A2');
  instr.value =
    "Pulls totals automatically from each month's sheet. To add a new month, duplicate the previous month's sheet and add a row below.";
  instr.font = { italic: true, color: { argb: 'FF595959' }, size: 10 };
  instr.alignment = { wrapText: true };
  ws.getRow(2).height = 24;

  // Row 3 — blank
  ws.getRow(3).height = 8;

  // Row 4 — Column headers
  const headers = [
    'Month',
    'Opening Due (₹)',
    'Total Expenses (₹)',
    'Total Received (₹)',
    'Closing Due (₹)',
    'Status',
  ];
  headers.forEach((h, i) => styleHeaderCell(ws.getRow(4).getCell(i + 1), h));
  ws.getRow(4).height = 22;

  // Rows 5+ — Data
  let cumOpening = 0, cumExpenses = 0, cumReceived = 0;
  summaries.forEach((s, idx) => {
    const row = ws.getRow(5 + idx);
    row.height = 20;

    row.getCell(1).value = s.name;
    row.getCell(2).value = s.openingBalance;
    row.getCell(3).value = s.totalExpenses;
    row.getCell(4).value = s.totalReceived;
    row.getCell(5).value = s.closingBalance;
    row.getCell(6).value = s.status;

    [2, 3, 4, 5].forEach((c) => {
      row.getCell(c).numFmt = INR_FMT;
    });

    const statusColor = s.status === 'Settled' ? SETTLED_COLOR
      : s.status === 'Due from Father' ? DUE_COLOR : '7030A0';
    row.getCell(6).font = { bold: true, color: { argb: 'FF' + statusColor } };

    if (idx % 2 === 1) {
      [1, 2, 3, 4, 5, 6].forEach((c) => {
        row.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F7FF' } };
      });
    }
    [1, 2, 3, 4, 5, 6].forEach((c) => applyBorder(row.getCell(c)));

    cumOpening += s.openingBalance;
    cumExpenses += s.totalExpenses;
    cumReceived += s.totalReceived;
  });

  // Blank row then Cumulative
  const cumRowIdx = 5 + summaries.length + 1;
  const cumRow = ws.getRow(cumRowIdx);
  cumRow.height = 22;
  cumRow.getCell(1).value = 'Cumulative Total';
  cumRow.getCell(2).value = summaries[0]?.openingBalance || 0;
  cumRow.getCell(3).value = cumExpenses;
  cumRow.getCell(4).value = cumReceived;
  cumRow.getCell(5).value = (summaries[0]?.openingBalance || 0) + cumExpenses - cumReceived;
  [1, 2, 3, 4, 5].forEach((c) => {
    cumRow.getCell(c).font = { bold: true };
    cumRow.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: TOTAL_BG } };
    applyBorder(cumRow.getCell(c));
  });
  [2, 3, 4, 5].forEach((c) => (cumRow.getCell(c).numFmt = INR_FMT));
}

function buildMonthSheet(workbook, summary, expenses, payments) {
  const ws = workbook.addWorksheet(summary.name);

  ws.columns = [
    { width: 14 },
    { width: 18 },
    { width: 32 },
    { width: 14 },
    { width: 18 },
    { width: 22 },
  ];

  // ── Row 1 — Title ──
  ws.mergeCells('A1:F1');
  const title = ws.getCell('A1');
  title.value = `Household Expense Ledger - ${summary.name}`;
  title.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
  title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: TITLE_BG } };
  title.alignment = { vertical: 'middle', horizontal: 'center' };
  ws.getRow(1).height = 30;

  // Row 2 — Instructions
  ws.mergeCells('A2:F2');
  const instr = ws.getCell('A2');
  instr.value = 'Enter your data in the shaded cells. All totals and balances update automatically.';
  instr.font = { italic: true, color: { argb: 'FF595959' }, size: 10 };
  instr.alignment = { wrapText: true };
  ws.getRow(2).height = 20;

  // Row 3 — blank
  ws.getRow(3).height = 8;

  // ── SECTION 1 ──
  ws.mergeCells('A4:F4');
  styleSectionHeader(ws.getCell('A4'), '1.  Monthly Expenses');
  ws.getRow(4).height = 22;

  // Row 5 — blank
  ws.getRow(5).height = 6;

  // Row 6 — Expense headers
  ['Date', 'Category', 'Description', 'Amount (₹)', 'Paid From', 'Status'].forEach((h, i) =>
    styleHeaderCell(ws.getRow(6).getCell(i + 1), h)
  );
  ws.getRow(6).height = 20;

  // Rows 7–46 — Expense data (max 40 entries)
  const maxExpenses = 40;
  for (let i = 0; i < maxExpenses; i++) {
    const rowNum = 7 + i;
    const row = ws.getRow(rowNum);
    row.height = 18;
    const exp = expenses[i];
    if (exp) {
      row.getCell(1).value = exp.date;
      row.getCell(2).value = exp.category;
      row.getCell(3).value = exp.description;
      row.getCell(4).value = exp.amount;
      row.getCell(4).numFmt = INR_FMT;
      row.getCell(5).value = exp.paid_from;
      row.getCell(6).value = exp.status;

      const sColor = exp.status === 'Settled' ? SETTLED_COLOR : DUE_COLOR;
      row.getCell(6).font = { color: { argb: 'FF' + sColor }, bold: true };

      if (exp.paid_from === 'Own Money') {
        [1, 2, 3, 4, 5, 6].forEach((c) => {
          row.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF8F0' } };
        });
      }
    }
    [1, 2, 3, 4, 5, 6].forEach((c) => applyBorder(row.getCell(c)));
  }

  // Row 47 — Total Expenses
  const totExpRow = ws.getRow(47);
  totExpRow.height = 22;
  totExpRow.getCell(3).value = 'Total Expenses (this month)';
  totExpRow.getCell(3).font = { bold: true };
  totExpRow.getCell(3).alignment = { horizontal: 'right' };
  totExpRow.getCell(4).value = summary.totalExpenses;
  totExpRow.getCell(4).numFmt = INR_FMT;
  totExpRow.getCell(4).font = { bold: true };
  [3, 4].forEach((c) => {
    totExpRow.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: TOTAL_BG } };
    applyBorder(totExpRow.getCell(c));
  });

  // Row 48 — blank
  ws.getRow(48).height = 8;

  // ── SECTION 2 ──
  ws.mergeCells('A49:F49');
  styleSectionHeader(ws.getCell('A49'), '2.  Money Received from Father');
  ws.getRow(49).height = 22;

  // Row 50 — Payment headers
  ['Date', 'Amount Received (₹)', 'Note'].forEach((h, i) =>
    styleHeaderCell(ws.getRow(50).getCell(i + 1), h)
  );
  ws.getRow(50).height = 20;

  // Rows 51–65 — Payment data (max 15 entries)
  const maxPayments = 15;
  for (let i = 0; i < maxPayments; i++) {
    const rowNum = 51 + i;
    const row = ws.getRow(rowNum);
    row.height = 18;
    const pay = payments[i];
    if (pay) {
      row.getCell(1).value = pay.date;
      row.getCell(2).value = pay.amount;
      row.getCell(2).numFmt = INR_FMT;
      row.getCell(3).value = pay.note;
    }
    [1, 2, 3].forEach((c) => applyBorder(row.getCell(c)));
  }

  // Row 66 — Total Received
  const totRecRow = ws.getRow(66);
  totRecRow.height = 22;
  totRecRow.getCell(1).value = 'Total Received (this month)';
  totRecRow.getCell(1).font = { bold: true };
  totRecRow.getCell(2).value = summary.totalReceived;
  totRecRow.getCell(2).numFmt = INR_FMT;
  totRecRow.getCell(2).font = { bold: true };
  [1, 2].forEach((c) => {
    totRecRow.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: TOTAL_BG } };
    applyBorder(totRecRow.getCell(c));
  });

  // Row 67 — blank
  ws.getRow(67).height = 8;

  // ── SECTION 3 ──
  ws.mergeCells('A68:F68');
  styleSectionHeader(ws.getCell('A68'), '3.  Monthly Summary');
  ws.getRow(68).height = 22;

  const summaryData = [
    ['Opening Balance (Due from Previous Month)', summary.openingBalance],
    ['Total Expenses (This Month)',              summary.totalExpenses],
    ['Total Due (Opening + Expenses)',           summary.totalDue],
    ['Total Received from Father (This Month)', summary.totalReceived],
    ['Closing Balance (Carried to Next Month)',  summary.closingBalance],
  ];

  summaryData.forEach(([label, value], i) => {
    const row = ws.getRow(69 + i);
    row.height = 20;
    row.getCell(1).value = label;
    row.getCell(1).font = { bold: i === 4 };
    row.getCell(3).value = value;
    row.getCell(3).numFmt = INR_FMT;
    row.getCell(3).font = { bold: i === 4 };
    [1, 3].forEach((c) => applyBorder(row.getCell(c)));
  });

  // Row 74 — Status
  const statusRow = ws.getRow(74);
  statusRow.height = 22;
  statusRow.getCell(1).value = 'Status';
  statusRow.getCell(1).font = { bold: true };
  statusRow.getCell(3).value = summary.status;
  const sColor = summary.status === 'Settled' ? SETTLED_COLOR
    : summary.status === 'Due from Father' ? DUE_COLOR : '7030A0';
  statusRow.getCell(3).font = { bold: true, color: { argb: 'FF' + sColor } };
  [1, 3].forEach((c) => applyBorder(statusRow.getCell(c)));
}

// GET /api/export
router.get('/', async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Household Expense App';
    workbook.created = new Date();

    const db = readDb();
    const sortedMonths = [...db.months].sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });

    const summaries = sortedMonths.map((m) => getMonthSummary(m.id));

    // Build Overview sheet
    buildOverviewSheet(workbook, summaries);

    // Build one sheet per month
    for (const summary of summaries) {
      const expenses = db.expenses
        .filter((e) => e.month_id === summary.id)
        .sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id);
      const payments = db.payments
        .filter((p) => p.month_id === summary.id)
        .sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id);

      buildMonthSheet(workbook, summary, expenses, payments);
    }

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
