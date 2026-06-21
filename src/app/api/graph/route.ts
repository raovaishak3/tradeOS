import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { GraphTraversal } from "@/lib/graph/traversal";

/**
 * GET /api/graph?from=FND-001&to=CNF-001 — Find paths
 * GET /api/graph?from=LIQ-003&depth=3 — Get reachable nodes
 * GET /api/graph — Get graph metrics + all edges
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const depth = parseInt(searchParams.get("depth") || "3");

  const db = createAdminClient();
  const graph = new GraphTraversal(db);

  try {
    if (from && to) {
      const paths = await graph.findPaths(from, to, depth);
      return NextResponse.json({ paths, count: paths.length });
    }

    if (from) {
      const reachable = await graph.getReachable(from, depth);
      return NextResponse.json({ nodes: reachable, count: reachable.length });
    }

    // Default: return metrics + all edges for visualization
    const metrics = await graph.getMetrics();
    const { data: edges } = await db
      .from("relationships")
      .select("source_id, target_id, relationship_type, weight, confidence_modifier, concepts!relationships_source_id_fkey(knowledge_id, name), target:concepts!relationships_target_id_fkey(knowledge_id, name)")
      .limit(500);

    return NextResponse.json({ metrics, edges: edges || [] });
  } catch (error) {
    return NextResponse.json({ error: "Graph query failed" }, { status: 500 });
  }
}
