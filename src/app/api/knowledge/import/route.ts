import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { KnowledgeCore } from "@/lib/knowledge/knowledge-core";
import { parseBibleDocument } from "@/lib/compiler/bible-parser";

/**
 * POST /api/knowledge/import
 * 
 * Accepts markdown content from Trading Bible documents,
 * parses them, and imports into the Knowledge Core.
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { documents } = body as { documents: { filename: string; content: string }[] };

  if (!documents || !Array.isArray(documents) || documents.length === 0) {
    return NextResponse.json(
      { error: "No documents provided. Expected { documents: [{ filename, content }] }" },
      { status: 400 }
    );
  }

  const db = createAdminClient();
  const core = new KnowledgeCore(db);

  const results = {
    imported: 0,
    skipped: 0,
    errors: [] as string[],
    concepts: [] as string[],
  };

  for (const doc of documents) {
    try {
      const parsed = parseBibleDocument(doc.content, doc.filename);

      for (const conceptData of parsed) {
        try {
          const concept = await core.upsertConcept({
            knowledge_id: conceptData.knowledge_id,
            domain: conceptData.domain as any,
            category: conceptData.category,
            name: conceptData.name,
            definition: conceptData.definition,
            purpose: conceptData.purpose,
            version: conceptData.version,
            status: "draft",
            graph_level: conceptData.graph_level,
            priority: conceptData.priority as any,
            confidence_impact: 0,
            risk_impact: 0,
            embedding_required: conceptData.embedding_required,
            metadata: {
              recognition_rules: conceptData.recognition_rules,
              validation_rules: conceptData.validation_rules,
              invalidation_rules: conceptData.invalidation_rules,
              confidence_contributions: conceptData.confidence_contributions,
              source_file: doc.filename,
            },
          });

          if (concept) {
            results.imported++;
            results.concepts.push(concept.knowledge_id);
          } else {
            results.skipped++;
          }
        } catch (err: any) {
          results.errors.push(`${conceptData.knowledge_id}: ${err.message}`);
        }
      }
    } catch (err: any) {
      results.errors.push(`${doc.filename}: ${err.message}`);
    }
  }

  // Update domain concept counts
  try {
    await db.rpc("update_domain_counts");
  } catch {
    // Function may not exist yet — ignore
  }

  return NextResponse.json({
    success: true,
    results,
    message: `Imported ${results.imported} concepts from ${documents.length} documents`,
  });
}
