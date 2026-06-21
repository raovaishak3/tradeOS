import { createAdminClient } from "@/lib/supabase/server";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const db = createAdminClient();
  const { data: analyses } = await db
    .from("top_down_analyses")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analysis History</h1>
        <p className="text-zinc-400 text-sm">Every reasoning the brain has produced</p>
      </div>

      {(!analyses || analyses.length === 0) ? (
        <p className="text-zinc-500">No analyses yet. Go to Analyze to run your first one.</p>
      ) : (
        <div className="space-y-3">
          {analyses.map(a => {
            const decision = (a.metadata as any)?.decision || "wait";
            const decColors: Record<string, string> = {
              buy: "border-emerald-700 bg-emerald-900/10",
              sell: "border-red-700 bg-red-900/10",
              wait: "border-amber-700 bg-amber-900/10",
              no_trade: "border-zinc-700 bg-zinc-900",
            };
            return (
              <div key={a.id} className={`rounded-lg border p-4 ${decColors[decision] || decColors.wait}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    {a.bias === "bullish" ? <TrendingUp className="h-4 w-4 text-emerald-400" /> :
                     a.bias === "bearish" ? <TrendingDown className="h-4 w-4 text-red-400" /> :
                     <Minus className="h-4 w-4 text-zinc-400" />}
                    <span className="font-mono font-bold">{a.symbol}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">{decision.toUpperCase()}</span>
                    {a.playbook_candidates?.[0] && (
                      <span className="text-xs text-zinc-500">{a.playbook_candidates[0].name}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`font-bold ${a.confidence >= 80 ? "text-emerald-400" : a.confidence >= 60 ? "text-amber-400" : "text-zinc-500"}`}>
                      {a.confidence}%
                    </span>
                    <span className="text-xs text-zinc-600">{new Date(a.created_at).toLocaleString()}</span>
                  </div>
                </div>
                <p className="text-sm text-zinc-400 line-clamp-2">{a.institutional_narrative}</p>
                {(a.metadata as any)?.next_action && (
                  <p className="text-xs text-zinc-500 mt-2">Next: {(a.metadata as any).next_action}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
