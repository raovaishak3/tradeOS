import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * GET /api/trades — Get trade plans and active trades
 * ?status=waiting_for_approval | active | all
 */
export async function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get("status") || "all";
  const db = createAdminClient();

  if (status === "active") {
    const { data } = await db
      .from("active_trades")
      .select("*")
      .not("management_state", "in", '("complete","invalid")')
      .order("opened_at", { ascending: false });
    return NextResponse.json({ trades: data || [] });
  }

  if (status === "waiting_for_approval") {
    const { data } = await db
      .from("trade_plans")
      .select("*")
      .eq("status", "waiting_for_approval")
      .order("created_at", { ascending: false });
    return NextResponse.json({ plans: data || [] });
  }

  // All trade plans
  const { data } = await db
    .from("trade_plans")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);
  return NextResponse.json({ plans: data || [] });
}

/**
 * POST /api/trades — Create a new trade plan from analysis
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const db = createAdminClient();

  const { data, error } = await db.from("trade_plans").insert({
    symbol: body.symbol,
    direction: body.direction,
    entry_type: body.entry_type || "limit",
    entry_price: body.entry_price,
    stop_loss: body.stop_loss,
    take_profits: body.take_profits || [],
    risk_percent: body.risk_percent || 1.0,
    lot_size: body.lot_size,
    expected_rr: body.expected_rr,
    confidence: body.confidence,
    reasoning: body.reasoning,
    status: "waiting_for_approval",
    metadata: body.metadata || {},
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ plan: data }, { status: 201 });
}
