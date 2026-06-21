-- ============================================================================
-- Trading Brain OS — Knowledge Core Schema
-- Migration 001: Brain versions, concepts, rules, relationships, playbooks
-- ============================================================================

-- Enable pgvector for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable pg_trgm for text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ─── Brain Versions ──────────────────────────────────────────────────────────

CREATE TABLE brain_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL UNIQUE,
  brain_id TEXT NOT NULL UNIQUE,
  knowledge_version TEXT NOT NULL,
  compiler_version TEXT NOT NULL,
  graph_version TEXT NOT NULL,
  playbook_version TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'draft'
    CHECK (state IN ('draft', 'testing', 'release_candidate', 'production', 'deprecated', 'archived')),
  fingerprint TEXT,
  total_concepts INTEGER DEFAULT 0,
  total_rules INTEGER DEFAULT 0,
  total_relationships INTEGER DEFAULT 0,
  total_playbooks INTEGER DEFAULT 0,
  coverage NUMERIC(5,2) DEFAULT 0,
  integrity_score NUMERIC(5,2) DEFAULT 0,
  release_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  released_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_brain_versions_state ON brain_versions(state);
CREATE INDEX idx_brain_versions_version ON brain_versions(version);

-- ─── Knowledge Domains ───────────────────────────────────────────────────────

CREATE TABLE knowledge_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  graph_level INTEGER NOT NULL DEFAULT 1,
  coverage NUMERIC(5,2) DEFAULT 0,
  concept_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Concepts ────────────────────────────────────────────────────────────────

CREATE TABLE concepts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_id TEXT NOT NULL UNIQUE,
  domain_id UUID NOT NULL REFERENCES knowledge_domains(id),
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  definition TEXT NOT NULL,
  purpose TEXT,
  version TEXT NOT NULL DEFAULT '1.0.0',
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'validated', 'approved', 'compiled', 'released', 'deprecated', 'archived')),
  graph_level INTEGER NOT NULL DEFAULT 1,
  priority TEXT NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('critical', 'high', 'normal', 'low', 'optional')),
  confidence_impact NUMERIC(5,2) DEFAULT 0,
  risk_impact NUMERIC(5,2) DEFAULT 0,
  embedding_required BOOLEAN DEFAULT true,
  brain_version_id UUID REFERENCES brain_versions(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_concepts_knowledge_id ON concepts(knowledge_id);
CREATE INDEX idx_concepts_domain ON concepts(domain_id);
CREATE INDEX idx_concepts_status ON concepts(status);
CREATE INDEX idx_concepts_priority ON concepts(priority);
CREATE INDEX idx_concepts_name_trgm ON concepts USING gin(name gin_trgm_ops);

-- ─── Concept Hierarchy (Parent/Child) ────────────────────────────────────────

CREATE TABLE concept_hierarchy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(parent_id, child_id)
);

CREATE INDEX idx_concept_hierarchy_parent ON concept_hierarchy(parent_id);
CREATE INDEX idx_concept_hierarchy_child ON concept_hierarchy(child_id);

-- ─── Rules ───────────────────────────────────────────────────────────────────

CREATE TABLE rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concept_id UUID NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
  knowledge_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  rule_type TEXT NOT NULL
    CHECK (rule_type IN ('recognition', 'validation', 'calculation', 'confidence', 'risk', 'execution', 'governance', 'exception', 'relationship', 'ordering')),
  priority TEXT NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('critical', 'high', 'normal', 'low', 'optional')),
  inputs JSONB DEFAULT '[]',
  outputs JSONB DEFAULT '[]',
  dependencies JSONB DEFAULT '[]',
  exceptions JSONB DEFAULT '[]',
  version TEXT NOT NULL DEFAULT '1.0.0',
  brain_version_id UUID REFERENCES brain_versions(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_rules_concept ON rules(concept_id);
CREATE INDEX idx_rules_type ON rules(rule_type);
CREATE INDEX idx_rules_priority ON rules(priority);

-- ─── Relationships (Knowledge Graph Edges) ───────────────────────────────────

CREATE TABLE relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL
    CHECK (relationship_type IN (
      'depends_on', 'requires', 'uses', 'produces', 'enables', 'disables',
      'confirms', 'invalidates', 'strengthens', 'weakens', 'precedes',
      'follows', 'part_of', 'child_of', 'parent_of', 'alternative_to',
      'related_to', 'similar_to', 'derived_from', 'learnt_from'
    )),
  weight NUMERIC(4,3) NOT NULL DEFAULT 0.5 CHECK (weight >= 0 AND weight <= 1),
  confidence_modifier NUMERIC(5,2) DEFAULT 0,
  priority INTEGER DEFAULT 50,
  direction TEXT NOT NULL DEFAULT 'unidirectional'
    CHECK (direction IN ('unidirectional', 'bidirectional')),
  conditions JSONB,
  version TEXT NOT NULL DEFAULT '1.0.0',
  brain_version_id UUID REFERENCES brain_versions(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_relationships_source ON relationships(source_id);
CREATE INDEX idx_relationships_target ON relationships(target_id);
CREATE INDEX idx_relationships_type ON relationships(relationship_type);

-- ─── Playbooks ───────────────────────────────────────────────────────────────

CREATE TABLE playbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL
    CHECK (category IN (
      'continuation', 'reversal', 'breaker', 'inducement', 'mitigation',
      'range_expansion', 'range_fade', 'momentum', 'news', 'scalping',
      'swing', 'position', 'counter_trend', 'mean_reversion',
      'high_volatility', 'low_volatility', 'emergency', 'portfolio_protection', 'no_trade'
    )),
  description TEXT NOT NULL,
  purpose TEXT,
  version TEXT NOT NULL DEFAULT '1.0.0',
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'internal_review', 'testing', 'paper_trading', 'production', 'deprecated', 'archived')),
  market_conditions JSONB DEFAULT '{}',
  preferred_markets JSONB DEFAULT '[]',
  preferred_sessions JSONB DEFAULT '[]',
  required_timeframes JSONB DEFAULT '[]',
  required_concepts JSONB DEFAULT '[]',
  required_confirmations JSONB DEFAULT '[]',
  required_confidence NUMERIC(5,2) DEFAULT 80,
  entry_rules JSONB DEFAULT '{}',
  management_rules JSONB DEFAULT '{}',
  exit_rules JSONB DEFAULT '{}',
  invalidation_rules JSONB DEFAULT '{}',
  risk_rules JSONB DEFAULT '{}',
  sequence JSONB DEFAULT '[]',
  brain_version_id UUID REFERENCES brain_versions(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_playbooks_category ON playbooks(category);
CREATE INDEX idx_playbooks_status ON playbooks(status);

-- ─── Embeddings ──────────────────────────────────────────────────────────────

CREATE TABLE embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  object_type TEXT NOT NULL,
  object_id UUID NOT NULL,
  embedding_version TEXT NOT NULL DEFAULT '1.0.0',
  model_version TEXT NOT NULL,
  dimension INTEGER NOT NULL,
  embedding vector(1536), -- OpenAI text-embedding-3-small dimension
  brain_version_id UUID REFERENCES brain_versions(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_embeddings_object ON embeddings(object_type, object_id);
CREATE INDEX idx_embeddings_vector ON embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ─── Compiler Logs ───────────────────────────────────────────────────────────

CREATE TABLE compiler_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brain_version_id UUID REFERENCES brain_versions(id),
  log_type TEXT NOT NULL CHECK (log_type IN ('info', 'warning', 'error', 'fatal')),
  code TEXT NOT NULL,
  message TEXT NOT NULL,
  location TEXT,
  concept_id UUID REFERENCES concepts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_compiler_logs_brain ON compiler_logs(brain_version_id);
CREATE INDEX idx_compiler_logs_type ON compiler_logs(log_type);

-- ─── Audit Trail ─────────────────────────────────────────────────────────────

CREATE TABLE audit_trail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  subsystem TEXT NOT NULL,
  brain_version TEXT,
  user_id UUID,
  request JSONB,
  response JSONB,
  result TEXT,
  latency_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_trail_action ON audit_trail(action);
CREATE INDEX idx_audit_trail_subsystem ON audit_trail(subsystem);
CREATE INDEX idx_audit_trail_created ON audit_trail(created_at DESC);

-- ─── Seed Default Domains ────────────────────────────────────────────────────

INSERT INTO knowledge_domains (name, display_name, description, graph_level) VALUES
  ('foundations', 'Foundations', 'Core market fundamentals: price, participants, auctions, order flow', 1),
  ('market_structure', 'Market Structure', 'Structural concepts: trend, swings, BOS, CHOCH, MSS', 2),
  ('liquidity', 'Liquidity', 'Liquidity framework: pools, sweeps, engineering, narratives', 3),
  ('order_flow', 'Order Flow', 'Institutional order flow analysis', 2),
  ('institutional_behaviour', 'Institutional Behaviour', 'Institutional execution patterns', 3),
  ('aois', 'Areas of Interest', 'Order blocks, FVGs, breakers, supply/demand zones', 4),
  ('confirmation', 'Confirmation', 'Trade confirmation signals and sequences', 5),
  ('entry', 'Entry', 'Entry execution and precision', 6),
  ('trade_management', 'Trade Management', 'Active trade management: stops, partials, scaling', 6),
  ('exit', 'Exit', 'Exit strategies and execution', 6),
  ('risk', 'Risk', 'Risk management and position sizing', 5),
  ('portfolio', 'Portfolio', 'Portfolio management and exposure', 5),
  ('macro', 'Macro', 'Macroeconomic context and world knowledge', 1),
  ('sessions', 'Sessions', 'Trading session characteristics', 2),
  ('psychology', 'Psychology', 'Trading psychology and discipline', 1),
  ('execution', 'Execution', 'Trade execution mechanics', 6),
  ('governance', 'Governance', 'System governance and safety', 0),
  ('learning', 'Learning', 'Learning and improvement', 7),
  ('experience', 'Experience', 'Experience storage and retrieval', 7);

-- ─── Seed Initial Brain Version ──────────────────────────────────────────────

INSERT INTO brain_versions (version, brain_id, knowledge_version, compiler_version, graph_version, playbook_version, state)
VALUES ('0.1.0', 'TB-0.1.0', '0.1', '1.0', '0.1', '0.1', 'draft');
