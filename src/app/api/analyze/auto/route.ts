import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { ReasoningEngine } from "@/lib/engines/reasoning";
import { MarketDataService } from "@/lib/engines/market-data";

/**
 * POST /api/analyze/auto
 * 
 * Auto-analyze a symbol using live market data from EC2.
 * Body: { symbol: "EURUSD" } or { symbols: ["EURUSD", "GBPUSD"] }
 * 
 * Or GET /api/analyze/auto?symbol=EURUSD
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const symbols = body.symbols || (body.symbol ? [body.symbol] : []);

  if (symbols.length === 0) {
    return NextResponse.json({ error: "symbol or symbols required" }, { status: 400 });
  }

  const db = createAdminClient();
  const market = new MarketDataService();
  const engine = new ReasoningEngine(db);
  const results = [];

  for (const symbol of symbols) {
    try {
      // 1. Get live market data
      const scan = await market.scanSymbol(symbol);
      if (!scan) {
        results.push({ symbol, error: "No market data available" });
        continue;
      }

      // 2. Interpret into reasoning format
      const timeframes = market.interpretForReasoning(symbol, scan);

      // 3. Determine session
      const hour = new Date().getUTCHours();
      let session = "closed";
      if (hour >= 22 || hour < 6) session = "sydney";
      else if (hour >= 0 && hour < 8) session = "tokyo";
      else if (hour >= 7 && hour < 16) session = "london";
      else if (hour >= 12 && hour < 21) session = "new_york";
      if (hour >= 12 && hour < 16) session = "london_ny_overlap";

      // 4. Run reasoning
      const analysis = await engine.analyze({
        symbol,
        timeframes,
        session,
      });

      // 5. Update watchlist status
      await db.from("watchlist")
        .update({
          current_bias: analysis.bias,
          current_confidence: analysis.confidence,
          current_playbook: analysis.primary_playbook,
          market_status: analysis.decision === "buy" || analysis.decision === "sell" ? "ready" :
                        analysis.decision === "wait" ? "watch" : "no_trade",
          last_analysis_at: new Date().toISOString(),
        })
        .eq("symbol", symbol);

      results.push({ symbol, analysis });
    } catch (error: any) {
      results.push({ symbol, error: error.message });
    }
  }

  return NextResponse.json({ results });
}

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol");
  if (!symbol) {
    return NextResponse.json({ error: "symbol query param required" }, { status: 400 });
  }

  // Reuse POST logic
  const fakeReq = new Request(request.url, {
    method: "POST",
    body: JSON.stringify({ symbol }),
    headers: { "Content-Type": "application/json" },
  });
  return POST(fakeReq as unknown as NextRequest);
}
