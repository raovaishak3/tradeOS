import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { ReasoningEngine } from "@/lib/engines/reasoning";

/**
 * POST /api/analyze
 * 
 * Run the Reasoning Engine on market data.
 * 
 * Body: {
 *   symbol: "EURUSD",
 *   session: "london",
 *   macro_context?: "Fed hawkish, USD strength expected",
 *   timeframes: {
 *     "Weekly": { bias, structure, liquidity, key_levels, notes },
 *     "Daily": { ... },
 *     "4H": { ... },
 *     "1H": { ... },
 *     "15M": { ... }
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { symbol, timeframes, session, macro_context } = body;

    if (!symbol || !timeframes) {
      return NextResponse.json(
        { error: "symbol and timeframes required" },
        { status: 400 }
      );
    }

    const db = createAdminClient();
    const engine = new ReasoningEngine(db);

    const result = await engine.analyze({
      symbol,
      timeframes,
      session: session || "unknown",
      macro_context,
    });

    return NextResponse.json({ analysis: result });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Analysis failed" },
      { status: 500 }
    );
  }
}
