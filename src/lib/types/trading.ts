/**
 * Trading Types
 * 
 * Types for the execution pipeline: AOIs, confirmations, entries,
 * trade management, exits, and market analysis.
 */

// ─── Market Data ─────────────────────────────────────────────────────────────

export interface MarketData {
  symbol: string;
  timeframe: Timeframe;
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  spread: number;
}

export type Timeframe =
  | "MN" | "W1" | "D1" | "H4" | "H1" | "M15" | "M5" | "M1";

export type TradingSession =
  | "sydney"
  | "tokyo"
  | "london"
  | "new_york"
  | "london_ny_overlap"
  | "holiday"
  | "weekend"
  | "closed";

// ─── Market State ────────────────────────────────────────────────────────────

export type MarketState =
  | "trending"
  | "ranging"
  | "accumulating"
  | "distributing"
  | "expanding"
  | "retracing"
  | "reversing"
  | "compressing"
  | "transitioning"
  | "unknown";

export type Bias =
  | "strong_bullish"
  | "bullish"
  | "neutral"
  | "bearish"
  | "strong_bearish";

export type StructuralState =
  | "unknown"
  | "accumulation"
  | "expansion"
  | "retracement"
  | "continuation"
  | "distribution"
  | "choch"
  | "mss"
  | "reversal"
  | "new_trend";

// ─── Areas of Interest (AOIs) ────────────────────────────────────────────────

export interface AOI {
  id: string;
  symbol: string;
  brain_version: string;
  playbook_id: string | null;
  aoi_type: AOIType;
  source_timeframe: Timeframe;
  upper_boundary: number;
  lower_boundary: number;
  status: AOIStatus;
  freshness: AOIFreshness;
  confidence: number;
  quality_score: number;
  institutional_score: number;
  liquidity_score: number;
  structure_score: number;
  macro_score: number;
  session_score: number;
  supporting_evidence: string[];
  contradicting_evidence: string[];
  invalidation_rules: string[];
  reasoning_notes: string;
  created_at: string;
  updated_at: string;
  metadata: Record<string, unknown>;
}

export type AOIType =
  | "order_block"
  | "fair_value_gap"
  | "breaker_block"
  | "mitigation_block"
  | "rejection_block"
  | "supply_zone"
  | "demand_zone"
  | "premium_zone"
  | "discount_zone"
  | "equilibrium"
  | "liquidity_void"
  | "session_open"
  | "weekly_open"
  | "monthly_open"
  | "psychological_level"
  | "previous_high"
  | "previous_low"
  | "equal_highs"
  | "equal_lows";

export type AOIStatus =
  | "new"
  | "valid"
  | "watching"
  | "approaching"
  | "touched"
  | "monitoring"
  | "confirmed"
  | "executed"
  | "invalid"
  | "archived";

export type AOIFreshness =
  | "fresh"
  | "partially_mitigated"
  | "mitigated"
  | "consumed"
  | "invalid";

// ─── Confirmation ────────────────────────────────────────────────────────────

export interface ConfirmationSignal {
  id: string;
  signal_type: ConfirmationSignalType;
  timestamp: string;
  market: string;
  timeframe: Timeframe;
  strength: SignalStrength;
  confidence: number;
  source: string;
  dependencies: string[];
  explanation: string;
  status: "active" | "expired" | "invalid";
}

export type ConfirmationSignalType =
  | "liquidity_sweep"
  | "choch"
  | "bos"
  | "displacement"
  | "fvg"
  | "volume_expansion"
  | "order_flow_shift"
  | "delta_shift"
  | "vwap_reclaim"
  | "momentum_expansion"
  | "institutional_candle"
  | "session_confirmation"
  | "macro_confirmation";

export type SignalStrength =
  | "weak"
  | "moderate"
  | "strong"
  | "institutional"
  | "exceptional";

export type ConfirmationState =
  | "no_confirmation"
  | "partial"
  | "building"
  | "valid"
  | "strong"
  | "ready"
  | "failed"
  | "invalid";

// ─── Trade / Entry ───────────────────────────────────────────────────────────

export interface TradePlan {
  id: string;
  symbol: string;
  direction: "buy" | "sell";
  playbook_id: string;
  entry_type: EntryType;
  entry_price: number;
  stop_loss: number;
  take_profit: number[];
  risk_percent: number;
  lot_size: number;
  expected_rr: number;
  confidence: number;
  reasoning: string;
  status: TradePlanStatus;
  brain_version: string;
  created_at: string;
  expires_at: string | null;
  approved_at: string | null;
  metadata: Record<string, unknown>;
}

export type EntryType =
  | "market"
  | "limit"
  | "stop"
  | "stop_limit"
  | "partial"
  | "scaling"
  | "ladder"
  | "adaptive";

export type TradePlanStatus =
  | "planned"
  | "ready"
  | "waiting_for_approval"
  | "approved"
  | "submitted"
  | "active"
  | "cancelled"
  | "expired"
  | "rejected";

// ─── Active Trade ────────────────────────────────────────────────────────────

export interface ActiveTrade {
  id: string;
  trade_plan_id: string;
  symbol: string;
  direction: "buy" | "sell";
  playbook_id: string;
  entry_price: number;
  current_price: number;
  stop_loss: number;
  take_profit: number[];
  lot_size: number;
  floating_pnl: number;
  current_rr: number;
  current_confidence: number;
  trade_health: number;
  management_state: ManagementState;
  max_favorable_excursion: number;
  max_adverse_excursion: number;
  brain_version: string;
  opened_at: string;
  metadata: Record<string, unknown>;
}

export type ManagementState =
  | "active"
  | "building"
  | "profit"
  | "break_even"
  | "running"
  | "scaling"
  | "partial_exit"
  | "exit_ready"
  | "complete"
  | "invalid"
  | "emergency"
  | "manual_review";

// ─── Decision Engine ─────────────────────────────────────────────────────────

export type DecisionType =
  | "buy"
  | "sell"
  | "wait"
  | "no_trade"
  | "cancel"
  | "exit"
  | "partial_exit"
  | "move_stop"
  | "scale_position"
  | "manual_review"
  | "emergency_exit";

export type MarketStatus =
  | "no_trade"
  | "watch"
  | "building"
  | "ready"
  | "approval"
  | "active"
  | "managing"
  | "exit_ready"
  | "complete";

export interface Decision {
  id: string;
  brain_version: string;
  timestamp: string;
  symbol: string;
  direction: "buy" | "sell" | "neutral";
  decision: DecisionType;
  playbook_id: string | null;
  confidence: number;
  decision_confidence: number;
  supporting_evidence: string[];
  contradicting_evidence: string[];
  alternative_decisions: AlternativeDecision[];
  reasoning_tree: Record<string, unknown>;
  status: "generated" | "approved" | "rejected" | "executed" | "expired";
  metadata: Record<string, unknown>;
}

export interface AlternativeDecision {
  decision: DecisionType;
  confidence: number;
  reason: string;
}

// ─── Top Down Analysis ───────────────────────────────────────────────────────

export interface TopDownAnalysis {
  id: string;
  symbol: string;
  brain_version: string;
  timestamp: string;
  bias: Bias;
  market_state: MarketState;
  alignment_score: number;
  institutional_narrative: string;
  liquidity_objective: LiquidityObjective;
  timeframe_analyses: Record<Timeframe, TimeframeAnalysis>;
  playbook_candidates: PlaybookCandidate[];
  confidence: number;
  metadata: Record<string, unknown>;
}

export interface TimeframeAnalysis {
  timeframe: Timeframe;
  bias: Bias;
  structural_state: StructuralState;
  key_levels: number[];
  liquidity_zones: LiquidityZone[];
  aois: string[]; // AOI IDs
  notes: string;
}

export interface LiquidityObjective {
  primary_target: LiquidityZone | null;
  secondary_target: LiquidityZone | null;
  direction: "buy_side" | "sell_side" | "unknown";
}

export interface LiquidityZone {
  type: "buy_side" | "sell_side" | "internal" | "external";
  price: number;
  timeframe: Timeframe;
  strength: number;
  status: "untouched" | "approaching" | "swept" | "consumed";
}

export interface PlaybookCandidate {
  playbook_id: string;
  name: string;
  score: number;
  reason: string;
}

// ─── Notifications ───────────────────────────────────────────────────────────

export type NotificationCategory =
  | "trading"
  | "risk"
  | "portfolio"
  | "macro"
  | "news"
  | "system"
  | "learning"
  | "governance"
  | "execution"
  | "brain_update"
  | "experience"
  | "performance";

export type NotificationPriority =
  | "critical"
  | "high"
  | "medium"
  | "low"
  | "info";

export interface Notification {
  id: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  summary: string;
  description: string;
  subsystem: string;
  market: string | null;
  action_required: boolean;
  status: "created" | "sent" | "delivered" | "acknowledged" | "expired" | "archived";
  created_at: string;
  metadata: Record<string, unknown>;
}
