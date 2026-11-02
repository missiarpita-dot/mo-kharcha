const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// Routes (supporting both /api/* and /* for Vercel Serverless compatibility)
const authRouter     = require('./routes/auth');
const monthsRouter   = require('./routes/months');
const expensesRouter = require('./routes/expenses');
const paymentsRouter = require('./routes/payments');
const exportRouter   = require('./routes/export');

app.use('/api/auth',     authRouter);
app.use('/auth',         authRouter);

app.use('/api/months',   monthsRouter);
app.use('/months',       monthsRouter);

app.use('/api/expenses', expensesRouter);
app.use('/expenses',     expensesRouter);

app.use('/api/payments', paymentsRouter);
app.use('/payments',     paymentsRouter);

app.use('/api/export',   exportRouter);
app.use('/export',       exportRouter);

// Health & Auto Keep-Alive endpoint (also used by Vercel Cron to prevent Supabase pause)
app.get(['/api/health', '/health', '/api/keepalive', '/keepalive'], async (req, res) => {
  const { db, isSupabaseReady } = require('./db');
  const ping = await db.keepAlive();
  res.json({
    status: 'ok',
    database: isSupabaseReady() && ping.ok ? 'supabase' : 'backup-fallback',
    keepAlive: ping
  });
});

const PORT = process.env.PORT || 5000;
if (!process.env.VERCEL) {
  app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
}

module.exports = app;
