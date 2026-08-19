# 🏠 Mo-Kharcha (Household Expense Tracker)

A professional household expense management web application designed to track monthly household expenses, family reimbursements/allowances, auto-calculate balances, and export spreadsheets matching exact ledger formats.

---

## ✨ Features

- **📊 Overview Dashboard:** 
  - Tracks all months with opening balances, total expenses, total received, closing dues, and status (`Due from Father` / `Overpaid by Father` / `Settled`).
  - Cumulative totals & month-wise expense vs received analytics.
- **📅 Monthly Ledger Sheets:**
  - **Section 1 (Expenses):** Categorized expense logging with `Own Money` vs `Father's Money` tracking.
  - **Section 2 (Money Received):** Record allowances and adjustments from family members.
  - **Section 3 (Monthly Summary):** Real-time auto-calculation of carried-forward balances and settlement statuses.
  - **Category Pie Charts:** Visual breakdown of expenditures.
- **📤 Exact Excel Export:** Export full records into formatted `.xlsx` workbooks identical to `Household_Expense.xlsx`.

---

## 🛠️ Tech Stack

- **Frontend:** React, Vite, Tailwind CSS, Recharts, Lucide Icons
- **Backend:** Node.js, Express, ExcelJS
- **Storage:** Local JSON-based persistent database

---

## 🚀 Quick Start (Local)

1. Clone repository:
   ```bash
   git clone https://github.com/missiarpita-dot/mo-kharcha.git
   cd mo-kharcha
   ```
2. On Windows, double-click **`START.bat`** or start manually:
   - **Backend:**
     ```bash
     cd backend
     npm install
     node server.js
     ```
   - **Frontend:**
     ```bash
     cd frontend
     npm install
     npm run dev
     ```
3. Open `http://localhost:3000` in your browser.
