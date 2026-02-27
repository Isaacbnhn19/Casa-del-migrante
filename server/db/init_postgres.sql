CREATE TABLE IF NOT EXISTS donations (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  amount INTEGER NOT NULL CHECK (amount > 0),
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS donations_created_at_idx ON donations(created_at);