/**
 * Signal Generator
 * 
 * When the Reasoning Engine produces a high-confidence decision (buy/sell),
 * this engine generates precise entry, stop loss, and take profit levels,
 * creates a trade plan, and fires a notification.
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { MarketScan } from "./market-data";

export interface TradeSignal {
  symbol: string;
  direction: "buy" | "sell";
  entry_price: number;
  stop_loss: number;
  take_profit_1: number;
  take_profit_2: number;
  take_profit_3: number;
  risk_reward: number;
  confidence: number;
  playbook: string;
  reasoning: string;
  invalidation: string;
}

export class SignalGenerator {
  constructor(private db: SupabaseClient) {}

  /**
   * Generate a trade signal from analysis + market data.
   * Only generates if confidence >= min_confidence threshold.
   */
  async generate(
    symbol: string,
    decision: string,
    confidence: number,
    playbook: string,
    narrative: string,
    invalidation: string,
    scan: MarketScan
  ): Promise<TradeSignal | null> {
    // Get min confidence from settings
    const { data: settings } = await this.db
      .from("user_settings")
      .select("value")
      .eq("key", "min_confidence")
      .single();
    const minConf = parseInt(settings?.value || "80");

    if (confidence < minConf) return null;
    if (decision !== "buy" && decision !== "sell") return null;

    const price = scan.close;
    const atr = scan.ATR;
    const direction = decision as "buy" | "sell";

    // Calculate levels based on ATR
    let entry: number, sl: number, tp1: number, tp2: number, tp3: number;

    if (direction === "buy") {
      entry = price;
      sl = price - (atr * 1.5); // 1.5 ATR stop
      tp1 = price + (atr * 2);  // 2R
      tp2 = price + (atr * 3);  // 3R
      tp3 = price + (atr * 4.5); // 4.5R
    } else {
      entry = price;
      sl = price + (atr * 1.5);
      tp1 = price - (atr * 2);
      tp2 = price - (atr * 3);
      tp3 = price - (atr * 4.5);
    }

    const riskPips = Math.abs(entry - sl);
    const rewardPips = Math.abs(tp2 - entry);
    const rr = riskPips > 0 ? rewardPips / riskPips : 0;

    const signal: TradeSignal = {
      symbol,
      direction,
      entry_price: parseFloat(entry.toFixed(5)),
      stop_loss: parseFloat(sl.toFixed(5)),
      take_profit_1: parseFloat(tp1.toFixed(5)),
      take_profit_2: parseFloat(tp2.toFixed(5)),
      take_profit_3: parseFloat(tp3.toFixed(5)),
      risk_reward: parseFloat(rr.toFixed(1)),
      confidence,
      playbook,
      reasoning: narrative,
      invalidation,
    };

    // Create trade plan in DB
    await this.db.from("trade_plans").insert({
      symbol,
      direction,
      entry_type: "limit",
      entry_price: signal.entry_price,
      stop_loss: signal.stop_loss,
      take_profits: [signal.take_profit_1, signal.take_profit_2, signal.take_profit_3],
      risk_percent: 1.0,
      expected_rr: signal.risk_reward,
      confidence,
      reasoning: narrative,
      status: "waiting_for_approval",
      metadata: {
        playbook,
        invalidation,
        atr,
        generated_at: new Date().toISOString(),
      },
    });

    // Create notification
    await this.db.from("notifications").insert({
      category: "trading",
      priority: confidence >= 90 ? "critical" : "high",
      title: `🎯 ${direction.toUpperCase()} ${symbol} — ${confidence}% confidence`,
      summary: `${playbook} playbook. Entry: ${signal.entry_price}, SL: ${signal.stop_loss}, TP: ${signal.take_profit_2}. RR: ${signal.risk_reward}:1`,
      description: `${narrative}\n\nEntry: ${signal.entry_price}\nStop Loss: ${signal.stop_loss}\nTP1: ${signal.take_profit_1}\nTP2: ${signal.take_profit_2}\nTP3: ${signal.take_profit_3}\nRisk:Reward: ${signal.risk_reward}:1\n\nInvalidation: ${invalidation}`,
      subsystem: "signal_generator",
      market: symbol,
      action_required: true,
      status: "created",
      metadata: signal,
    });

    return signal;
  }
}
