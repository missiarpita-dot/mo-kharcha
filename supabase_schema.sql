-- ====================================================================
-- Mo-Kharcha (Household Expense Tracker) — Supabase PostgreSQL Schema
-- ====================================================================

-- 1. Create 'months' table
CREATE TABLE IF NOT EXISTS public.months (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  year INT NOT NULL,
  month INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_month_year UNIQUE (year, month)
);

-- 2. Create 'expenses' table
CREATE TABLE IF NOT EXISTS public.expenses (
  id BIGSERIAL PRIMARY KEY,
  month_id BIGINT NOT NULL REFERENCES public.months(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT DEFAULT '',
  amount NUMERIC NOT NULL,
  paid_from TEXT NOT NULL,
  status TEXT NOT NULL
);

-- 3. Create 'payments' table
CREATE TABLE IF NOT EXISTS public.payments (
  id BIGSERIAL PRIMARY KEY,
  month_id BIGINT NOT NULL REFERENCES public.months(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  note TEXT DEFAULT ''
);

-- 4. Create 'app_settings' table for centralized secure PIN & configuration
CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- 5. Enable Row Level Security (RLS) & allow public read/write with anon key
ALTER TABLE public.months ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on months" ON public.months
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on expenses" ON public.expenses
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on payments" ON public.payments
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on app_settings" ON public.app_settings
  FOR ALL USING (true) WITH CHECK (true);

-- 6. Seed Initial Data
INSERT INTO public.months (id, name, year, month, created_at)
VALUES 
  (1, 'July 2026', 2026, 7, '2026-07-01T00:00:00.000Z'),
  (2, 'August 2026', 2026, 8, '2026-08-01T00:00:00.000Z')
ON CONFLICT (year, month) DO NOTHING;

SELECT setval('public.months_id_seq', (SELECT COALESCE(MAX(id), 1) FROM public.months));

INSERT INTO public.expenses (month_id, date, category, description, amount, paid_from, status)
VALUES
  (1, '2026-07-03', 'Electricity', 'Electric bill', 2194, 'Own Money', 'Due from Father'),
  (1, '2026-07-05', 'Water', 'Water bill', 450, 'Father''s Money', 'Settled'),
  (1, '2026-07-07', 'Newspaper', 'Newspaper bill', 300, 'Father''s Money', 'Settled'),
  (1, '2026-07-10', 'Groceries', 'Ration/grocery expense', 3200, 'Own Money', 'Due from Father'),
  (1, '2026-07-12', 'Medicine', 'Mother''s homeopathy medicine', 970, 'Father''s Money', 'Settled'),
  (2, '2026-08-04', 'Electricity', 'Electric bill', 2050, 'Own Money', 'Due from Father'),
  (2, '2026-08-06', 'Water', 'Water bill', 420, 'Father''s Money', 'Settled')
ON CONFLICT DO NOTHING;

INSERT INTO public.payments (month_id, date, amount, note)
VALUES
  (1, '2026-07-02', 6000, 'July allowance'),
  (2, '2026-08-03', 8000, 'August allowance + July balance adjustment')
ON CONFLICT DO NOTHING;

INSERT INTO public.app_settings (key, value)
VALUES ('app_pin', '1234')
ON CONFLICT (key) DO NOTHING;
