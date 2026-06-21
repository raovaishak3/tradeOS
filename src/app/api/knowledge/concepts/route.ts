import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { KnowledgeCore } from "@/lib/knowledge/knowledge-core";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const domain = searchParams.get("domain");
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  const db = createAdminClient();
  const core = new KnowledgeCore(db);

  try {
    let concepts;
    if (search) {
      concepts = await core.searchConcepts(search);
    } else if (domain) {
      concepts = await core.getConceptsByDomain(domain as any);
    } else {
      concepts = await core.getAllConcepts(status || undefined);
    }

    return NextResponse.json({ concepts, count: concepts.length });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch concepts" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const db = createAdminClient();
  const core = new KnowledgeCore(db);

  try {
    const concept = await core.upsertConcept(body);
    if (!concept) {
      return NextResponse.json(
        { error: "Failed to create concept" },
        { status: 400 }
      );
    }
    return NextResponse.json({ concept }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create concept" },
      { status: 500 }
    );
  }
}
