const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// ─── Auto-load .env file if present ──────────────────────────────────────────
const envPaths = [
  path.join(__dirname, '..', '.env'),
  path.join(__dirname, '.env')
];
for (const ep of envPaths) {
  if (fs.existsSync(ep)) {
    try {
      const content = fs.readFileSync(ep, 'utf-8');
      content.split(/\r?\n/).forEach((line) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const idx = trimmed.indexOf('=');
          if (idx !== -1) {
            const key = trimmed.substring(0, idx).trim();
            const val = trimmed.substring(idx + 1).trim();
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        }
      });
    } catch {}
  }
}

// ─── Supabase Client Setup ───────────────────────────────────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

let supabase = null;
if (SUPABASE_URL && SUPABASE_KEY) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false }
    });
    console.log('✅ Supabase Client initialized successfully');
  } catch (err) {
    console.error('⚠️ Supabase init failed, using local JSON fallback:', err.message);
  }
}

function isSupabaseReady() {
  return supabase !== null;
}

// ─── Local JSON fallback (for offline / local dev) ───────────────────────────
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

// ─── Universal Database Adapter ──────────────────────────────────────────────
const db = {
  // ── Months ──────────────────────────────────────────────────────────────────
  async getAllMonths() {
    if (isSupabaseReady()) {
      const { data, error } = await supabase
        .from('months')
        .select('*')
        .order('year', { ascending: true })
        .order('month', { ascending: true });
      if (error) throw error;
      return data || [];
    }
    const local = readLocal();
    return [...local.months].sort((a, b) => (a.year !== b.year ? a.year - b.year : a.month - b.month));
  },

  async getMonthById(id) {
    if (isSupabaseReady()) {
      const { data, error } = await supabase
        .from('months')
        .select('*')
        .eq('id', id)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    }
    const local = readLocal();
    return local.months.find((m) => String(m.id) === String(id)) || null;
  },

  async createMonth({ name, year, month }) {
    if (isSupabaseReady()) {
      const { data: existing } = await supabase
        .from('months')
        .select('id')
        .eq('year', year)
        .eq('month', month)
        .maybeSingle();
      if (existing) throw new Error('This month already exists');

      const { data, error } = await supabase
        .from('months')
        .insert([{ name, year: parseInt(year), month: parseInt(month) }])
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    const local = readLocal();
    if (local.months.some((m) => m.year === year && m.month === month)) {
      throw new Error('This month already exists');
    }
    const newId = local.months.length > 0 ? Math.max(...local.months.map((m) => m.id)) + 1 : 1;
    const newMonth = { id: newId, name, year, month, created_at: new Date().toISOString() };
    local.months.push(newMonth);
    writeLocal(local);
    return newMonth;
  },

  async deleteMonth(id) {
    if (isSupabaseReady()) {
      await supabase.from('expenses').delete().eq('month_id', id);
      await supabase.from('payments').delete().eq('month_id', id);
      const { error } = await supabase.from('months').delete().eq('id', id);
      if (error) throw error;
      return;
    }
    const local = readLocal();
    local.months = local.months.filter((m) => String(m.id) !== String(id));
    local.expenses = local.expenses.filter((e) => String(e.month_id) !== String(id));
    local.payments = local.payments.filter((p) => String(p.month_id) !== String(id));
    writeLocal(local);
  },

  // ── Expenses ─────────────────────────────────────────────────────────────────
  async getExpensesByMonth(monthId) {
    if (isSupabaseReady()) {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('month_id', monthId)
        .order('date', { ascending: true })
        .order('id', { ascending: true });
      if (error) throw error;
      return data || [];
    }
    return readLocal()
      .expenses.filter((e) => String(e.month_id) === String(monthId))
      .sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id);
  },

  async createExpense({ month_id, date, category, description, amount, paid_from }) {
    const status = paid_from === 'Own Money' ? 'Due from Father' : 'Settled';
    if (isSupabaseReady()) {
      const { data, error } = await supabase
        .from('expenses')
        .insert([{
          month_id,
          date,
          category,
          description: description || '',
          amount: parseFloat(amount),
          paid_from,
          status
        }])
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    const local = readLocal();
    const newId = local.expenses.length > 0 ? Math.max(...local.expenses.map((e) => e.id)) + 1 : 1;
    const newExp = {
      id: newId,
      month_id: parseInt(month_id),
      date,
      category,
      description: description || '',
      amount: parseFloat(amount),
      paid_from,
      status
    };
    local.expenses.push(newExp);
    writeLocal(local);
    return newExp;
  },

  async updateExpense(id, { date, category, description, amount, paid_from }) {
    const status = paid_from === 'Own Money' ? 'Due from Father' : 'Settled';
    if (isSupabaseReady()) {
      const { data, error } = await supabase
        .from('expenses')
        .update({
          date,
          category,
          description: description || '',
          amount: parseFloat(amount),
          paid_from,
          status
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    const local = readLocal();
    const idx = local.expenses.findIndex((e) => String(e.id) === String(id));
    if (idx === -1) return null;
    local.expenses[idx] = {
      ...local.expenses[idx],
      date,
      category,
      description: description || '',
      amount: parseFloat(amount),
      paid_from,
      status
    };
    writeLocal(local);
    return local.expenses[idx];
  },

  async deleteExpense(id) {
    if (isSupabaseReady()) {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) throw error;
      return;
    }
    const local = readLocal();
    local.expenses = local.expenses.filter((e) => String(e.id) !== String(id));
    writeLocal(local);
  },

  // ── Payments ─────────────────────────────────────────────────────────────────
  async getPaymentsByMonth(monthId) {
    if (isSupabaseReady()) {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('month_id', monthId)
        .order('date', { ascending: true })
        .order('id', { ascending: true });
      if (error) throw error;
      return data || [];
    }
    return readLocal()
      .payments.filter((p) => String(p.month_id) === String(monthId))
      .sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id);
  },

  async createPayment({ month_id, date, amount, note }) {
    if (isSupabaseReady()) {
      const { data, error } = await supabase
        .from('payments')
        .insert([{
          month_id,
          date,
          amount: parseFloat(amount),
          note: note || ''
        }])
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    const local = readLocal();
    const newId = local.payments.length > 0 ? Math.max(...local.payments.map((p) => p.id)) + 1 : 1;
    const newPay = {
      id: newId,
      month_id: parseInt(month_id),
      date,
      amount: parseFloat(amount),
      note: note || ''
    };
    local.payments.push(newPay);
    writeLocal(local);
    return newPay;
  },

  async updatePayment(id, { date, amount, note }) {
    if (isSupabaseReady()) {
      const { data, error } = await supabase
        .from('payments')
        .update({
          date,
          amount: parseFloat(amount),
          note: note || ''
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    const local = readLocal();
    const idx = local.payments.findIndex((p) => String(p.id) === String(id));
    if (idx === -1) return null;
    local.payments[idx] = {
      ...local.payments[idx],
      date,
      amount: parseFloat(amount),
      note: note || ''
    };
    writeLocal(local);
    return local.payments[idx];
  },

  async deletePayment(id) {
    if (isSupabaseReady()) {
      const { error } = await supabase.from('payments').delete().eq('id', id);
      if (error) throw error;
      return;
    }
    const local = readLocal();
    local.payments = local.payments.filter((p) => String(p.id) !== String(id));
    writeLocal(local);
  }
};

module.exports = { db, isSupabaseReady };
