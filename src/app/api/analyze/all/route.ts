import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { ReasoningEngine } from "@/lib/engines/reasoning";
import { MarketDataService } from "@/lib/engines/market-data";
import { SignalGenerator } from "@/lib/engines/signal-generator";

/**
 * POST /api/analyze/all — Analyze all watchlist symbols with live data
 */
export async function POST() {
  const db = createAdminClient();
  const market = new MarketDataService();
  const engine = new ReasoningEngine(db);
  const signals = new SignalGenerator(db);

  // Get all enabled watchlist symbols
  const { data: watchlist } = await db
    .from("watchlist")
    .select("symbol")
    .eq("enabled", true);

  const symbols = (watchlist || []).map(w => w.symbol);
  const results = [];

  // Determine session
  const hour = new Date().getUTCHours();
  let session = "closed";
  if (hour >= 22 || hour < 6) session = "sydney";
  else if (hour >= 0 && hour < 8) session = "tokyo";
  else if (hour >= 7 && hour < 16) session = "london";
  else if (hour >= 12 && hour < 21) session = "new_york";
  if (hour >= 12 && hour < 16) session = "london_ny_overlap";

  for (const symbol of symbols) {
    try {
      const scan = await market.scanSymbol(symbol);
      if (!scan) { results.push({ symbol, status: "no_data" }); continue; }

      const timeframes = market.interpretForReasoning(symbol, scan);
      const analysis = await engine.analyze({ symbol, timeframes, session });

      let signal = null;
      if (analysis.decision === "buy" || analysis.decision === "sell") {
        signal = await signals.generate(
          symbol, analysis.decision, analysis.confidence,
          analysis.primary_playbook || "unknown",
          analysis.narrative, analysis.invalidation, scan
        );
      }

      await db.from("watchlist").update({
        current_bias: analysis.bias,
        current_confidence: analysis.confidence,
        current_playbook: analysis.primary_playbook,
        market_status: signal ? "approval" : analysis.decision === "wait" ? "watch" : "no_trade",
        last_analysis_at: new Date().toISOString(),
      }).eq("symbol", symbol);

      results.push({
        symbol,
        decision: analysis.decision,
        confidence: analysis.confidence,
        playbook: analysis.primary_playbook,
        signal: signal ? "GENERATED" : null,
      });
    } catch (error: any) {
      results.push({ symbol, status: "error", error: error.message });
    }
  }

  const signalCount = results.filter(r => r.signal === "GENERATED").length;
  return NextResponse.json({
    analyzed: results.length,
    signals_generated: signalCount,
    session,
    results,
  });
}
