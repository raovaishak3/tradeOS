import { createAdminClient } from "@/lib/supabase/server";
import { BarChart3, TrendingUp, TrendingDown, Target } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PerformancePage() {
  const db = createAdminClient();
  
  const [analysesRes, tradesRes, plansRes] = await Promise.all([
    db.from("top_down_analyses").select("symbol, bias, confidence, metadata, created_at").order("created_at", { ascending: false }).limit(100),
    db.from("active_trades").select("*"),
    db.from("trade_plans").select("*").order("created_at", { ascending: false }).limit(50),
  ]);

  const analyses = analysesRes.data || [];
  const trades = tradesRes.data || [];
  const plans = plansRes.data || [];

  // Stats
  const totalAnalyses = analyses.length;
  const buyDecisions = analyses.filter(a => (a.metadata as any)?.decision === "buy").length;
  const sellDecisions = analyses.filter(a => (a.metadata as any)?.decision === "sell").length;
  const waitDecisions = analyses.filter(a => (a.metadata as any)?.decision === "wait").length;
  const avgConfidence = totalAnalyses > 0 ? Math.round(analyses.reduce((s, a) => s + (a.confidence || 0), 0) / totalAnalyses) : 0;
  const approvedPlans = plans.filter(p => p.status === "approved").length;
  const rejectedPlans = plans.filter(p => p.status === "rejected").length;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Performance</h1>
        <p className="text-zinc-400 text-sm">Trading Brain activity and decision metrics</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatBox label="Total Analyses" value={totalAnalyses} icon={BarChart3} />
        <StatBox label="Avg Confidence" value={`${avgConfidence}%`} icon={Target} />
        <StatBox label="Buy Signals" value={buyDecisions} icon={TrendingUp} color="emerald" />
        <StatBox label="Sell Signals" value={sellDecisions} icon={TrendingDown} color="red" />
      </div>

      {/* Decision Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-4">
          <h3 className="font-semibold mb-3">Decision Distribution</h3>
          <div className="space-y-3">
            <Bar label="Wait" value={waitDecisions} max={totalAnalyses} color="bg-amber-500" />
            <Bar label="No Trade" value={totalAnalyses - buyDecisions - sellDecisions - waitDecisions} max={totalAnalyses} color="bg-zinc-500" />
            <Bar label="Buy" value={buyDecisions} max={totalAnalyses} color="bg-emerald-500" />
            <Bar label="Sell" value={sellDecisions} max={totalAnalyses} color="bg-red-500" />
          </div>
        </div>

        <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-4">
          <h3 className="font-semibold mb-3">Trade Plans</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Total Plans</span>
              <span>{plans.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Approved</span>
              <span className="text-emerald-400">{approvedPlans}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Rejected</span>
              <span className="text-red-400">{rejectedPlans}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Pending</span>
              <span className="text-amber-400">{plans.filter(p => p.status === "waiting_for_approval").length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Active Trades</span>
              <span className="text-blue-400">{trades.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Confidence by Symbol */}
      <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-4">
        <h3 className="font-semibold mb-3">Latest Confidence by Symbol</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(
            analyses.reduce((acc, a) => {
              if (!acc[a.symbol]) acc[a.symbol] = a.confidence;
              return acc;
            }, {} as Record<string, number>)
          ).map(([sym, conf]) => (
            <div key={sym} className="text-center p-2 rounded bg-zinc-800/50">
              <p className="font-mono text-xs text-zinc-400">{sym}</p>
              <p className={`text-lg font-bold ${(conf as number) >= 80 ? "text-emerald-400" : (conf as number) >= 60 ? "text-amber-400" : "text-zinc-500"}`}>
                {conf as number}%
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, icon: Icon, color }: { label: string; value: any; icon: any; color?: string }) {
  const c = color === "emerald" ? "text-emerald-500" : color === "red" ? "text-red-500" : "text-zinc-400";
  return (
    <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-4">
      <Icon className={`h-4 w-4 ${c} mb-2`} />
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-zinc-500">{label}</p>
    </div>
  );
}

function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-zinc-400">{label}</span>
        <span className="text-zinc-500">{value}</span>
      </div>
      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
