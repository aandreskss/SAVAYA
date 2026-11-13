CREATE TABLE IF NOT EXISTS google_purchase_events (
  order_id uuid PRIMARY KEY REFERENCES orders(id) ON DELETE CASCADE,
  context jsonb,
  state text NOT NULL DEFAULT 'pending',
  attempts integer NOT NULL DEFAULT 0,
  occurred_at timestamptz,
  lease_until timestamptz,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT google_purchase_events_state_check
    CHECK (state IN ('pending', 'sending', 'sent', 'skipped', 'failed'))
);
CREATE INDEX IF NOT EXISTS google_purchase_events_retry_idx
  ON google_purchase_events(state, next_attempt_at);
