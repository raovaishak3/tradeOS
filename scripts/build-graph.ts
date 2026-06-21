/**
 * Build Knowledge Graph
 * 
 * Creates relationships (edges) between all concepts based on
 * the Trading Bible's dependency structure.
 * 
 * Run: npx tsx scripts/build-graph.ts
 */

import { createClient } from "@supabase/supabase-js";
import ws from "ws";

const db = createClient(
  "https://elvgycwjiwtnxdfvtmed.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  { realtime: { transport: ws } }
);

interface Edge {
  source: string; // knowledge_id
  target: string; // knowledge_id
  type: string;
  weight: number;
  confidence_modifier: number;
}

// ─── Graph Edges ─────────────────────────────────────────────────────────────
// These define HOW concepts relate to each other in the Trading Brain's
// reasoning pathway.

const edges: Edge[] = [
  // === FOUNDATION CHAIN ===
  // Price is the root — everything derives from it
  { source: "FND-001", target: "FND-002", type: "produces", weight: 1.0, confidence_modifier: 0 },
  { source: "FND-001", target: "FND-003", type: "produces", weight: 1.0, confidence_modifier: 0 },
  { source: "FND-002", target: "FND-003", type: "enables", weight: 0.9, confidence_modifier: 0 },
  { source: "FND-003", target: "FND-004", type: "produces", weight: 0.95, confidence_modifier: 0 },
  { source: "FND-004", target: "FND-005", type: "produces", weight: 0.95, confidence_modifier: 0 },
  { source: "FND-005", target: "FND-006", type: "produces", weight: 0.95, confidence_modifier: 20 },
  { source: "FND-006", target: "FND-007", type: "enables", weight: 0.9, confidence_modifier: 0 },
  { source: "FND-005", target: "FND-008", type: "produces", weight: 0.85, confidence_modifier: 0 },
  { source: "FND-006", target: "FND-009", type: "related_to", weight: 0.7, confidence_modifier: 0 },
  { source: "FND-006", target: "FND-010", type: "related_to", weight: 0.8, confidence_modifier: 15 },
  { source: "FND-008", target: "FND-011", type: "produces", weight: 0.9, confidence_modifier: 30 },
  { source: "FND-006", target: "FND-011", type: "enables", weight: 0.9, confidence_modifier: 0 },
  { source: "FND-010", target: "FND-011", type: "enables", weight: 0.8, confidence_modifier: 0 },

  // === FOUNDATIONS → MARKET STRUCTURE ===
  { source: "FND-001", target: "MS-001", type: "produces", weight: 1.0, confidence_modifier: 0 },
  { source: "FND-001", target: "MS-002", type: "produces", weight: 1.0, confidence_modifier: 0 },
  { source: "FND-001", target: "MS-003", type: "produces", weight: 1.0, confidence_modifier: 0 },
  { source: "FND-005", target: "MS-001", type: "enables", weight: 0.9, confidence_modifier: 0 },
  { source: "FND-008", target: "MS-011", type: "produces", weight: 0.85, confidence_modifier: 0 },
  { source: "FND-008", target: "MS-012", type: "produces", weight: 0.85, confidence_modifier: 0 },

  // === MARKET STRUCTURE INTERNAL CHAIN ===
  // Swings → Trend → Structure → BOS/CHOCH/MSS
  { source: "MS-002", target: "MS-001", type: "produces", weight: 0.95, confidence_modifier: 0 },
  { source: "MS-003", target: "MS-001", type: "produces", weight: 0.95, confidence_modifier: 0 },
  { source: "MS-001", target: "MS-005", type: "produces", weight: 0.95, confidence_modifier: 30 },
  { source: "MS-001", target: "MS-004", type: "produces", weight: 0.8, confidence_modifier: 10 },
  { source: "MS-005", target: "MS-006", type: "enables", weight: 0.95, confidence_modifier: 25 },
  { source: "MS-005", target: "MS-007", type: "enables", weight: 0.9, confidence_modifier: 15 },
  { source: "MS-007", target: "MS-008", type: "precedes", weight: 0.9, confidence_modifier: 35 },
  { source: "MS-006", target: "MS-009", type: "produces", weight: 0.9, confidence_modifier: 25 },
  { source: "MS-009", target: "MS-013", type: "precedes", weight: 0.85, confidence_modifier: 0 },
  { source: "MS-013", target: "MS-006", type: "precedes", weight: 0.8, confidence_modifier: 0 },
  { source: "MS-010", target: "MS-009", type: "precedes", weight: 0.85, confidence_modifier: 20 },
  { source: "MS-010", target: "MS-011", type: "enables", weight: 0.8, confidence_modifier: 0 },
  { source: "MS-011", target: "MS-009", type: "precedes", weight: 0.85, confidence_modifier: 25 },
  { source: "MS-009", target: "MS-012", type: "precedes", weight: 0.7, confidence_modifier: 0 },
  { source: "MS-012", target: "MS-007", type: "precedes", weight: 0.8, confidence_modifier: 0 },
  { source: "MS-014", target: "MS-006", type: "produces", weight: 0.9, confidence_modifier: 25 },
  { source: "MS-014", target: "MS-009", type: "produces", weight: 0.95, confidence_modifier: 0 },
  { source: "MS-015", target: "MS-013", type: "related_to", weight: 0.85, confidence_modifier: 0 },

  // Structural frameworks reference everything
  { source: "MS-001", target: "MS-016", type: "enables", weight: 0.9, confidence_modifier: 0 },
  { source: "MS-005", target: "MS-016", type: "enables", weight: 0.9, confidence_modifier: 0 },
  { source: "MS-006", target: "MS-017", type: "enables", weight: 0.85, confidence_modifier: 0 },
  { source: "MS-007", target: "MS-017", type: "enables", weight: 0.85, confidence_modifier: 0 },
  { source: "MS-008", target: "MS-017", type: "enables", weight: 0.9, confidence_modifier: 0 },
  { source: "MS-016", target: "MS-018", type: "part_of", weight: 0.9, confidence_modifier: 0 },
  { source: "MS-018", target: "MS-019", type: "enables", weight: 0.9, confidence_modifier: 0 },
  { source: "MS-019", target: "MS-020", type: "enables", weight: 0.9, confidence_modifier: 0 },

  // === FOUNDATIONS → LIQUIDITY ===
  { source: "FND-006", target: "LIQ-001", type: "produces", weight: 1.0, confidence_modifier: 0 },
  { source: "FND-005", target: "LIQ-001", type: "enables", weight: 0.9, confidence_modifier: 0 },

  // === MARKET STRUCTURE → LIQUIDITY ===
  { source: "MS-002", target: "LIQ-002", type: "produces", weight: 0.9, confidence_modifier: 0 },
  { source: "MS-003", target: "LIQ-002", type: "produces", weight: 0.9, confidence_modifier: 0 },
  { source: "MS-006", target: "LIQ-003", type: "confirms", weight: 0.85, confidence_modifier: 20 },
  { source: "MS-009", target: "LIQ-005", type: "produces", weight: 0.9, confidence_modifier: 0 },

  // === LIQUIDITY INTERNAL CHAIN ===
  { source: "LIQ-001", target: "LIQ-002", type: "produces", weight: 0.95, confidence_modifier: 0 },
  { source: "LIQ-002", target: "LIQ-003", type: "enables", weight: 0.9, confidence_modifier: 25 },
  { source: "LIQ-002", target: "LIQ-004", type: "enables", weight: 0.85, confidence_modifier: 0 },
  { source: "LIQ-004", target: "LIQ-006", type: "produces", weight: 0.85, confidence_modifier: 15 },
  { source: "LIQ-002", target: "LIQ-007", type: "produces", weight: 0.9, confidence_modifier: 0 },
  { source: "LIQ-004", target: "LIQ-008", type: "enables", weight: 0.85, confidence_modifier: 0 },
  { source: "LIQ-008", target: "LIQ-003", type: "precedes", weight: 0.9, confidence_modifier: 0 },
  { source: "LIQ-003", target: "LIQ-009", type: "produces", weight: 0.85, confidence_modifier: 20 },
  { source: "LIQ-007", target: "LIQ-010", type: "part_of", weight: 0.9, confidence_modifier: 0 },
  { source: "LIQ-001", target: "LIQ-009", type: "enables", weight: 0.9, confidence_modifier: 0 },
  { source: "LIQ-009", target: "LIQ-011", type: "enables", weight: 0.9, confidence_modifier: 0 },
  { source: "LIQ-006", target: "LIQ-003", type: "precedes", weight: 0.85, confidence_modifier: 0 },

  // === LIQUIDITY → AOIs ===
  { source: "LIQ-003", target: "AOI-001", type: "enables", weight: 0.95, confidence_modifier: 0 },
  { source: "LIQ-003", target: "AOI-002", type: "enables", weight: 0.9, confidence_modifier: 20 },
  { source: "LIQ-005", target: "AOI-003", type: "produces", weight: 0.9, confidence_modifier: 0 },
  { source: "LIQ-003", target: "AOI-004", type: "enables", weight: 0.85, confidence_modifier: 0 },
  { source: "LIQ-003", target: "AOI-005", type: "enables", weight: 0.85, confidence_modifier: 0 },
  { source: "LIQ-003", target: "AOI-006", type: "produces", weight: 0.8, confidence_modifier: 0 },
  { source: "LIQ-002", target: "AOI-007", type: "produces", weight: 0.85, confidence_modifier: 0 },
  { source: "LIQ-001", target: "AOI-008", type: "enables", weight: 0.8, confidence_modifier: 0 },

  // === MARKET STRUCTURE → AOIs ===
  { source: "MS-006", target: "AOI-002", type: "confirms", weight: 0.9, confidence_modifier: 15 },
  { source: "MS-008", target: "AOI-004", type: "confirms", weight: 0.9, confidence_modifier: 20 },
  { source: "MS-014", target: "AOI-002", type: "produces", weight: 0.9, confidence_modifier: 0 },
  { source: "MS-014", target: "AOI-003", type: "produces", weight: 0.9, confidence_modifier: 0 },
  { source: "MS-009", target: "AOI-003", type: "produces", weight: 0.85, confidence_modifier: 0 },

  // === AOI INTERNAL CHAIN ===
  { source: "AOI-001", target: "AOI-002", type: "parent_of", weight: 0.9, confidence_modifier: 0 },
  { source: "AOI-001", target: "AOI-003", type: "parent_of", weight: 0.9, confidence_modifier: 0 },
  { source: "AOI-001", target: "AOI-004", type: "parent_of", weight: 0.9, confidence_modifier: 0 },
  { source: "AOI-001", target: "AOI-005", type: "parent_of", weight: 0.9, confidence_modifier: 0 },
  { source: "AOI-001", target: "AOI-006", type: "parent_of", weight: 0.9, confidence_modifier: 0 },
  { source: "AOI-001", target: "AOI-007", type: "parent_of", weight: 0.9, confidence_modifier: 0 },
  { source: "AOI-001", target: "AOI-008", type: "parent_of", weight: 0.9, confidence_modifier: 0 },
  { source: "AOI-002", target: "AOI-004", type: "produces", weight: 0.8, confidence_modifier: 0 },
  { source: "AOI-002", target: "AOI-005", type: "produces", weight: 0.85, confidence_modifier: 0 },
  { source: "AOI-003", target: "AOI-005", type: "related_to", weight: 0.8, confidence_modifier: 0 },
  { source: "AOI-009", target: "AOI-010", type: "enables", weight: 0.9, confidence_modifier: 0 },
  { source: "AOI-010", target: "AOI-011", type: "enables", weight: 0.9, confidence_modifier: 0 },

  // === AOIs → PLAYBOOKS ===
  { source: "AOI-002", target: "PB-001", type: "enables", weight: 0.9, confidence_modifier: 20 },
  { source: "AOI-003", target: "PB-001", type: "enables", weight: 0.85, confidence_modifier: 15 },
  { source: "AOI-004", target: "PB-003", type: "enables", weight: 0.9, confidence_modifier: 20 },
  { source: "AOI-005", target: "PB-005", type: "enables", weight: 0.9, confidence_modifier: 20 },
  { source: "LIQ-003", target: "PB-002", type: "requires", weight: 0.95, confidence_modifier: 25 },
  { source: "LIQ-006", target: "PB-004", type: "enables", weight: 0.85, confidence_modifier: 15 },
  { source: "MS-008", target: "PB-002", type: "requires", weight: 0.95, confidence_modifier: 35 },
  { source: "MS-006", target: "PB-001", type: "requires", weight: 0.9, confidence_modifier: 25 },

  // === PLAYBOOKS → CONFIRMATION ===
  { source: "PB-001", target: "CNF-001", type: "requires", weight: 0.95, confidence_modifier: 0 },
  { source: "PB-002", target: "CNF-001", type: "requires", weight: 0.95, confidence_modifier: 0 },
  { source: "PB-003", target: "CNF-001", type: "requires", weight: 0.95, confidence_modifier: 0 },
  { source: "PB-004", target: "CNF-001", type: "requires", weight: 0.95, confidence_modifier: 0 },
  { source: "PB-005", target: "CNF-001", type: "requires", weight: 0.95, confidence_modifier: 0 },
  { source: "CNF-001", target: "CNF-002", type: "parent_of", weight: 1.0, confidence_modifier: 0 },
  { source: "CNF-001", target: "CNF-003", type: "parent_of", weight: 1.0, confidence_modifier: 0 },
  { source: "CNF-001", target: "CNF-004", type: "parent_of", weight: 1.0, confidence_modifier: 0 },
  { source: "CNF-001", target: "CNF-005", type: "parent_of", weight: 1.0, confidence_modifier: 0 },

  // === CROSS-DOMAIN KEY RELATIONSHIPS ===
  // Liquidity → Structure (bidirectional influence)
  { source: "LIQ-003", target: "MS-007", type: "precedes", weight: 0.85, confidence_modifier: 10 },
  { source: "LIQ-003", target: "MS-008", type: "precedes", weight: 0.8, confidence_modifier: 15 },
  // Sessions affect everything
  { source: "FND-010", target: "LIQ-003", type: "strengthens", weight: 0.8, confidence_modifier: 15 },
  { source: "FND-010", target: "AOI-009", type: "strengthens", weight: 0.7, confidence_modifier: 10 },
  // Narrative ties it all together
  { source: "FND-011", target: "LIQ-009", type: "related_to", weight: 0.9, confidence_modifier: 0 },
  { source: "FND-011", target: "AOI-011", type: "enables", weight: 0.85, confidence_modifier: 0 },
  { source: "LIQ-009", target: "PB-001", type: "enables", weight: 0.85, confidence_modifier: 0 },
  { source: "LIQ-009", target: "PB-002", type: "enables", weight: 0.85, confidence_modifier: 0 },
];

// ─── Import Function ─────────────────────────────────────────────────────────

async function buildGraph() {
  console.log(`\nBuilding Knowledge Graph with ${edges.length} edges...\n`);

  // Get concept ID mapping
  const { data: concepts } = await db.from("concepts").select("id, knowledge_id");
  if (!concepts) { console.error("Failed to fetch concepts"); return; }
  const idMap = Object.fromEntries(concepts.map(c => [c.knowledge_id, c.id]));

  let created = 0;
  let errors = 0;

  for (const edge of edges) {
    const sourceId = idMap[edge.source];
    const targetId = idMap[edge.target];

    if (!sourceId) { console.error(`  ✗ Unknown source: ${edge.source}`); errors++; continue; }
    if (!targetId) { console.error(`  ✗ Unknown target: ${edge.target}`); errors++; continue; }

    const { error } = await db.from("relationships").upsert({
      source_id: sourceId,
      target_id: targetId,
      relationship_type: edge.type,
      weight: edge.weight,
      confidence_modifier: edge.confidence_modifier,
      priority: 50,
      direction: "unidirectional",
      version: "1.0.0",
      metadata: {},
    }, { onConflict: "id" }); // Will insert new rows each time

    if (error) {
      console.error(`  ✗ ${edge.source} → ${edge.target}: ${error.message}`);
      errors++;
    } else {
      console.log(`  ✓ ${edge.source} →[${edge.type}]→ ${edge.target} (w:${edge.weight})`);
      created++;
    }
  }

  // Update brain version
  await db.from("brain_versions")
    .update({ total_relationships: created })
    .eq("version", "0.1.0");

  console.log(`\n─────────────────────────────────`);
  console.log(`Created: ${created} relationships`);
  console.log(`Errors:  ${errors}`);
  console.log(`Total:   ${edges.length}`);
  console.log(`─────────────────────────────────\n`);
}

buildGraph().then(() => process.exit(0));
