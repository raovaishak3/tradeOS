"use client";

import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Clock, TrendingUp, TrendingDown, Activity } from "lucide-react";

interface TradePlan {
  id: string;
  symbol: string;
  direction: string;
  entry_price: number;
  stop_loss: number;
  take_profits: number[];
  risk_percent: number;
  lot_size: number;
  expected_rr: number;
  confidence: number;
  reasoning: string;
  status: string;
  created_at: string;
}

interface ActiveTrade {
  id: string;
  symbol: string;
  direction: string;
  entry_price: number;
  current_price: number;
  stop_loss: number;
  take_profits: number[];
  lot_size: number;
  floating_pnl: number;
  current_rr: number;
  current_confidence: number;
  trade_health: number;
  management_state: string;
  opened_at: string;
}

export default function TradesPage() {
  const [pendingPlans, setPending] = useState<TradePlan[]>([]);
  const [activeTrades, setActive] = useState<ActiveTrade[]>([]);
  const [allPlans, setAllPlans] = useState<TradePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"pending" | "active" | "history">("pending");

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const [pRes, aRes, hRes] = await Promise.all([
      fetch("/api/trades?status=waiting_for_approval"),
      fetch("/api/trades?status=active"),
      fetch("/api/trades?status=all"),
    ]);
    const pData = await pRes.json();
    const aData = await aRes.json();
    const hData = await hRes.json();
    setPending(pData.plans || []);
    setActive(aData.trades || []);
    setAllPlans(hData.plans || []);
    setLoading(false);
  }

  async function handleApproval(planId: string, action: "approve" | "reject") {
    await fetch("/api/trades/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan_id: planId, action }),
    });
    loadData();
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Trade Management</h1>
        <p className="text-zinc-400 text-sm">Approve, monitor, and manage trades</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { key: "pending", label: "Pending Approval", count: pendingPlans.length },
          { key: "active", label: "Active Trades", count: activeTrades.length },
          { key: "history", label: "All Plans", count: allPlans.length },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === t.key ? "bg-emerald-600 text-white" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
            }`}>
            {t.label} {t.count > 0 && <span className="ml-1 px-1.5 py-0.5 rounded bg-zinc-700 text-xs">{t.count}</span>}
          </button>
        ))}
      </div>

      {loading ? <p className="text-zinc-500">Loading...</p> : (
        <>
          {tab === "pending" && <PendingPlans plans={pendingPlans} onAction={handleApproval} />}
          {tab === "active" && <ActiveTradesList trades={activeTrades} />}
          {tab === "history" && <PlanHistory plans={allPlans} />}
        </>
      )}
    </div>
  );
}

function PendingPlans({ plans, onAction }: { plans: TradePlan[]; onAction: (id: string, action: "approve" | "reject") => void }) {
  if (plans.length === 0) return <p className="text-zinc-500">No trades waiting for approval.</p>;
  return (
    <div className="space-y-3">
      {plans.map(plan => (
        <div key={plan.id} className="bg-zinc-900 rounded-lg border border-amber-800/50 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              {plan.direction === "buy" ? <TrendingUp className="h-5 w-5 text-emerald-400" /> : <TrendingDown className="h-5 w-5 text-red-400" />}
              <div>
                <p className="font-bold">{plan.direction.toUpperCase()} {plan.symbol}</p>
                <p className="text-xs text-zinc-500">{new Date(plan.created_at).toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => onAction(plan.id, "approve")}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded text-xs font-medium flex items-center gap-1">
                <CheckCircle className="h-3 w-3" /> Approve
              </button>
              <button onClick={() => onAction(plan.id, "reject")}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-500 rounded text-xs font-medium flex items-center gap-1">
                <XCircle className="h-3 w-3" /> Reject
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
            <div><span className="text-zinc-500 text-xs">Entry</span><p className="font-mono">{plan.entry_price}</p></div>
            <div><span className="text-zinc-500 text-xs">Stop Loss</span><p className="font-mono text-red-400">{plan.stop_loss}</p></div>
            <div><span className="text-zinc-500 text-xs">Target</span><p className="font-mono text-emerald-400">{plan.take_profits?.[0] || "—"}</p></div>
            <div><span className="text-zinc-500 text-xs">RR</span><p className="font-bold">{plan.expected_rr}R</p></div>
            <div><span className="text-zinc-500 text-xs">Confidence</span><p className={`font-bold ${plan.confidence >= 80 ? "text-emerald-400" : "text-amber-400"}`}>{plan.confidence}%</p></div>
          </div>
          {plan.reasoning && <p className="text-xs text-zinc-400 mt-3">{plan.reasoning}</p>}
        </div>
      ))}
    </div>
  );
}

function ActiveTradesList({ trades }: { trades: ActiveTrade[] }) {
  if (trades.length === 0) return <p className="text-zinc-500">No active trades.</p>;
  return (
    <div className="space-y-3">
      {trades.map(trade => {
        const pnlColor = trade.floating_pnl >= 0 ? "text-emerald-400" : "text-red-400";
        const healthColor = trade.trade_health >= 80 ? "bg-emerald-500" : trade.trade_health >= 50 ? "bg-amber-500" : "bg-red-500";
        return (
          <div key={trade.id} className="bg-zinc-900 rounded-lg border border-zinc-800 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                {trade.direction === "buy" ? <TrendingUp className="h-5 w-5 text-emerald-400" /> : <TrendingDown className="h-5 w-5 text-red-400" />}
                <div>
                  <p className="font-bold">{trade.direction.toUpperCase()} {trade.symbol}</p>
                  <p className="text-xs text-zinc-500">{trade.management_state}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-bold ${pnlColor}`}>${trade.floating_pnl.toFixed(2)}</p>
                <p className="text-xs text-zinc-500">{trade.current_rr.toFixed(1)}R</p>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3 text-sm mb-3">
              <div><span className="text-zinc-500 text-xs">Entry</span><p className="font-mono">{trade.entry_price}</p></div>
              <div><span className="text-zinc-500 text-xs">Current</span><p className="font-mono">{trade.current_price}</p></div>
              <div><span className="text-zinc-500 text-xs">Stop</span><p className="font-mono text-red-400">{trade.stop_loss}</p></div>
              <div><span className="text-zinc-500 text-xs">Confidence</span><p className="font-bold">{trade.current_confidence}%</p></div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500">Health</span>
              <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div className={`h-full ${healthColor} rounded-full`} style={{ width: `${trade.trade_health}%` }} />
              </div>
              <span className="text-xs text-zinc-400">{trade.trade_health}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PlanHistory({ plans }: { plans: TradePlan[] }) {
  if (plans.length === 0) return <p className="text-zinc-500">No trade plans yet.</p>;
  return (
    <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-zinc-800/50">
          <tr>
            <th className="text-left p-3 text-zinc-400">Symbol</th>
            <th className="text-left p-3 text-zinc-400">Direction</th>
            <th className="text-left p-3 text-zinc-400">Entry</th>
            <th className="text-left p-3 text-zinc-400">RR</th>
            <th className="text-left p-3 text-zinc-400">Confidence</th>
            <th className="text-left p-3 text-zinc-400">Status</th>
            <th className="text-left p-3 text-zinc-400">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {plans.map(p => (
            <tr key={p.id} className="hover:bg-zinc-800/30">
              <td className="p-3 font-mono font-medium">{p.symbol}</td>
              <td className="p-3">
                <span className={p.direction === "buy" ? "text-emerald-400" : "text-red-400"}>
                  {p.direction.toUpperCase()}
                </span>
              </td>
              <td className="p-3 font-mono">{p.entry_price}</td>
              <td className="p-3">{p.expected_rr}R</td>
              <td className="p-3">{p.confidence}%</td>
              <td className="p-3">
                <span className={`px-2 py-0.5 rounded text-xs ${
                  p.status === "approved" ? "bg-emerald-900/30 text-emerald-400" :
                  p.status === "rejected" ? "bg-red-900/30 text-red-400" :
                  p.status === "waiting_for_approval" ? "bg-amber-900/30 text-amber-400" :
                  "bg-zinc-700 text-zinc-400"
                }`}>{p.status}</span>
              </td>
              <td className="p-3 text-zinc-500 text-xs">{new Date(p.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
