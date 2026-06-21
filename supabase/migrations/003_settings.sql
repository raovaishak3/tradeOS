-- ============================================================================
-- Trading Brain OS — Settings Schema
-- Migration 003: User settings and API key storage
-- ============================================================================

CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  encrypted BOOLEAN DEFAULT false,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_settings_key ON user_settings(key);
CREATE INDEX idx_settings_category ON user_settings(category);

-- Seed default settings
INSERT INTO user_settings (key, value, category, description) VALUES
  ('llm_provider', 'deepseek', 'ai', 'LLM provider for reasoning engine'),
  ('llm_model', 'deepseek-chat', 'ai', 'Model name for reasoning'),
  ('llm_api_key', '', 'ai', 'API key for LLM provider'),
  ('llm_base_url', 'https://api.deepseek.com', 'ai', 'Base URL for LLM API'),
  ('embedding_provider', 'openai', 'ai', 'Embedding model provider'),
  ('embedding_api_key', '', 'ai', 'API key for embeddings'),
  ('mt5_mcp_url', '', 'integrations', 'MT5 MCP server URL'),
  ('tradingview_mcp_url', '', 'integrations', 'TradingView MCP server URL'),
  ('max_risk_per_trade', '1.0', 'risk', 'Maximum risk percentage per trade'),
  ('max_daily_loss', '3.0', 'risk', 'Maximum daily loss percentage'),
  ('max_open_trades', '5', 'risk', 'Maximum simultaneous open trades'),
  ('preferred_session', 'london', 'trading', 'Preferred trading session'),
  ('min_confidence', '80', 'trading', 'Minimum confidence for execution');
