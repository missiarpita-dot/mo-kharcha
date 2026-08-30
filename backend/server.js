const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/months',   require('./routes/months'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/export',   require('./routes/export'));

// Health check
app.get('/api/health', (req, res) => {
  const { isSupabaseReady } = require('./db');
  res.json({ status: 'ok', database: isSupabaseReady() ? 'supabase' : 'local-json' });
});

const PORT = process.env.PORT || 5000;
if (!process.env.VERCEL) {
  app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
}

module.exports = app;
