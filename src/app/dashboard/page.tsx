import { Brain, Target, Activity, AlertTriangle, Clock } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function getDashboardData() {
  const db = createAdminClient();

  const [brainRes, conceptsRes, domainsRes, watchlistRes] = await Promise.all([
    db.from("brain_versions").select("*").order("created_at", { ascending: false }).limit(1).single(),
    db.from("concepts").select("id", { count: "exact", head: true }),
    db.from("knowledge_domains").select("name, display_name, concept_count"),
    db.from("watchlist").select("*").eq("enabled", true).order("symbol"),
  ]);

  return {
    brain: brainRes.data,
    conceptCount: conceptsRes.count || 0,
    domains: domainsRes.data || [],
    watchlist: watchlistRes.data || [],
  };
}

export default async function DashboardPage() {
  const { brain, conceptCount, watchlist } = await getDashboardData();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-zinc-400 text-sm">Trading Brain OS — Command Center</p>
        </div>
        <div className="flex items-center gap-4 text-sm text-zinc-400">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>System Online</span>
          </div>
          <div className="px-2 py-1 rounded bg-emerald-900/50 text-emerald-400 text-xs font-medium">
            Brain {brain?.version || "0.1.0"} · {brain?.state || "draft"}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Brain}
          label="Knowledge"
          value={String(conceptCount)}
          subtitle="concepts compiled"
          color="emerald"
        />
        <StatCard
          icon={Target}
          label="Active AOIs"
          value="0"
          subtitle="across all markets"
          color="blue"
        />
        <StatCard
          icon={Activity}
          label="Active Trades"
          value="0"
          subtitle="positions open"
          color="amber"
        />
        <StatCard
          icon={AlertTriangle}
          label="Pending Approvals"
          value="0"
          subtitle="awaiting action"
          color="red"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Watchlist */}
        <div className="lg:col-span-2 bg-zinc-900 rounded-lg border border-zinc-800 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Watchlist</h2>
            <span className="text-xs text-zinc-500">{watchlist.length} instruments</span>
          </div>
          <div className="space-y-2">
            {watchlist.map((item) => (
              <div
                key={item.symbol}
                className="flex items-center justify-between p-3 rounded-md bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono font-medium">{item.symbol}</span>
                  <BiasIndicator bias={item.current_bias || "neutral"} />
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-zinc-500">{item.current_confidence || 0}%</span>
                  <StatusBadge status={item.market_status || "no_trade"} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Status */}
        <div className="space-y-4">
          <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-4">
            <h2 className="font-semibold mb-3">System Status</h2>
            <div className="space-y-2">
              <SystemItem label="Brain" status="online" detail={`v${brain?.version || "0.1.0"} ${brain?.state || "Draft"}`} />
              <SystemItem label="Knowledge" status="online" detail={`${conceptCount} concepts`} />
              <SystemItem label="TradingView" status="offline" detail="Not connected" />
              <SystemItem label="MT5" status="offline" detail="Not connected" />
              <SystemItem label="Supabase" status="online" detail="Connected" />
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

function StatCard({ icon: Icon, label, value, subtitle, color }: {
  icon: any; label: string; value: string; subtitle: string; color: string;
}) {
  const colors: Record<string, string> = {
    emerald: "text-emerald-500 bg-emerald-500/10",
    blue: "text-blue-500 bg-blue-500/10",
    amber: "text-amber-500 bg-amber-500/10",
    red: "text-red-500 bg-red-500/10",
  };
  return (
    <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-4">
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-md ${colors[color]}`}><Icon className="h-4 w-4" /></div>
        <span className="text-sm text-zinc-400">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-zinc-500 mt-1">{subtitle}</p>
    </div>
  );
}

function BiasIndicator({ bias }: { bias: string }) {
  const colors: Record<string, string> = {
    strong_bullish: "bg-emerald-500", bullish: "bg-emerald-400",
    neutral: "bg-zinc-500", bearish: "bg-red-400", strong_bearish: "bg-red-500",
  };
  return <div className={`w-2 h-2 rounded-full ${colors[bias] || colors.neutral}`} />;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    no_trade: "bg-zinc-700 text-zinc-400", watch: "bg-blue-900/50 text-blue-400",
    building: "bg-amber-900/50 text-amber-400", ready: "bg-emerald-900/50 text-emerald-400",
    approval: "bg-purple-900/50 text-purple-400", active: "bg-emerald-900/50 text-emerald-400",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${styles[status] || styles.no_trade}`}>
      {status.replace("_", " ").toUpperCase()}
    </span>
  );
}

function SystemItem({ label, status, detail }: { label: string; status: string; detail: string }) {
  const dotColor: Record<string, string> = { online: "bg-emerald-500", offline: "bg-red-500", empty: "bg-amber-500" };
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${dotColor[status]}`} />
        <span className="text-zinc-300">{label}</span>
      </div>
      <span className="text-zinc-500 text-xs">{detail}</span>
    </div>
  );
}

function HealthBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-zinc-400">{label}</span>
        <span className="text-zinc-500">{value}/{max}</span>
      </div>
      <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
