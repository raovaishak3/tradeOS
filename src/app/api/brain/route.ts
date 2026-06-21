import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * GET /api/brain — Get current brain status
 */
export async function GET() {
  const db = createAdminClient();

  try {
    // Get current production brain (or latest draft)
    const { data: brain } = await db
      .from("brain_versions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    // Get counts
    const [concepts, rules, relationships, playbooks] = await Promise.all([
      db.from("concepts").select("id", { count: "exact" }),
      db.from("rules").select("id", { count: "exact" }),
      db.from("relationships").select("id", { count: "exact" }),
      db.from("playbooks").select("id", { count: "exact" }),
    ]);

    // Get domain coverage
    const { data: domains } = await db
      .from("knowledge_domains")
      .select("name, display_name, coverage, concept_count")
      .order("graph_level");

    return NextResponse.json({
      brain,
      stats: {
        concepts: concepts.count || 0,
        rules: rules.count || 0,
        relationships: relationships.count || 0,
        playbooks: playbooks.count || 0,
      },
      domains: domains || [],
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch brain status" },
      { status: 500 }
    );
  }
}
