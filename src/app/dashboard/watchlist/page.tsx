"use client";

import { useState, useEffect } from "react";
import { Target, TrendingUp, TrendingDown, Minus, RefreshCw } from "lucide-react";

interface WatchlistItem {
  id: string;
  symbol: string;
  display_name: string;
  asset_class: string;
  market_status: string;
  current_bias: string;
  current_confidence: number;
  current_playbook: string | null;
  active_aois: number;
  last_analysis_at: string | null;
  enabled: boolean;
}

interface Analysis {
  id: string;
  symbol: string;
  bias: string;
  market_state: string;
  confidence: number;
  institutional_narrative: string;
  playbook_candidates: { name: string; score: number }[];
  created_at: string;
  metadata: Record<string, unknown>;
}

export default function WatchlistPage() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [analyses, setAnalyses] = useState<Record<string, Analysis>>({});
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const [wlRes, anRes] = await Promise.all([
      fetch("/api/watchlist", { cache: "no-store" }),
      fetch("/api/analyses/latest", { cache: "no-store" }),
    ]);
    const wlData = await wlRes.json();
    const anData = await anRes.json();
    setWatchlist(wlData.watchlist || []);
    const map: Record<string, Analysis> = {};
    (anData.analyses || []).forEach((a: Analysis) => { map[a.symbol] = a; });
    setAnalyses(map);
    setLoading(false);
  }

  async function analyzeAll() {
    setAnalyzing(true);
    // Analyze in batches of 3 to avoid timeout
    const symbols = watchlist.map(w => w.symbol);
    for (let i = 0; i < symbols.length; i += 3) {
      const batch = symbols.slice(i, i + 3);
      try {
        await fetch("/api/analyze/auto", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ symbols: batch }),
        });
      } catch {}
      // Refresh after each batch
      await loadData();
    }
    setAnalyzing(false);
  }

  const selectedAnalysis = selected ? analyses[selected] : null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Watchlist</h1>
          <p className="text-zinc-400 text-sm">Monitor all instruments — click for latest analysis</p>
        </div>
        <div className="flex gap-2">
          <button onClick={analyzeAll} disabled={analyzing}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-md text-sm font-medium">
            {analyzing ? "Analyzing..." : "⚡ Analyze All"}
          </button>
          <button onClick={loadData} className="p-2 hover:bg-zinc-800 rounded-md">
            <RefreshCw className="h-4 w-4 text-zinc-400" />
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-zinc-500">Loading...</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Watchlist Grid */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3">
            {watchlist.map(item => {
              const analysis = analyses[item.symbol];
              const bias = analysis?.bias || item.current_bias || "neutral";
              const confidence = analysis?.confidence || item.current_confidence || 0;
              const status = item.market_status;
              const playbook = analysis?.playbook_candidates?.[0]?.name || null;
              const decision = (analysis?.metadata as any)?.decision || "no_trade";

              return (
                <div
                  key={item.id}
                  onClick={() => setSelected(item.symbol)}
                  className={`bg-zinc-900 rounded-lg border p-4 cursor-pointer transition-all ${
                    selected === item.symbol ? "border-emerald-500" : "border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <BiasIcon bias={bias} />
                      <span className="font-mono font-bold">{item.symbol}</span>
                    </div>
                    <StatusBadge status={decision} />
                  </div>
                  <div className="flex items-center justify-between text-xs text-zinc-500">
                    <span>{playbook || "No playbook"}</span>
                    <span className={confidence >= 80 ? "text-emerald-400" : confidence >= 60 ? "text-amber-400" : "text-zinc-500"}>
                      {confidence > 0 ? `${confidence}%` : "—"}
                    </span>
                  </div>
                  {analysis && (
                    <p className="text-xs text-zinc-600 mt-2 line-clamp-2">
                      {analysis.institutional_narrative?.slice(0, 100)}...
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Detail Panel */}
          <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-4">
            {selectedAnalysis ? (
              <div className="space-y-4">
                <div>
                  <h2 className="font-bold text-lg">{selected}</h2>
                  <p className="text-xs text-zinc-500">Last analysis: {new Date(selectedAnalysis.created_at).toLocaleString()}</p>
                </div>
                <div className="flex gap-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedAnalysis.bias === "bullish" ? "bg-emerald-900/30 text-emerald-400" :
                    selectedAnalysis.bias === "bearish" ? "bg-red-900/30 text-red-400" :
                    "bg-zinc-700 text-zinc-400"
                  }`}>{selectedAnalysis.bias}</span>
                  <span className="px-2 py-1 rounded text-xs bg-zinc-700 text-zinc-400">{selectedAnalysis.market_state}</span>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    selectedAnalysis.confidence >= 80 ? "bg-emerald-900/30 text-emerald-400" : "bg-amber-900/30 text-amber-400"
                  }`}>{selectedAnalysis.confidence}%</span>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-zinc-300 mb-1">Narrative</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">{selectedAnalysis.institutional_narrative}</p>
                </div>
                {(selectedAnalysis.metadata as any)?.next_action && (
                  <div>
                    <h3 className="text-sm font-medium text-zinc-300 mb-1">Next Action</h3>
                    <p className="text-sm text-zinc-400">{(selectedAnalysis.metadata as any).next_action}</p>
                  </div>
                )}
                {(selectedAnalysis.metadata as any)?.invalidation && (
                  <div>
                    <h3 className="text-sm font-medium text-red-400 mb-1">Invalidation</h3>
                    <p className="text-sm text-zinc-400">{(selectedAnalysis.metadata as any).invalidation}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-zinc-500 py-8">
                <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Select an instrument to see its analysis</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function BiasIcon({ bias }: { bias: string }) {
  if (bias === "bullish" || bias === "strong_bullish") return <TrendingUp className="h-4 w-4 text-emerald-400" />;
  if (bias === "bearish" || bias === "strong_bearish") return <TrendingDown className="h-4 w-4 text-red-400" />;
  return <Minus className="h-4 w-4 text-zinc-500" />;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    buy: "bg-emerald-900/40 text-emerald-400",
    sell: "bg-red-900/40 text-red-400",
    wait: "bg-amber-900/40 text-amber-400",
    no_trade: "bg-zinc-700 text-zinc-400",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${styles[status] || styles.no_trade}`}>
      {status.toUpperCase()}
    </span>
  );
}
