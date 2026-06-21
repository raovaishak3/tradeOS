import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * GET /api/analyses/latest — Get the most recent analysis per symbol
 */
export async function GET() {
  const db = createAdminClient();

  // Get latest analysis for each symbol on the watchlist
  const { data: watchlist } = await db
    .from("watchlist")
    .select("symbol")
    .eq("enabled", true);

  if (!watchlist) return NextResponse.json({ analyses: [] });

  const symbols = watchlist.map(w => w.symbol);
  const analyses = [];

  for (const symbol of symbols) {
    const { data } = await db
      .from("top_down_analyses")
      .select("*")
      .eq("symbol", symbol)
      .eq("valid", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (data) analyses.push(data);
  }

  return NextResponse.json({ analyses });
}
