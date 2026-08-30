const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Helper to get Supabase client
function getSupabaseClient() {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;
  if (SUPABASE_URL && SUPABASE_KEY) {
    try {
      return createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });
    } catch {}
  }
  return null;
}

// Local fallback file for PIN
const pinLocalFile = path.join(__dirname, '..', 'data', 'auth.json');
function getLocalPin() {
  try {
    if (fs.existsSync(pinLocalFile)) {
      const data = JSON.parse(fs.readFileSync(pinLocalFile, 'utf-8'));
      return data.pin || '1234';
    }
  } catch {}
  return '1234';
}

function setLocalPin(newPin) {
  try {
    const dir = path.dirname(pinLocalFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(pinLocalFile, JSON.stringify({ pin: newPin }, null, 2), 'utf-8');
  } catch {}
}

async function getStoredPin() {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'app_pin')
        .maybeSingle();

      if (!error && data && data.value) {
        return data.value;
      }

      // If not yet in table, insert default '1234'
      await supabase.from('app_settings').upsert({ key: 'app_pin', value: '1234' });
      return '1234';
    } catch (e) {
      console.error('Error reading PIN from Supabase:', e.message);
    }
  }
  return getLocalPin();
}

async function saveNewPin(newPin) {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert({ key: 'app_pin', value: String(newPin) });
      if (error) throw error;
      setLocalPin(newPin);
      return true;
    } catch (e) {
      console.error('Error saving PIN to Supabase:', e.message);
      throw e;
    }
  }
  setLocalPin(newPin);
  return true;
}

// POST /api/auth/verify-pin
router.post('/verify-pin', async (req, res) => {
  const { pin } = req.body;
  if (!pin) {
    return res.status(400).json({ error: 'PIN is required' });
  }

  try {
    const storedPin = await getStoredPin();
    if (String(pin).trim() === String(storedPin).trim()) {
      return res.json({ success: true, message: 'PIN verified' });
    }
    return res.status(401).json({ error: 'Incorrect PIN. Please try again.' });
  } catch (err) {
    res.status(500).json({ error: 'Authentication service error' });
  }
});

// POST /api/auth/change-pin
router.post('/change-pin', async (req, res) => {
  const { currentPin, newPin } = req.body;
  if (!currentPin || !newPin) {
    return res.status(400).json({ error: 'Current PIN and New PIN are required' });
  }

  if (!/^\d{4}$/.test(String(newPin).trim())) {
    return res.status(400).json({ error: 'New PIN must be exactly 4 numeric digits' });
  }

  try {
    const storedPin = await getStoredPin();
    if (String(currentPin).trim() !== String(storedPin).trim()) {
      return res.status(401).json({ error: 'Current PIN is incorrect' });
    }

    await saveNewPin(String(newPin).trim());
    return res.json({ success: true, message: 'PIN changed successfully across all devices' });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to update PIN' });
  }
});

module.exports = router;
