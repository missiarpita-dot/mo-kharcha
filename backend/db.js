const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// ─── MongoDB Connection ───────────────────────────────────────────────────────
const MONGO_URI = process.env.MONGO_URI;

let mongoConnected = false;

async function connectMongo() {
  if (MONGO_URI && !mongoConnected) {
    try {
      await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
      mongoConnected = true;
      console.log('✅ MongoDB Atlas connected');
    } catch (err) {
      console.error('⚠️ MongoDB connection failed, using local JSON fallback:', err.message);
    }
  }
}

connectMongo();

// ─── Mongoose Schemas ─────────────────────────────────────────────────────────
const MonthSchema = new mongoose.Schema({
  name:       { type: String, required: true },
  year:       { type: Number, required: true },
  month:      { type: Number, required: true },
  created_at: { type: String, default: () => new Date().toISOString() }
});

const ExpenseSchema = new mongoose.Schema({
  month_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Month', required: true },
  date:        { type: String, required: true },
  category:    { type: String, required: true },
  description: { type: String, default: '' },
  amount:      { type: Number, required: true },
  paid_from:   { type: String, required: true },
  status:      { type: String, required: true }
});

const PaymentSchema = new mongoose.Schema({
  month_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Month', required: true },
  date:     { type: String, required: true },
  amount:   { type: Number, required: true },
  note:     { type: String, default: '' }
});

const MonthModel   = mongoose.models.Month   || mongoose.model('Month',   MonthSchema);
const ExpenseModel = mongoose.models.Expense || mongoose.model('Expense', ExpenseSchema);
const PaymentModel = mongoose.models.Payment || mongoose.model('Payment', PaymentSchema);

// ─── Local JSON fallback ──────────────────────────────────────────────────────
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbFile = path.join(dataDir, 'db.json');

function readLocal() {
  try {
    return JSON.parse(fs.readFileSync(dbFile, 'utf-8'));
  } catch {
    return { months: [], expenses: [], payments: [] };
  }
}

function writeLocal(data) {
  try {
    fs.writeFileSync(dbFile, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Local write error:', err.message);
  }
}

// ─── DB Adapter: works with either MongoDB or local JSON ──────────────────────
function isMongoReady() {
  return mongoConnected && mongoose.connection.readyState === 1;
}

const db = {
  // ── Months ──────────────────────────────────────────────────────────────────
  async getAllMonths() {
    if (isMongoReady()) {
      const docs = await MonthModel.find().sort({ year: 1, month: 1 });
      return docs.map(d => ({ id: d._id.toString(), name: d.name, year: d.year, month: d.month, created_at: d.created_at }));
    }
    const local = readLocal();
    return [...local.months].sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month);
  },

  async getMonthById(id) {
    if (isMongoReady()) {
      try {
        const d = await MonthModel.findById(id);
        if (!d) return null;
        return { id: d._id.toString(), name: d.name, year: d.year, month: d.month, created_at: d.created_at };
      } catch { return null; }
    }
    const local = readLocal();
    return local.months.find(m => String(m.id) === String(id)) || null;
  },

  async createMonth({ name, year, month }) {
    if (isMongoReady()) {
      const exists = await MonthModel.findOne({ year, month });
      if (exists) throw new Error('This month already exists');
      const doc = await MonthModel.create({ name, year, month });
      return { id: doc._id.toString(), name: doc.name, year: doc.year, month: doc.month, created_at: doc.created_at };
    }
    const local = readLocal();
    if (local.months.some(m => m.year === year && m.month === month)) throw new Error('This month already exists');
    const newId = local.months.length > 0 ? Math.max(...local.months.map(m => m.id)) + 1 : 1;
    const newMonth = { id: newId, name, year, month, created_at: new Date().toISOString() };
    local.months.push(newMonth);
    writeLocal(local);
    return newMonth;
  },

  async deleteMonth(id) {
    if (isMongoReady()) {
      await MonthModel.findByIdAndDelete(id);
      await ExpenseModel.deleteMany({ month_id: id });
      await PaymentModel.deleteMany({ month_id: id });
      return;
    }
    const local = readLocal();
    local.months = local.months.filter(m => String(m.id) !== String(id));
    local.expenses = local.expenses.filter(e => String(e.month_id) !== String(id));
    local.payments = local.payments.filter(p => String(p.month_id) !== String(id));
    writeLocal(local);
  },

  // ── Expenses ─────────────────────────────────────────────────────────────────
  async getExpensesByMonth(monthId) {
    if (isMongoReady()) {
      const docs = await ExpenseModel.find({ month_id: monthId }).sort({ date: 1 });
      return docs.map(d => ({ id: d._id.toString(), month_id: d.month_id.toString(), date: d.date, category: d.category, description: d.description, amount: d.amount, paid_from: d.paid_from, status: d.status }));
    }
    return readLocal().expenses.filter(e => String(e.month_id) === String(monthId)).sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id);
  },

  async createExpense({ month_id, date, category, description, amount, paid_from }) {
    const status = paid_from === 'Own Money' ? 'Due from Father' : 'Settled';
    if (isMongoReady()) {
      const doc = await ExpenseModel.create({ month_id, date, category, description: description || '', amount, paid_from, status });
      return { id: doc._id.toString(), month_id: doc.month_id.toString(), date: doc.date, category: doc.category, description: doc.description, amount: doc.amount, paid_from: doc.paid_from, status: doc.status };
    }
    const local = readLocal();
    const newId = local.expenses.length > 0 ? Math.max(...local.expenses.map(e => e.id)) + 1 : 1;
    const newExp = { id: newId, month_id: parseInt(month_id), date, category, description: description || '', amount: parseFloat(amount), paid_from, status };
    local.expenses.push(newExp);
    writeLocal(local);
    return newExp;
  },

  async updateExpense(id, { date, category, description, amount, paid_from }) {
    const status = paid_from === 'Own Money' ? 'Due from Father' : 'Settled';
    if (isMongoReady()) {
      const doc = await ExpenseModel.findByIdAndUpdate(id, { date, category, description: description || '', amount, paid_from, status }, { new: true });
      if (!doc) return null;
      return { id: doc._id.toString(), month_id: doc.month_id.toString(), date: doc.date, category: doc.category, description: doc.description, amount: doc.amount, paid_from: doc.paid_from, status: doc.status };
    }
    const local = readLocal();
    const idx = local.expenses.findIndex(e => String(e.id) === String(id));
    if (idx === -1) return null;
    local.expenses[idx] = { ...local.expenses[idx], date, category, description: description || '', amount: parseFloat(amount), paid_from, status };
    writeLocal(local);
    return local.expenses[idx];
  },

  async deleteExpense(id) {
    if (isMongoReady()) {
      await ExpenseModel.findByIdAndDelete(id);
      return;
    }
    const local = readLocal();
    local.expenses = local.expenses.filter(e => String(e.id) !== String(id));
    writeLocal(local);
  },

  // ── Payments ─────────────────────────────────────────────────────────────────
  async getPaymentsByMonth(monthId) {
    if (isMongoReady()) {
      const docs = await PaymentModel.find({ month_id: monthId }).sort({ date: 1 });
      return docs.map(d => ({ id: d._id.toString(), month_id: d.month_id.toString(), date: d.date, amount: d.amount, note: d.note }));
    }
    return readLocal().payments.filter(p => String(p.month_id) === String(monthId)).sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id);
  },

  async createPayment({ month_id, date, amount, note }) {
    if (isMongoReady()) {
      const doc = await PaymentModel.create({ month_id, date, amount, note: note || '' });
      return { id: doc._id.toString(), month_id: doc.month_id.toString(), date: doc.date, amount: doc.amount, note: doc.note };
    }
    const local = readLocal();
    const newId = local.payments.length > 0 ? Math.max(...local.payments.map(p => p.id)) + 1 : 1;
    const newPay = { id: newId, month_id: parseInt(month_id), date, amount: parseFloat(amount), note: note || '' };
    local.payments.push(newPay);
    writeLocal(local);
    return newPay;
  },

  async updatePayment(id, { date, amount, note }) {
    if (isMongoReady()) {
      const doc = await PaymentModel.findByIdAndUpdate(id, { date, amount, note: note || '' }, { new: true });
      if (!doc) return null;
      return { id: doc._id.toString(), month_id: doc.month_id.toString(), date: doc.date, amount: doc.amount, note: doc.note };
    }
    const local = readLocal();
    const idx = local.payments.findIndex(p => String(p.id) === String(id));
    if (idx === -1) return null;
    local.payments[idx] = { ...local.payments[idx], date, amount: parseFloat(amount), note: note || '' };
    writeLocal(local);
    return local.payments[idx];
  },

  async deletePayment(id) {
    if (isMongoReady()) {
      await PaymentModel.findByIdAndDelete(id);
      return;
    }
    const local = readLocal();
    local.payments = local.payments.filter(p => String(p.id) !== String(id));
    writeLocal(local);
  }
};

module.exports = { db, isMongoReady };
