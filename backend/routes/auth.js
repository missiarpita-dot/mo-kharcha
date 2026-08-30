const express = require('express');
const router = express.Router();
const { db } = require('../db');

// POST /api/auth/verify-pin
router.post('/verify-pin', async (req, res) => {
  const { pin } = req.body;
  if (!pin) {
    return res.status(400).json({ error: 'PIN is required' });
  }

  try {
    const storedPin = await db.getPin();
    if (String(pin).trim() === String(storedPin).trim()) {
      return res.json({ success: true, message: 'PIN verified' });
    }
    return res.status(401).json({ error: 'Incorrect PIN. Please try again.' });
  } catch (err) {
    console.error('Verify PIN error:', err.message);
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
    const storedPin = await db.getPin();
    if (String(currentPin).trim() !== String(storedPin).trim()) {
      return res.status(401).json({ error: 'Current PIN is incorrect' });
    }

    await db.setPin(String(newPin).trim());
    return res.json({ success: true, message: 'PIN changed successfully across all devices' });
  } catch (err) {
    console.error('Change PIN error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to update PIN' });
  }
});

module.exports = router;
