"use client";

import { useState } from "react";
import { Brain, TrendingDown, TrendingUp, Minus, Loader2, AlertTriangle, CheckCircle } from "lucide-react";

interface AnalysisResult {
  symbol: string;
  bias: string;
  market_state: string;
  confidence: number;
  narrative: string;
  primary_playbook: string | null;
  alternative_playbooks: string[];
  supporting_evidence: string[];
  contradicting_evidence: string[];
  decision: string;
  next_action: string;
  invalidation: string;
}

const timeframeKeys = ["Weekly", "Daily", "4H", "1H", "15M"];
const defaultTF = { bias: "", structure: "", liquidity: "", key_levels: "", notes: "" };

export default function AnalyzePage() {
  const [symbol, setSymbol] = useState("EURUSD");
  const [session, setSession] = useState("london");
  const [macro, setMacro] = useState("");
  const [timeframes, setTimeframes] = useState<Record<string, typeof defaultTF>>(
    Object.fromEntries(timeframeKeys.map(tf => [tf, { ...defaultTF }]))
  );
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function updateTF(tf: string, field: string, value: string) {
    setTimeframes(prev => ({ ...prev, [tf]: { ...prev[tf], [field]: value } }));
  }

  async function runAnalysis() {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol, session, macro_context: macro, timeframes }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data.analysis);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analyze Market</h1>
        <p className="text-zinc-400 text-sm">Run the Reasoning Engine on any market</p>
      </div>

      {/* Input Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="space-y-3">
          <label className="text-sm text-zinc-400">Symbol</label>
          <select value={symbol} onChange={e => setSymbol(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm">
            {["EURUSD","GBPUSD","USDJPY","XAUUSD","AUDUSD","USDCAD","GBPJPY","EURJPY"].map(s =>
              <option key={s} value={s}>{s}</option>
            )}
          </select>
        </div>
        <div className="space-y-3">
          <label className="text-sm text-zinc-400">Session</label>
          <select value={session} onChange={e => setSession(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm">
            {["london","new_york","tokyo","sydney","overlap"].map(s =>
              <option key={s} value={s}>{s}</option>
            )}
          </select>
        </div>
        <div className="space-y-3">
          <label className="text-sm text-zinc-400">Macro Context</label>
          <input value={macro} onChange={e => setMacro(e.target.value)}
            placeholder="e.g., Fed hawkish, USD strength..."
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm" />
        </div>
      </div>

      {/* Timeframe Inputs */}
      <div className="space-y-3">
        <h2 className="font-semibold">Multi-Timeframe Analysis</h2>
        <div className="space-y-4">
          {timeframeKeys.map(tf => (
            <div key={tf} className="bg-zinc-900 rounded-lg border border-zinc-800 p-4">
              <h3 className="text-sm font-medium text-emerald-400 mb-3">{tf}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <input placeholder="Bias (bullish/bearish/neutral)" value={timeframes[tf].bias}
                  onChange={e => updateTF(tf, "bias", e.target.value)}
                  className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-xs" />
                <input placeholder="Structure (BOS/CHOCH/MSS...)" value={timeframes[tf].structure}
                  onChange={e => updateTF(tf, "structure", e.target.value)}
                  className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-xs" />
                <input placeholder="Liquidity (BSL/SSL targets)" value={timeframes[tf].liquidity}
                  onChange={e => updateTF(tf, "liquidity", e.target.value)}
                  className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-xs" />
                <input placeholder="Key levels" value={timeframes[tf].key_levels}
                  onChange={e => updateTF(tf, "key_levels", e.target.value)}
                  className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-xs" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Run Button */}
      <button onClick={runAnalysis} disabled={loading}
        className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-lg font-medium flex items-center gap-2">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
        {loading ? "Reasoning..." : "Run Analysis"}
      </button>

      {error && (
        <div className="p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Results */}
      {result && <AnalysisResult result={result} />}
    </div>
  );
}

function AnalysisResult({ result }: { result: AnalysisResult }) {
  const biasIcon = result.bias === "bullish" ? TrendingUp : result.bias === "bearish" ? TrendingDown : Minus;
  const BiasIcon = biasIcon;
  const biasColor = result.bias === "bullish" ? "text-emerald-400" : result.bias === "bearish" ? "text-red-400" : "text-zinc-400";
  const decisionColor: Record<string, string> = {
    buy: "bg-emerald-900/30 text-emerald-400 border-emerald-700",
    sell: "bg-red-900/30 text-red-400 border-red-700",
    wait: "bg-amber-900/30 text-amber-400 border-amber-700",
    no_trade: "bg-zinc-800 text-zinc-400 border-zinc-700",
  };
  const confColor = result.confidence >= 85 ? "text-emerald-400" : result.confidence >= 70 ? "text-amber-400" : "text-red-400";

  return (
    <div className="space-y-4">
      {/* Decision Header */}
      <div className={`p-4 rounded-lg border ${decisionColor[result.decision] || decisionColor.wait}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BiasIcon className={`h-6 w-6 ${biasColor}`} />
            <div>
              <p className="font-bold text-lg">{result.decision.toUpperCase()} — {result.symbol}</p>
              <p className="text-sm opacity-80">{result.primary_playbook ? `Playbook: ${result.primary_playbook}` : "No playbook selected"}</p>
            </div>
          </div>
          <div className="text-right">
            <p className={`text-2xl font-bold ${confColor}`}>{result.confidence}%</p>
            <p className="text-xs opacity-60">confidence</p>
          </div>
        </div>
      </div>

      {/* Narrative */}
      <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-4">
        <h3 className="font-semibold mb-2">Institutional Narrative</h3>
        <p className="text-sm text-zinc-300 leading-relaxed">{result.narrative}</p>
      </div>

      {/* Evidence Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-4">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-500" /> Supporting Evidence
          </h3>
          <ul className="space-y-1">
            {result.supporting_evidence.map((e, i) => (
              <li key={i} className="text-sm text-zinc-400 flex items-start gap-2">
                <span className="text-emerald-500 mt-1">•</span> {e}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-4">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" /> Contradicting Evidence
          </h3>
          <ul className="space-y-1">
            {result.contradicting_evidence.map((e, i) => (
              <li key={i} className="text-sm text-zinc-400 flex items-start gap-2">
                <span className="text-amber-500 mt-1">•</span> {e}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Next Action & Invalidation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-4">
          <h3 className="font-semibold mb-2">Next Action</h3>
          <p className="text-sm text-zinc-300">{result.next_action}</p>
        </div>
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-4">
          <h3 className="font-semibold mb-2 text-red-400">Invalidation</h3>
          <p className="text-sm text-zinc-300">{result.invalidation}</p>
        </div>
      </div>

      {/* Meta */}
      <div className="flex gap-3 text-xs text-zinc-500">
        <span>State: {result.market_state}</span>
        <span>•</span>
        <span>Bias: {result.bias}</span>
        {result.alternative_playbooks.length > 0 && (
          <>
            <span>•</span>
            <span>Alternatives: {result.alternative_playbooks.join(", ")}</span>
          </>
        )}
      </div>
    </div>
  );
}
