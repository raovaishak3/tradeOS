/**
 * Import Trading Bible into the Knowledge Core
 * 
 * This script takes all your methodology documents and imports them
 * as structured concepts into Supabase.
 * 
 * Run: npx tsx scripts/import-bible.ts
 */

import { createClient } from "@supabase/supabase-js";
import ws from "ws";

const db = createClient(
  "https://elvgycwjiwtnxdfvtmed.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  { realtime: { transport: ws } }
);

interface ConceptSeed {
  knowledge_id: string;
  domain: string;
  category: string;
  name: string;
  definition: string;
  graph_level: number;
  priority: string;
  confidence_impact: number;
}

// ─── Foundation Concepts ─────────────────────────────────────────────────────
const foundations: ConceptSeed[] = [
  {
    knowledge_id: "FND-001",
    domain: "foundations",
    category: "Market Fundamentals",
    name: "Price",
    definition: "The continuously changing agreed exchange value between buyers and sellers. Price is the only direct observable truth in the market. Everything else is derived from price.",
    graph_level: 0,
    priority: "critical",
    confidence_impact: 0,
  },
  {
    knowledge_id: "FND-002",
    domain: "foundations",
    category: "Market Fundamentals",
    name: "Market Participants",
    definition: "Any entity capable of placing, modifying, cancelling, or executing orders. Participant hierarchy: Central Banks > Commercial Banks > Institutional Traders > Hedge Funds > Asset Managers > HFT > Corporations > Retail.",
    graph_level: 1,
    priority: "critical",
    confidence_impact: 20,
  },
  {
    knowledge_id: "FND-003",
    domain: "foundations",
    category: "Market Fundamentals",
    name: "Price Discovery",
    definition: "The continuous process through which buyers and sellers determine fair value. Markets oscillate between Balance (consolidation), Imbalance (expansion), and Rebalancing (retracement).",
    graph_level: 1,
    priority: "critical",
    confidence_impact: 15,
  },
  {
    knowledge_id: "FND-004",
    domain: "foundations",
    category: "Market Fundamentals",
    name: "Auction Market Theory",
    definition: "Markets continuously seek a price where buyers and sellers agree to transact. When agreement exists, price balances. When disagreement exists, price searches for new value.",
    graph_level: 1,
    priority: "critical",
    confidence_impact: 15,
  },
  {
    knowledge_id: "FND-005",
    domain: "foundations",
    category: "Market Fundamentals",
    name: "Order Flow",
    definition: "The continuous interaction between aggressive buyers and sellers executing against available liquidity. Every price movement is the visible consequence of hidden order flow.",
    graph_level: 1,
    priority: "critical",
    confidence_impact: 20,
  },
  {
    knowledge_id: "FND-006",
    domain: "foundations",
    category: "Market Fundamentals",
    name: "Liquidity Fundamentals",
    definition: "The availability of executable buy and sell orders at a given price level. Institutions do not chase price — they chase liquidity. Price rarely moves randomly; it moves toward liquidity.",
    graph_level: 1,
    priority: "critical",
    confidence_impact: 20,
  },
  {
    knowledge_id: "FND-007",
    domain: "foundations",
    category: "Market Fundamentals",
    name: "Timeframes",
    definition: "A fixed interval over which market data is aggregated. Higher timeframes provide context, lower timeframes provide execution precision. The market is fractal — every timeframe contains lower timeframes.",
    graph_level: 1,
    priority: "critical",
    confidence_impact: 30,
  },
  {
    knowledge_id: "FND-008",
    domain: "foundations",
    category: "Market Fundamentals",
    name: "Market Cycles",
    definition: "Repeating sequence of phases: Accumulation → Expansion → Distribution → Correction → Repeat. Every timeframe has its own independent cycle. Higher timeframe cycles dominate.",
    graph_level: 1,
    priority: "critical",
    confidence_impact: 25,
  },
  {
    knowledge_id: "FND-009",
    domain: "foundations",
    category: "Market Fundamentals",
    name: "Volatility",
    definition: "The degree of price fluctuation over a given period. Volatility measures movement, not direction. States: Very Low, Low, Normal, High, Extreme. Low volatility often precedes expansion.",
    graph_level: 1,
    priority: "critical",
    confidence_impact: 15,
  },
  {
    knowledge_id: "FND-010",
    domain: "foundations",
    category: "Market Fundamentals",
    name: "Trading Sessions",
    definition: "Periods during which major financial centres participate. Sydney (low), Tokyo (moderate), London (highest institutional participation), New York (high volatility), London-NY Overlap (extreme liquidity).",
    graph_level: 1,
    priority: "critical",
    confidence_impact: 15,
  },
  {
    knowledge_id: "FND-011",
    domain: "foundations",
    category: "Market Fundamentals",
    name: "Market Narrative",
    definition: "The highest-probability explanation of why price is moving, what institutions are attempting, and what is most likely next. A narrative is not a prediction — it is a probabilistic model built from evidence.",
    graph_level: 1,
    priority: "critical",
    confidence_impact: 30,
  },
  {
    knowledge_id: "FND-012",
    domain: "foundations",
    category: "Reference Definitions",
    name: "Core Definitions",
    definition: "Standardized terminology used throughout the Trading Brain. One concept = one definition. Immutable unless versioned. Eliminates ambiguity across all engines.",
    graph_level: 1,
    priority: "critical",
    confidence_impact: 0,
  },
];

// ─── Market Structure Concepts ───────────────────────────────────────────────
const marketStructure: ConceptSeed[] = [
  { knowledge_id: "MS-001", domain: "market_structure", category: "Structural Concepts", name: "Trend", definition: "Sustained directional movement characterized by a sequence of structurally valid swing highs and lows. Trend is determined solely by market structure, never by indicators. Types: Bullish (HH/HL), Bearish (LH/LL), Range, Transition.", graph_level: 2, priority: "critical", confidence_impact: 30 },
  { knowledge_id: "MS-002", domain: "market_structure", category: "Structural Concepts", name: "Swing High", definition: "A structurally significant price high where buying pressure is exhausted. Creates Buy-Side Liquidity. Classified as Major, Intermediate, or Minor. Remains valid until structurally invalidated.", graph_level: 2, priority: "critical", confidence_impact: 20 },
  { knowledge_id: "MS-003", domain: "market_structure", category: "Structural Concepts", name: "Swing Low", definition: "A structurally significant price low where selling pressure is exhausted. Creates Sell-Side Liquidity. Classified as Major, Intermediate, or Minor. Remains valid until structurally invalidated.", graph_level: 2, priority: "critical", confidence_impact: 20 },
  { knowledge_id: "MS-004", domain: "market_structure", category: "Structural Concepts", name: "Internal Structure", definition: "The sequence of minor swing highs and lows inside current External Structure. Used for execution precision only. Cannot independently determine market bias. Changes more frequently than external.", graph_level: 2, priority: "critical", confidence_impact: 10 },
  { knowledge_id: "MS-005", domain: "market_structure", category: "Structural Concepts", name: "External Structure", definition: "The major sequence of structurally significant swings defining dominant market trend. Defines market bias. All trading decisions begin here. Changes only after significant structural events.", graph_level: 2, priority: "critical", confidence_impact: 30 },
  { knowledge_id: "MS-006", domain: "market_structure", category: "Structural Events", name: "Break of Structure", definition: "Occurs when price decisively breaks and closes beyond a previously confirmed structural swing IN THE DIRECTION of the prevailing trend. BOS confirms continuation. Requires displacement and candle close.", graph_level: 2, priority: "critical", confidence_impact: 25 },
  { knowledge_id: "MS-007", domain: "market_structure", category: "Structural Events", name: "Change of Character", definition: "Occurs when price breaks the most recent protected swing AGAINST the current trend. CHOCH is an early warning — NOT a reversal confirmation. Increases reversal probability but requires MSS to confirm.", graph_level: 2, priority: "critical", confidence_impact: 15 },
  { knowledge_id: "MS-008", domain: "market_structure", category: "Structural Events", name: "Market Structure Shift", definition: "Confirmed change in institutional market control. Must follow valid CHOCH + BOS against previous trend. MSS is the highest-confidence reversal event. Invalidates previous trend and creates new narrative.", graph_level: 2, priority: "critical", confidence_impact: 35 },
  { knowledge_id: "MS-009", domain: "market_structure", category: "Structural Behavior", name: "Expansion", definition: "Rapid directional movement caused by significant imbalance. Represents institutional commitment. Creates FVGs, produces BOS, consumes liquidity. Strong expansion increases continuation probability.", graph_level: 2, priority: "critical", confidence_impact: 25 },
  { knowledge_id: "MS-010", domain: "market_structure", category: "Structural Behavior", name: "Compression", definition: "Price contracts into progressively smaller range. Represents institutional accumulation/preparation. Precedes expansion. Longer compression generally produces stronger expansion.", graph_level: 2, priority: "critical", confidence_impact: 20 },
];

const marketStructure2: ConceptSeed[] = [
  { knowledge_id: "MS-011", domain: "market_structure", category: "Structural Phase", name: "Accumulation", definition: "Market phase where institutions gradually build positions in a stable range. Precedes expansion. Creates liquidity on both sides. Ends with displacement. Confirmation required before trading.", graph_level: 2, priority: "critical", confidence_impact: 25 },
  { knowledge_id: "MS-012", domain: "market_structure", category: "Structural Phase", name: "Distribution", definition: "Market phase where institutions gradually reduce/exit positions. Creates liquidity above. Often mistaken for bullish continuation by retail. Frequently ends with bearish displacement.", graph_level: 2, priority: "critical", confidence_impact: 25 },
  { knowledge_id: "MS-013", domain: "market_structure", category: "Structural Behavior", name: "Retracement", definition: "Temporary counter-trend movement within a valid trend without invalidating External Structure. Rebalances liquidity and mitigates inefficiencies. Not a reversal until CHOCH+MSS confirms.", graph_level: 2, priority: "critical", confidence_impact: 20 },
  { knowledge_id: "MS-014", domain: "market_structure", category: "Structural Behavior", name: "Impulse", definition: "Decisive directional movement with strong displacement, momentum, liquidity consumption and structural progression. Evidence of institutional commitment. Creates FVGs and Order Blocks.", graph_level: 2, priority: "critical", confidence_impact: 30 },
  { knowledge_id: "MS-015", domain: "market_structure", category: "Structural Behavior", name: "Correction", definition: "Temporary market phase where price moves against impulse to rebalance liquidity, mitigate inefficiencies and revisit AOIs. May evolve into reversal if structure fails.", graph_level: 2, priority: "critical", confidence_impact: 20 },
  { knowledge_id: "MS-016", domain: "market_structure", category: "Structural Analysis", name: "Structural Confluence", definition: "Alignment of multiple independent structural concepts that collectively increase probability. Components: Structure + Liquidity + Order Flow + AOIs + Time + Context. Minimum checks required before any trade.", graph_level: 2, priority: "critical", confidence_impact: 40 },
  { knowledge_id: "MS-017", domain: "market_structure", category: "Structural Validation", name: "Structural Invalidation", definition: "When price provides sufficient evidence that current structural interpretation is no longer valid. Forces narrative reset and re-evaluation. Every trend, playbook, and AOI must have an invalidation point.", graph_level: 2, priority: "critical", confidence_impact: -30 },
  { knowledge_id: "MS-018", domain: "market_structure", category: "Structural Framework", name: "Structural Hierarchy", definition: "Ordered framework determining relative importance of every structural concept. Levels: Macro > HTF Trend > External Structure > Narrative > Liquidity > Cycle > Session > AOIs > Internal > Confirmation > Entry.", graph_level: 2, priority: "critical", confidence_impact: 40 },
  { knowledge_id: "MS-019", domain: "market_structure", category: "Structural Logic", name: "Structural State Machine", definition: "Deterministic model of valid structural states and transitions. States: Unknown → Accumulation → Expansion → Retracement → Continuation → Distribution → CHOCH → MSS → Reversal → New Trend.", graph_level: 2, priority: "critical", confidence_impact: 25 },
  { knowledge_id: "MS-020", domain: "market_structure", category: "Decision Framework", name: "Structural Decision Tree", definition: "Deterministic sequence of questions reducing uncertainty. Every node returns PASS/WAIT/FAIL/UNKNOWN. Nodes: Market Open → HTF Trend → External Structure → Liquidity → Narrative → AOI → Confirmation → Risk → Playbook.", graph_level: 2, priority: "critical", confidence_impact: 40 },
  { knowledge_id: "MS-021", domain: "market_structure", category: "AI Reference", name: "Structural AI Reference", definition: "Master AI reference for all Market Structure concepts. Defines confidence model, event catalog, pattern library, compiler rules, and decision priorities for the Reasoning Engine.", graph_level: 2, priority: "critical", confidence_impact: 0 },
];

// ─── Liquidity Concepts ──────────────────────────────────────────────────────
const liquidity: ConceptSeed[] = [
  { knowledge_id: "LIQ-001", domain: "liquidity", category: "Liquidity Framework", name: "Liquidity Foundations", definition: "Liquidity is the collection of executable orders resting in the market. Institutions chase liquidity, not price. Price seeks liquidity. Higher timeframe liquidity dominates.", graph_level: 3, priority: "critical", confidence_impact: 25 },
  { knowledge_id: "LIQ-002", domain: "liquidity", category: "Liquidity Types", name: "Buy Side & Sell Side Liquidity", definition: "BSL: orders above price (swing highs, equal highs, previous highs). SSL: orders below price (swing lows, equal lows, previous lows). Institutions sweep liquidity to execute.", graph_level: 3, priority: "critical", confidence_impact: 20 },
  { knowledge_id: "LIQ-003", domain: "liquidity", category: "Liquidity Events", name: "Liquidity Sweeps", definition: "Intentional movement through a known liquidity pool to trigger resting orders before the real move. Requires: known liquidity + price reaches it + orders triggered + institutional reaction + displacement.", graph_level: 3, priority: "critical", confidence_impact: 25 },
  { knowledge_id: "LIQ-004", domain: "liquidity", category: "Liquidity Events", name: "Engineered Liquidity", definition: "Liquidity institutions intentionally create to attract participants. Equal highs/lows, obvious trendlines, triangles, range patterns. Retail enters → liquidity builds → institution sweeps → executes.", graph_level: 3, priority: "critical", confidence_impact: 20 },
  { knowledge_id: "LIQ-005", domain: "liquidity", category: "Liquidity Events", name: "Liquidity Voids & Imbalances", definition: "Regions where very little two-way trading occurred due to aggressive execution. Characterized by rapid movement, minimal activity, significant imbalance. Markets often revisit to rebalance.", graph_level: 3, priority: "critical", confidence_impact: 20 },
  { knowledge_id: "LIQ-006", domain: "liquidity", category: "Liquidity Events", name: "Inducement", definition: "Intentional creation of conditions encouraging premature entries, generating liquidity for institutional execution. Exists before the primary move. Often appears technically correct to retail.", graph_level: 3, priority: "critical", confidence_impact: 15 },
  { knowledge_id: "LIQ-007", domain: "liquidity", category: "Liquidity Types", name: "Liquidity Pools", definition: "Concentrated clusters of executable orders. Price moves from one pool to another. Types: External (major swings), Internal (minor swings), Session (Asia/London/NY highs/lows), Psychological (round numbers).", graph_level: 3, priority: "critical", confidence_impact: 20 },
  { knowledge_id: "LIQ-008", domain: "liquidity", category: "Liquidity Events", name: "Liquidity Engineering", definition: "Deliberate manipulation of price to create, relocate, concentrate, consume or redistribute liquidity. Phases: Observation → Preparation → Engineering → Execution → Redistribution.", graph_level: 3, priority: "critical", confidence_impact: 20 },
  { knowledge_id: "LIQ-009", domain: "liquidity", category: "Liquidity Framework", name: "Liquidity Narratives", definition: "The institutional story explaining where price is most likely to move based on liquidity objectives. Every market has a narrative. Narratives change only after liquidity consumed + structural confirmation.", graph_level: 3, priority: "critical", confidence_impact: 20 },
  { knowledge_id: "LIQ-010", domain: "liquidity", category: "Liquidity Framework", name: "Multi-Timeframe Liquidity", definition: "Hierarchical relationship between pools across timeframes. Monthly > Weekly > Daily > 4H > 1H > 15M. Higher TF always dominates. Lower TF refines execution. Conflicts reduce confidence.", graph_level: 3, priority: "critical", confidence_impact: 30 },
  { knowledge_id: "LIQ-011", domain: "liquidity", category: "Decision Engine", name: "Liquidity Decision Engine", definition: "Deterministic reasoning framework converting liquidity observations into decisions. 15 stages: Market Init → Mapping → Ranking → Objective → Narrative → Engineering → Sweep → Structure → AOI → Confirmation → Confidence → Risk → Playbook → Execute → Monitor.", graph_level: 3, priority: "critical", confidence_impact: 0 },
  { knowledge_id: "LIQ-012", domain: "liquidity", category: "AI Reference", name: "Liquidity AI Reference", definition: "Master AI reference for all Liquidity concepts. Defines confidence model, event catalog (Creation/Build/Engineering/Consumption/Resolution), pattern library, state machine, and decision priorities.", graph_level: 3, priority: "critical", confidence_impact: 0 },
];

// ─── AOI Concepts ────────────────────────────────────────────────────────────
const aois: ConceptSeed[] = [
  { knowledge_id: "AOI-001", domain: "aois", category: "Institutional Execution Framework", name: "AOI Foundations", definition: "Areas of Interest are price zones where institutional participation probability is significantly higher. AOIs are execution zones, not signals. Require confirmation. HTF AOIs dominate. Must align with liquidity.", graph_level: 4, priority: "critical", confidence_impact: 0 },
  { knowledge_id: "AOI-002", domain: "aois", category: "AOI Concept", name: "Order Blocks", definition: "The final opposing candle/consolidation before strong institutional displacement resulting in BOS/MSS. Represents where institutions accumulated/distributed. Fresh OBs have highest probability. Invalid if broken without mitigation.", graph_level: 4, priority: "critical", confidence_impact: 25 },
  { knowledge_id: "AOI-003", domain: "aois", category: "AOI Concept", name: "Fair Value Gaps", definition: "Imbalance in price delivery created by aggressive execution leaving little two-sided trading. Three-candle structure with minimal overlap. Markets seek efficiency by revisiting these zones. Fresh FVGs prioritized.", graph_level: 4, priority: "critical", confidence_impact: 20 },
  { knowledge_id: "AOI-004", domain: "aois", category: "AOI Concept", name: "Breaker Blocks", definition: "Previously valid Order Block that failed and changes role. Confirms institutional repositioning. Requires: OB failure + CHOCH + MSS + displacement. Fresh Breakers have highest probability.", graph_level: 4, priority: "critical", confidence_impact: 25 },
  { knowledge_id: "AOI-005", domain: "aois", category: "AOI Concept", name: "Mitigation Blocks", definition: "Institutional re-entry zones where price returns to rebalance unfilled orders before continuing. Represents completion of partial execution. Fresh mitigation zones favor continuation.", graph_level: 4, priority: "critical", confidence_impact: 20 },
  { knowledge_id: "AOI-006", domain: "aois", category: "AOI Concept", name: "Rejection Blocks", definition: "Zones of strong institutional rejection after interaction. Sharp displacement away. Represents immediate imbalance. Requires structural impact (BOS/CHOCH) — weak rejections are noise.", graph_level: 4, priority: "critical", confidence_impact: 15 },
  { knowledge_id: "AOI-007", domain: "aois", category: "AOI Concept", name: "Supply & Demand Zones", definition: "Institutional areas of significant buyer/seller imbalance. Supply = strong selling interest. Demand = strong buying interest. Broader than Order Blocks. Often contain OBs and FVGs inside them.", graph_level: 4, priority: "critical", confidence_impact: 20 },
  { knowledge_id: "AOI-008", domain: "aois", category: "AOI Concept", name: "Premium & Discount Zones", definition: "Premium = upper 50% of range (selling preference). Discount = lower 50% (buying preference). Equilibrium = middle (requires confirmation). Institutions accumulate in discount, distribute in premium.", graph_level: 4, priority: "critical", confidence_impact: 15 },
  { knowledge_id: "AOI-009", domain: "aois", category: "AOI Framework", name: "AOI Confluence System", definition: "Process of combining AOIs with liquidity, structure, and narrative. 5 layers: Liquidity(30) + Structure(25) + Narrative(20) + Premium/Discount(15) + Timing(10) = 100. No AOI valid without confluence.", graph_level: 4, priority: "critical", confidence_impact: 40 },
  { knowledge_id: "AOI-010", domain: "aois", category: "AOI Framework", name: "Multi-Timeframe AOIs", definition: "AOIs across multiple timeframes influencing each other hierarchically. HTF AOIs dominate. Minimum 2 TF agreement required. Conflicting AOIs invalidate execution. Monthly defines bias, 15M defines entry.", graph_level: 4, priority: "critical", confidence_impact: 30 },
  { knowledge_id: "AOI-011", domain: "aois", category: "AOI Decision Engine", name: "AOI Decision Engine", definition: "Final execution logic converting AOI analysis into decisions. 10-step pipeline: Collect → Filter Liquidity → Filter Structure → Filter Narrative → Premium/Discount → Timeframe → Score → Rank → Confirm → Execute/Wait/Reject.", graph_level: 4, priority: "critical", confidence_impact: 0 },
  { knowledge_id: "AOI-012", domain: "aois", category: "AI Reference", name: "AOI AI Reference", definition: "Master system specification for AOI reasoning. Hierarchical intelligence: Liquidity(L1) > Structure(L2) > Narrative(L3) > AOIs(L4) > Entry(L5). AOIs are NOT decision-makers, they are execution references.", graph_level: 4, priority: "critical", confidence_impact: 0 },
];

// ─── Playbook Concepts ───────────────────────────────────────────────────────
const playbooks: ConceptSeed[] = [
  { knowledge_id: "PB-001", domain: "confirmation", category: "Playbook", name: "Continuation Playbook", definition: "Trend already established + BOS confirmed + Pullback into AOI. Sequence: Liquidity Sweep → BOS → Retracement → AOI (OB/FVG) → Continuation Entry. Invalid if MSS against trend exists.", graph_level: 5, priority: "critical", confidence_impact: 20 },
  { knowledge_id: "PB-002", domain: "confirmation", category: "Playbook", name: "Reversal Playbook", definition: "Liquidity swept + CHOCH formed + MSS confirms shift. Sequence: Liquidity Sweep → CHOCH → MSS → Retest AOI → Entry. MSS is mandatory. Never enter on CHOCH alone.", graph_level: 5, priority: "critical", confidence_impact: 20 },
  { knowledge_id: "PB-003", domain: "confirmation", category: "Playbook", name: "Breaker Playbook", definition: "Order Block fails + Structure flips. Sequence: OB fails → CHOCH → MSS → Retest Broken OB (now Breaker) → Entry. Must confirm MSS before entry.", graph_level: 5, priority: "critical", confidence_impact: 20 },
  { knowledge_id: "PB-004", domain: "confirmation", category: "Playbook", name: "Inducement Playbook", definition: "Market in range + Liquidity being engineered + Fake breakout expected. Sequence: Range → Inducement Move → Liquidity Sweep → CHOCH → MSS → Entry. Do NOT trade range break early.", graph_level: 5, priority: "critical", confidence_impact: 20 },
  { knowledge_id: "PB-005", domain: "confirmation", category: "Playbook", name: "Mitigation Playbook", definition: "Impulsive move already happened + Market returns to imbalance. Sequence: Impulse Move → FVG/OB left behind → Retracement → Mitigation → Continuation. Only first/second mitigation valid.", graph_level: 5, priority: "critical", confidence_impact: 20 },
];

// ─── Confirmation Concepts ───────────────────────────────────────────────────
const confirmation: ConceptSeed[] = [
  { knowledge_id: "CNF-001", domain: "confirmation", category: "Confirmation Stack", name: "Confirmation Engine", definition: "Validates WHEN a playbook becomes tradable. ALL must be true: Liquidity Confirmed + Structure Valid (BOS/MSS) + AOI Active + Displacement Confirmed + Retest Occurred + Narrative Aligned + Risk ≤ Threshold.", graph_level: 5, priority: "critical", confidence_impact: 0 },
  { knowledge_id: "CNF-002", domain: "confirmation", category: "Confirmation Stack", name: "Liquidity Confirmation", definition: "Has liquidity been swept or is it being targeted? If NO → NO TRADE. This is the first and most critical confirmation check.", graph_level: 5, priority: "critical", confidence_impact: 20 },
  { knowledge_id: "CNF-003", domain: "confirmation", category: "Confirmation Stack", name: "Structure Confirmation", definition: "BOS = continuation only. CHOCH = transition only. MSS = reversal confirmation. MSS REQUIRED for all reversal trades.", graph_level: 5, priority: "critical", confidence_impact: 20 },
  { knowledge_id: "CNF-004", domain: "confirmation", category: "Confirmation Stack", name: "Displacement Confirmation", definition: "Strong impulsive move required. No weak chop entries. Displacement confirms institutional participation and commitment to the move.", graph_level: 5, priority: "critical", confidence_impact: 15 },
  { knowledge_id: "CNF-005", domain: "confirmation", category: "Confirmation Stack", name: "Retest Confirmation", definition: "Entry only on first or second retest. Never chase expansion. Retest proves institutional interest in the zone.", graph_level: 5, priority: "critical", confidence_impact: 15 },
];

// ─── Import Function ─────────────────────────────────────────────────────────

const allConcepts = [
  ...foundations,
  ...marketStructure,
  ...marketStructure2,
  ...liquidity,
  ...aois,
  ...playbooks,
  ...confirmation,
];

async function importConcepts() {
  console.log(`\nImporting ${allConcepts.length} concepts...\n`);

  // Get domain ID mapping
  const { data: domains } = await db.from("knowledge_domains").select("id, name");
  if (!domains) { console.error("Failed to fetch domains"); return; }
  const domainMap = Object.fromEntries(domains.map(d => [d.name, d.id]));

  let imported = 0;
  let errors = 0;

  for (const concept of allConcepts) {
    const domainId = domainMap[concept.domain];
    if (!domainId) {
      console.error(`  ✗ Unknown domain: ${concept.domain} for ${concept.knowledge_id}`);
      errors++;
      continue;
    }

    const { error } = await db.from("concepts").upsert({
      knowledge_id: concept.knowledge_id,
      domain_id: domainId,
      category: concept.category,
      name: concept.name,
      definition: concept.definition,
      purpose: "",
      version: "1.0.0",
      status: "compiled",
      graph_level: concept.graph_level,
      priority: concept.priority,
      confidence_impact: concept.confidence_impact,
      risk_impact: 0,
      embedding_required: true,
      metadata: {},
      updated_at: new Date().toISOString(),
    }, { onConflict: "knowledge_id" });

    if (error) {
      console.error(`  ✗ ${concept.knowledge_id}: ${error.message}`);
      errors++;
    } else {
      console.log(`  ✓ ${concept.knowledge_id} — ${concept.name}`);
      imported++;
    }
  }

  // Update brain version stats
  await db.from("brain_versions")
    .update({ total_concepts: imported })
    .eq("version", "0.1.0");

  console.log(`\n─────────────────────────────────`);
  console.log(`Imported: ${imported}`);
  console.log(`Errors:   ${errors}`);
  console.log(`Total:    ${allConcepts.length}`);
  console.log(`─────────────────────────────────\n`);
}

importConcepts().then(() => process.exit(0));
