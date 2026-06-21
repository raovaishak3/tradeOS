import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * POST /api/trades/approve — Approve or reject a trade plan
 * Body: { plan_id: string, action: "approve" | "reject" }
 */
export async function POST(request: NextRequest) {
  const { plan_id, action } = await request.json();
  if (!plan_id || !action) {
    return NextResponse.json({ error: "plan_id and action required" }, { status: 400 });
  }

  const db = createAdminClient();

  if (action === "reject") {
    await db.from("trade_plans")
      .update({ status: "rejected" })
      .eq("id", plan_id);
    return NextResponse.json({ success: true, status: "rejected" });
  }

  if (action === "approve") {
    // Get the plan
    const { data: plan } = await db
      .from("trade_plans")
      .select("*")
      .eq("id", plan_id)
      .single();

    if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 });

    // Update plan status
    await db.from("trade_plans")
      .update({ status: "approved", approved_at: new Date().toISOString() })
      .eq("id", plan_id);

    // Create active trade
    const { data: trade, error } = await db.from("active_trades").insert({
      trade_plan_id: plan_id,
      symbol: plan.symbol,
      direction: plan.direction,
      entry_price: plan.entry_price,
      current_price: plan.entry_price,
      stop_loss: plan.stop_loss,
      take_profits: plan.take_profits,
      lot_size: plan.lot_size || 0.01,
      floating_pnl: 0,
      current_rr: 0,
      current_confidence: plan.confidence,
      trade_health: 100,
      management_state: "active",
      metadata: plan.metadata || {},
    }).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Log to timeline
    await db.from("trade_timeline").insert({
      trade_id: trade.id,
      event_type: "trade_opened",
      description: `${plan.direction.toUpperCase()} ${plan.symbol} @ ${plan.entry_price}. SL: ${plan.stop_loss}. Confidence: ${plan.confidence}%`,
      confidence: plan.confidence,
      trade_health: 100,
    });

    return NextResponse.json({ success: true, trade });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
