-- ============================================================================
-- Trading Brain OS — Trading Engine Schema
-- Migration 002: AOIs, analyses, trades, decisions, notifications
-- ============================================================================

-- ─── Top Down Analyses ───────────────────────────────────────────────────────

CREATE TABLE top_down_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL,
  brain_version_id UUID REFERENCES brain_versions(id),
  bias TEXT NOT NULL CHECK (bias IN ('strong_bullish', 'bullish', 'neutral', 'bearish', 'strong_bearish')),
  market_state TEXT NOT NULL,
  alignment_score NUMERIC(5,2) DEFAULT 0,
  institutional_narrative TEXT,
  liquidity_objective JSONB DEFAULT '{}',
  timeframe_analyses JSONB DEFAULT '{}',
  playbook_candidates JSONB DEFAULT '[]',
  confidence NUMERIC(5,2) DEFAULT 0,
  valid BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_tda_symbol ON top_down_analyses(symbol);
CREATE INDEX idx_tda_created ON top_down_analyses(created_at DESC);
CREATE INDEX idx_tda_valid ON top_down_analyses(valid) WHERE valid = true;

-- ─── Areas of Interest ───────────────────────────────────────────────────────

CREATE TABLE aois (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL,
  brain_version_id UUID REFERENCES brain_versions(id),
  playbook_id UUID REFERENCES playbooks(id),
  aoi_type TEXT NOT NULL,
  source_timeframe TEXT NOT NULL,
  upper_boundary NUMERIC(20,8) NOT NULL,
  lower_boundary NUMERIC(20,8) NOT NULL,
  status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'valid', 'watching', 'approaching', 'touched', 'monitoring', 'confirmed', 'executed', 'invalid', 'archived')),
  freshness TEXT NOT NULL DEFAULT 'fresh'
    CHECK (freshness IN ('fresh', 'partially_mitigated', 'mitigated', 'consumed', 'invalid')),
  confidence NUMERIC(5,2) DEFAULT 0,
  quality_score NUMERIC(5,2) DEFAULT 0,
  institutional_score NUMERIC(5,2) DEFAULT 0,
  liquidity_score NUMERIC(5,2) DEFAULT 0,
  structure_score NUMERIC(5,2) DEFAULT 0,
  macro_score NUMERIC(5,2) DEFAULT 0,
  session_score NUMERIC(5,2) DEFAULT 0,
  supporting_evidence JSONB DEFAULT '[]',
  contradicting_evidence JSONB DEFAULT '[]',
  invalidation_rules JSONB DEFAULT '[]',
  reasoning_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  invalidated_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_aois_symbol ON aois(symbol);
CREATE INDEX idx_aois_status ON aois(status);
CREATE INDEX idx_aois_type ON aois(aoi_type);
CREATE INDEX idx_aois_active ON aois(symbol, status) WHERE status NOT IN ('invalid', 'archived');

-- ─── Confirmation Signals ────────────────────────────────────────────────────

CREATE TABLE confirmation_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aoi_id UUID REFERENCES aois(id),
  signal_type TEXT NOT NULL,
  symbol TEXT NOT NULL,
  timeframe TEXT NOT NULL,
  strength TEXT NOT NULL CHECK (strength IN ('weak', 'moderate', 'strong', 'institutional', 'exceptional')),
  confidence NUMERIC(5,2) DEFAULT 0,
  source TEXT,
  dependencies JSONB DEFAULT '[]',
  explanation TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'invalid')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_signals_aoi ON confirmation_signals(aoi_id);
CREATE INDEX idx_signals_symbol ON confirmation_signals(symbol);
CREATE INDEX idx_signals_active ON confirmation_signals(status) WHERE status = 'active';

-- ─── Decisions ───────────────────────────────────────────────────────────────

CREATE TABLE decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brain_version_id UUID REFERENCES brain_versions(id),
  symbol TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('buy', 'sell', 'neutral')),
  decision TEXT NOT NULL,
  playbook_id UUID REFERENCES playbooks(id),
  confidence NUMERIC(5,2) DEFAULT 0,
  decision_confidence NUMERIC(5,2) DEFAULT 0,
  supporting_evidence JSONB DEFAULT '[]',
  contradicting_evidence JSONB DEFAULT '[]',
  alternative_decisions JSONB DEFAULT '[]',
  reasoning_tree JSONB DEFAULT '{}',
  decision_tree JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'generated'
    CHECK (status IN ('generated', 'approved', 'rejected', 'executed', 'expired', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_decisions_symbol ON decisions(symbol);
CREATE INDEX idx_decisions_status ON decisions(status);
CREATE INDEX idx_decisions_created ON decisions(created_at DESC);

-- ─── Trade Plans ─────────────────────────────────────────────────────────────

CREATE TABLE trade_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id UUID REFERENCES decisions(id),
  symbol TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('buy', 'sell')),
  playbook_id UUID REFERENCES playbooks(id),
  entry_type TEXT NOT NULL,
  entry_price NUMERIC(20,8) NOT NULL,
  stop_loss NUMERIC(20,8) NOT NULL,
  take_profits JSONB DEFAULT '[]',
  risk_percent NUMERIC(5,2) NOT NULL,
  lot_size NUMERIC(10,4),
  expected_rr NUMERIC(5,2),
  confidence NUMERIC(5,2) DEFAULT 0,
  quality_score NUMERIC(5,2) DEFAULT 0,
  reasoning TEXT,
  status TEXT NOT NULL DEFAULT 'planned'
    CHECK (status IN ('planned', 'ready', 'waiting_for_approval', 'approved', 'submitted', 'active', 'cancelled', 'expired', 'rejected')),
  brain_version_id UUID REFERENCES brain_versions(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_trade_plans_symbol ON trade_plans(symbol);
CREATE INDEX idx_trade_plans_status ON trade_plans(status);

-- ─── Active Trades ───────────────────────────────────────────────────────────

CREATE TABLE active_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_plan_id UUID REFERENCES trade_plans(id),
  symbol TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('buy', 'sell')),
  playbook_id UUID REFERENCES playbooks(id),
  entry_price NUMERIC(20,8) NOT NULL,
  current_price NUMERIC(20,8),
  stop_loss NUMERIC(20,8) NOT NULL,
  take_profits JSONB DEFAULT '[]',
  lot_size NUMERIC(10,4) NOT NULL,
  floating_pnl NUMERIC(20,2) DEFAULT 0,
  current_rr NUMERIC(5,2) DEFAULT 0,
  current_confidence NUMERIC(5,2) DEFAULT 0,
  trade_health NUMERIC(5,2) DEFAULT 100,
  management_state TEXT NOT NULL DEFAULT 'active'
    CHECK (management_state IN ('active', 'building', 'profit', 'break_even', 'running', 'scaling', 'partial_exit', 'exit_ready', 'complete', 'invalid', 'emergency', 'manual_review')),
  max_favorable_excursion NUMERIC(20,2) DEFAULT 0,
  max_adverse_excursion NUMERIC(20,2) DEFAULT 0,
  mt5_ticket TEXT,
  brain_version_id UUID REFERENCES brain_versions(id),
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_active_trades_symbol ON active_trades(symbol);
CREATE INDEX idx_active_trades_state ON active_trades(management_state);
CREATE INDEX idx_active_trades_open ON active_trades(management_state) WHERE management_state NOT IN ('complete', 'invalid');

-- ─── Trade Timeline ──────────────────────────────────────────────────────────

CREATE TABLE trade_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id UUID NOT NULL REFERENCES active_trades(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  description TEXT NOT NULL,
  confidence NUMERIC(5,2),
  trade_health NUMERIC(5,2),
  recommendation TEXT,
  approved BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_timeline_trade ON trade_timeline(trade_id);
CREATE INDEX idx_timeline_created ON trade_timeline(created_at DESC);

-- ─── Experiences ─────────────────────────────────────────────────────────────

CREATE TABLE experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id UUID REFERENCES active_trades(id),
  symbol TEXT NOT NULL,
  direction TEXT,
  playbook_id UUID REFERENCES playbooks(id),
  category TEXT NOT NULL,
  session TEXT,
  market_state TEXT,
  result TEXT,
  entry_price NUMERIC(20,8),
  exit_price NUMERIC(20,8),
  risk_reward NUMERIC(5,2),
  pnl NUMERIC(20,2),
  confidence NUMERIC(5,2),
  trade_health NUMERIC(5,2),
  reasoning_tree JSONB DEFAULT '{}',
  lessons JSONB DEFAULT '[]',
  tags JSONB DEFAULT '[]',
  market_snapshot JSONB DEFAULT '{}',
  brain_version_id UUID REFERENCES brain_versions(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_experiences_symbol ON experiences(symbol);
CREATE INDEX idx_experiences_category ON experiences(category);
CREATE INDEX idx_experiences_playbook ON experiences(playbook_id);
CREATE INDEX idx_experiences_created ON experiences(created_at DESC);

-- ─── Notifications ───────────────────────────────────────────────────────────

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('critical', 'high', 'medium', 'low', 'info')),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  description TEXT,
  subsystem TEXT NOT NULL,
  market TEXT,
  trade_id UUID REFERENCES active_trades(id),
  playbook_id UUID REFERENCES playbooks(id),
  action_required BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'created'
    CHECK (status IN ('created', 'queued', 'sent', 'delivered', 'acknowledged', 'expired', 'failed', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_priority ON notifications(priority);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX idx_notifications_pending ON notifications(status, priority) WHERE status IN ('created', 'sent', 'delivered');

-- ─── Watchlist ───────────────────────────────────────────────────────────────

CREATE TABLE watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  asset_class TEXT NOT NULL DEFAULT 'forex',
  market_status TEXT NOT NULL DEFAULT 'no_trade'
    CHECK (market_status IN ('no_trade', 'watch', 'building', 'ready', 'approval', 'active', 'managing', 'exit_ready', 'complete')),
  current_bias TEXT DEFAULT 'neutral',
  current_confidence NUMERIC(5,2) DEFAULT 0,
  current_playbook TEXT,
  active_aois INTEGER DEFAULT 0,
  last_analysis_at TIMESTAMPTZ,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_watchlist_enabled ON watchlist(enabled) WHERE enabled = true;

-- ─── Seed Default Watchlist ──────────────────────────────────────────────────

INSERT INTO watchlist (symbol, display_name, asset_class) VALUES
  ('EURUSD', 'EUR/USD', 'forex'),
  ('GBPUSD', 'GBP/USD', 'forex'),
  ('USDJPY', 'USD/JPY', 'forex'),
  ('AUDUSD', 'AUD/USD', 'forex'),
  ('USDCAD', 'USD/CAD', 'forex'),
  ('USDCHF', 'USD/CHF', 'forex'),
  ('NZDUSD', 'NZD/USD', 'forex'),
  ('XAUUSD', 'XAU/USD', 'commodity'),
  ('GBPJPY', 'GBP/JPY', 'forex'),
  ('EURJPY', 'EUR/JPY', 'forex'),
  ('EURGBP', 'EUR/GBP', 'forex'),
  ('AUDJPY', 'AUD/JPY', 'forex');
