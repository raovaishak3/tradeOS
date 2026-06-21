"use client";

import { useState, useEffect } from "react";
import { Brain, Target, Activity, AlertTriangle, Clock } from "lucide-react";
import Link from "next/link";

interface DashboardData {
  brain: any;
  stats: { concepts: number; rules: number; relationships: number; playbooks: number };
  watchlist: any[];
  analyses: any[];
  pendingApprovals: number;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  async function load() {
    const [brainRes, wlRes, anRes, plansRes] = await Promise.all([
      fetch("/api/brain", { cache: "no-store" }),
      fetch("/api/watchlist", { cache: "no-store" }),
      fetch("/api/analyses/latest", { cache: "no-store" }),
      fetch("/api/trades?status=waiting_for_approval", { cache: "no-store" }),
    ]);
    const [brainData, wlData, anData, plansData] = await Promise.all([
      brainRes.json(), wlRes.json(), anRes.json(), plansRes.json(),
    ]);
    setData({
      brain: brainData.brain,
      stats: brainData.stats || { concepts: 0, rules: 0, relationships: 0, playbooks: 0 },
      watchlist: wlData.watchlist || [],
      analyses: anData.analyses || [],
      pendingApprovals: (plansData.plans || []).length,
    });
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!data) return <div className="p-6 text-zinc-400">Loading dashboard...</div>;

  const analysisBySymbol: Record<string, any> = {};
  data.analyses.forEach(a => { if (!analysisBySymbol[a.symbol]) analysisBySymbol[a.symbol] = a; });
  const analyzedCount = Object.keys(analysisBySymbol).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-zinc-400 text-sm">Trading Brain OS — Command Center</p>
        </div>
        <div className="flex items-center gap-4 text-sm text-zinc-400">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>Live · 30s</span>
          </div>
          <div className="px-2 py-1 rounded bg-emerald-900/50 text-emerald-400 text-xs font-medium">
            Brain {data.brain?.version || "0.1.0"} · {data.brain?.state || "draft"}
          </div>
        </div>
      </div>

      {/* Stats Grid — Clickable */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/dashboard/knowledge"><StatCard icon={Brain} label="Knowledge" value={String(data.stats.concepts)} subtitle="concepts compiled" color="emerald" /></Link>
        <Link href="/dashboard/watchlist"><StatCard icon={Target} label="Analyzed" value={String(analyzedCount)} subtitle="symbols with analysis" color="blue" /></Link>
        <Link href="/dashboard/trades"><StatCard icon={Activity} label="Active Trades" value="0" subtitle="positions open" color="amber" /></Link>
        <Link href="/dashboard/trades"><StatCard icon={AlertTriangle} label="Pending Approvals" value={String(data.pendingApprovals)} subtitle="awaiting action" color="red" /></Link>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Watchlist */}
        <div className="lg:col-span-2 bg-zinc-900 rounded-lg border border-zinc-800 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Watchlist</h2>
            <span className="text-xs text-zinc-500">{data.watchlist.length} instruments</span>
          </div>
          <div className="space-y-2">
            {data.watchlist.map(item => {
              const analysis = analysisBySymbol[item.symbol];
              const bias = analysis?.bias || item.current_bias || "neutral";
              const conf = analysis?.confidence || item.current_confidence || 0;
              const decision = (analysis?.metadata as any)?.decision || item.market_status || "no_trade";
              return (
                <Link href="/dashboard/watchlist" key={item.symbol}>
                  <div className="flex items-center justify-between p-3 rounded-md bg-zinc-800/50 hover:bg-zinc-800 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-medium">{item.symbol}</span>
                      <div className={`w-2 h-2 rounded-full ${bias.includes("bull") ? "bg-emerald-400" : bias.includes("bear") ? "bg-red-400" : "bg-zinc-500"}`} />
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`text-xs ${conf >= 80 ? "text-emerald-400" : conf >= 60 ? "text-amber-400" : "text-zinc-500"}`}>{conf}%</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        decision === "buy" ? "bg-emerald-900/40 text-emerald-400" :
                        decision === "sell" ? "bg-red-900/40 text-red-400" :
                        decision === "wait" ? "bg-blue-900/40 text-blue-400" :
                        "bg-zinc-700 text-zinc-400"
                      }`}>{decision.toUpperCase()}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-4">
            <h2 className="font-semibold mb-3">System Status</h2>
            <div className="space-y-2 text-sm">
              <SysItem label="Brain" status="online" detail={`v${data.brain?.version || "0.1.0"}`} />
              <SysItem label="Knowledge" status="online" detail={`${data.stats.concepts} concepts`} />
              <SysItem label="Market Data" status="online" detail="EC2 connected" />
              <SysItem label="LLM" status="online" detail="DeepSeek" />
            </div>
          </div>
          <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-4">
            <h2 className="font-semibold mb-3">Brain Health</h2>
            <div className="space-y-2">
              <HealthBar label="Foundations" value={12} max={12} />
              <HealthBar label="Market Structure" value={21} max={21} />
              <HealthBar label="Liquidity" value={12} max={12} />
              <HealthBar label="AOIs" value={12} max={12} />
              <HealthBar label="Playbooks" value={5} max={10} />
              <HealthBar label="Confirmation" value={5} max={10} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, subtitle, color }: { icon: any; label: string; value: string; subtitle: string; color: string }) {
  const colors: Record<string, string> = { emerald: "text-emerald-500 bg-emerald-500/10", blue: "text-blue-500 bg-blue-500/10", amber: "text-amber-500 bg-amber-500/10", red: "text-red-500 bg-red-500/10" };
  return (
    <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-4 hover:border-zinc-700 transition-colors">
      <div className="flex items-center gap-3 mb-2"><div className={`p-2 rounded-md ${colors[color]}`}><Icon className="h-4 w-4" /></div><span className="text-sm text-zinc-400">{label}</span></div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-zinc-500 mt-1">{subtitle}</p>
    </div>
  );
}

function SysItem({ label, status, detail }: { label: string; status: string; detail: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${status === "online" ? "bg-emerald-500" : "bg-red-500"}`} /><span className="text-zinc-300">{label}</span></div>
      <span className="text-zinc-500 text-xs">{detail}</span>
    </div>
  );
}

function HealthBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs"><span className="text-zinc-400">{label}</span><span className="text-zinc-500">{value}/{max}</span></div>
      <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} /></div>
    </div>
  );
}
