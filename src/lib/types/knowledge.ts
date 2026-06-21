/**
 * Knowledge Core Types
 * 
 * These types define the fundamental data structures for the Trading Brain's
 * knowledge system — concepts, rules, relationships, playbooks, and the
 * compiled Brain itself.
 */

// ─── Brain Versioning ────────────────────────────────────────────────────────

export interface BrainVersion {
  id: string;
  version: string; // semver: "1.3.0"
  brain_id: string; // e.g., "TB-1.3.0"
  knowledge_version: string;
  compiler_version: string;
  graph_version: string;
  playbook_version: string;
  state: BrainState;
  fingerprint: string; // SHA256
  created_at: string;
  released_at: string | null;
  archived_at: string | null;
  metadata: Record<string, unknown>;
}

export type BrainState =
  | "draft"
  | "testing"
  | "release_candidate"
  | "production"
  | "deprecated"
  | "archived";

// ─── Knowledge Domains ───────────────────────────────────────────────────────

export type KnowledgeDomain =
  | "foundations"
  | "market_structure"
  | "liquidity"
  | "order_flow"
  | "institutional_behaviour"
  | "aois"
  | "confirmation"
  | "entry"
  | "trade_management"
  | "exit"
  | "risk"
  | "portfolio"
  | "macro"
  | "sessions"
  | "psychology"
  | "execution"
  | "governance"
  | "learning"
  | "experience";

// ─── Concepts ────────────────────────────────────────────────────────────────

export interface Concept {
  id: string;
  knowledge_id: string; // e.g., "FND-001", "MS-006"
  domain: KnowledgeDomain;
  category: string;
  name: string;
  definition: string;
  purpose: string;
  version: string;
  status: ConceptStatus;
  graph_level: number;
  priority: ConceptPriority;
  parent_ids: string[];
  child_ids: string[];
  brain_version: string;
  confidence_impact: number;
  risk_impact: number;
  embedding_required: boolean;
  created_at: string;
  updated_at: string;
  metadata: Record<string, unknown>;
}

export type ConceptStatus =
  | "draft"
  | "validated"
  | "approved"
  | "compiled"
  | "released"
  | "deprecated"
  | "archived";

export type ConceptPriority = "critical" | "high" | "normal" | "low" | "optional";

// ─── Rules ───────────────────────────────────────────────────────────────────

export interface Rule {
  id: string;
  concept_id: string;
  knowledge_id: string;
  name: string;
  description: string;
  rule_type: RuleType;
  priority: RulePriority;
  inputs: string[];
  outputs: string[];
  dependencies: string[]; // rule IDs
  exceptions: string[];
  version: string;
  brain_version: string;
  created_at: string;
  metadata: Record<string, unknown>;
}

export type RuleType =
  | "recognition"
  | "validation"
  | "calculation"
  | "confidence"
  | "risk"
  | "execution"
  | "governance"
  | "exception"
  | "relationship"
  | "ordering";

export type RulePriority = "critical" | "high" | "normal" | "low" | "optional";

// ─── Relationships (Knowledge Graph Edges) ───────────────────────────────────

export interface Relationship {
  id: string;
  source_id: string; // concept ID
  target_id: string; // concept ID
  relationship_type: RelationshipType;
  weight: number; // 0-1
  confidence_modifier: number;
  priority: number;
  direction: "unidirectional" | "bidirectional";
  conditions: string | null; // JSON conditions for contextual relationships
  version: string;
  brain_version: string;
  created_at: string;
  metadata: Record<string, unknown>;
}

export type RelationshipType =
  | "depends_on"
  | "requires"
  | "uses"
  | "produces"
  | "enables"
  | "disables"
  | "confirms"
  | "invalidates"
  | "strengthens"
  | "weakens"
  | "precedes"
  | "follows"
  | "part_of"
  | "child_of"
  | "parent_of"
  | "alternative_to"
  | "related_to"
  | "similar_to"
  | "derived_from"
  | "learnt_from";

// ─── Playbooks ───────────────────────────────────────────────────────────────

export interface Playbook {
  id: string;
  knowledge_id: string;
  name: string;
  category: PlaybookCategory;
  description: string;
  purpose: string;
  version: string;
  status: PlaybookStatus;
  market_conditions: Record<string, unknown>;
  preferred_markets: string[];
  preferred_sessions: string[];
  required_timeframes: string[];
  required_concepts: string[]; // concept IDs
  required_confirmations: string[];
  required_confidence: number;
  entry_rules: Record<string, unknown>;
  management_rules: Record<string, unknown>;
  exit_rules: Record<string, unknown>;
  invalidation_rules: Record<string, unknown>;
  risk_rules: Record<string, unknown>;
  brain_version: string;
  created_at: string;
  updated_at: string;
  metadata: Record<string, unknown>;
}

export type PlaybookCategory =
  | "continuation"
  | "reversal"
  | "breaker"
  | "inducement"
  | "mitigation"
  | "range_expansion"
  | "range_fade"
  | "momentum"
  | "news"
  | "scalping"
  | "swing"
  | "position"
  | "counter_trend"
  | "mean_reversion"
  | "high_volatility"
  | "low_volatility"
  | "emergency"
  | "portfolio_protection"
  | "no_trade";

export type PlaybookStatus =
  | "draft"
  | "internal_review"
  | "testing"
  | "paper_trading"
  | "production"
  | "deprecated"
  | "archived";

// ─── Knowledge Graph ─────────────────────────────────────────────────────────

export interface GraphMetrics {
  total_nodes: number;
  total_edges: number;
  average_degree: number;
  max_depth: number;
  connected_components: number;
  graph_density: number;
  disconnected_nodes: number;
  cycles: number;
  coverage: number;
}

export interface GraphNode {
  id: string;
  concept_id: string;
  node_type: string;
  label: string;
  graph_level: number;
  metadata: Record<string, unknown>;
}

// ─── Compiler ────────────────────────────────────────────────────────────────

export interface CompileResult {
  success: boolean;
  brain_version: BrainVersion | null;
  errors: CompilerError[];
  warnings: CompilerWarning[];
  coverage: Record<string, number>;
  integrity_score: number;
  duration_ms: number;
  release_notes: string | null;
}

export interface CompilerError {
  code: string;
  message: string;
  location: string;
  concept_id: string | null;
  severity: "error" | "fatal";
}

export interface CompilerWarning {
  code: string;
  message: string;
  location: string;
  concept_id: string | null;
}

// ─── Confidence ──────────────────────────────────────────────────────────────

export interface ConfidenceScore {
  overall: number;
  trend: number;
  structure: number;
  liquidity: number;
  aoi: number;
  confirmation: number;
  macro: number;
  session: number;
  experience: number;
  risk: number;
  execution: number;
  portfolio: number;
  governance: number;
  penalties: number;
  bonuses: number;
  level: ConfidenceLevel;
}

export type ConfidenceLevel =
  | "exceptional"    // 95-100
  | "very_high"     // 90-94
  | "high"          // 80-89
  | "moderate"      // 70-79
  | "weak"          // 60-69
  | "reject";       // <60
