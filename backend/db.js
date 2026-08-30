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

// ─── Supabase Client Setup with Guaranteed Cloud Fallback ───────────────────
const DEFAULT_SUPABASE_URL = 'https://zbjzrdasvdlenvfmrsjd.supabase.co';
const DEFAULT_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpianpyZGFzdmRsZW52Zm1yc2pkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwOTIwNzgsImV4cCI6MjEwMzY2ODA3OH0.Ep_opStvzEO9XYZat0RSS2tN4ETljyafBMAhxmajA5E';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_KEY;

let supabase = null;
if (SUPABASE_URL && SUPABASE_KEY) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false }
    });
    console.log('✅ Supabase Client initialized successfully with URL:', SUPABASE_URL);
  } catch (err) {
    console.error('⚠️ Supabase init failed:', err.message);
  }
}

function isSupabaseReady() {
  return supabase !== null;
}

// ─── Universal Database Adapter ──────────────────────────────────────────────
const db = {
  // ── PIN Auth ────────────────────────────────────────────────────────────────
  async getPin() {
    if (isSupabaseReady()) {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'app_pin')
        .maybeSingle();
      if (!error && data && data.value) {
        return String(data.value).trim();
      }
      await supabase.from('app_settings').upsert({ key: 'app_pin', value: '1986' });
      return '1986';
    }
    return '1986';
  },

  async setPin(newPin) {
    const cleanPin = String(newPin).trim();
    if (isSupabaseReady()) {
      const { error } = await supabase
        .from('app_settings')
        .upsert({ key: 'app_pin', value: cleanPin });
      if (error) throw error;
      return true;
    }
    return true;
  },

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
    return [];
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
    return null;
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
    throw new Error('Database not ready');
  },

  async deleteMonth(id) {
    if (isSupabaseReady()) {
      await supabase.from('expenses').delete().eq('month_id', id);
      await supabase.from('payments').delete().eq('month_id', id);
      const { error } = await supabase.from('months').delete().eq('id', id);
      if (error) throw error;
      return;
    }
    throw new Error('Database not ready');
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
    return [];
  },

  async createExpense({ month_id, date, category, description, amount, paid_from }) {
    const status = paid_from === 'Own Money' ? 'Due from Father' : 'Settled';
    if (isSupabaseReady()) {
      const { data, error } = await supabase
        .from('expenses')
        .insert([{
          month_id: parseInt(month_id),
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
    throw new Error('Database not ready');
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
    throw new Error('Database not ready');
  },

  async deleteExpense(id) {
    if (isSupabaseReady()) {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) throw error;
      return;
    }
    throw new Error('Database not ready');
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
    return [];
  },

  async createPayment({ month_id, date, amount, note }) {
    if (isSupabaseReady()) {
      const { data, error } = await supabase
        .from('payments')
        .insert([{
          month_id: parseInt(month_id),
          date,
          amount: parseFloat(amount),
          note: note || ''
        }])
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    throw new Error('Database not ready');
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
    throw new Error('Database not ready');
  },

  async deletePayment(id) {
    if (isSupabaseReady()) {
      const { error } = await supabase.from('payments').delete().eq('id', id);
      if (error) throw error;
      return;
    }
    throw new Error('Database not ready');
  }
};

module.exports = { db, isSupabaseReady };
