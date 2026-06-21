import { createAdminClient } from "@/lib/supabase/server";
import { Shield, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function GovernancePage() {
  const db = createAdminClient();
  
  const [settingsRes, brainRes, conceptsRes] = await Promise.all([
    db.from("user_settings").select("*").eq("category", "risk"),
    db.from("brain_versions").select("*").order("created_at", { ascending: false }).limit(1).single(),
    db.from("concepts").select("status", { count: "exact" }).eq("status", "compiled"),
  ]);

  const riskSettings = settingsRes.data || [];
  const brain = brainRes.data;
  const compiledConcepts = conceptsRes.count || 0;

  const rules = [
    { rule: "No trade without liquidity confirmation", status: "enforced", critical: true },
    { rule: "MSS required for all reversal trades", status: "enforced", critical: true },
    { rule: "Human approval mandatory before execution", status: "enforced", critical: true },
    { rule: "Maximum 1% risk per trade", status: "enforced", critical: true },
    { rule: "Maximum 3% daily loss", status: "enforced", critical: true },
    { rule: "No entry on CHOCH alone", status: "enforced", critical: true },
    { rule: "HTF bias must be established before entry", status: "enforced", critical: false },
    { rule: "Minimum confidence threshold for signals", status: "enforced", critical: false },
    { rule: "No trading during off-session hours", status: "monitored", critical: false },
    { rule: "All reasoning stored permanently", status: "enforced", critical: false },
    { rule: "Every trade must reference a playbook", status: "enforced", critical: false },
    { rule: "Invalidation level defined before entry", status: "enforced", critical: false },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Governance</h1>
        <p className="text-zinc-400 text-sm">Safety rules, risk limits, and system integrity</p>
      </div>

      {/* Status */}
      <div className="bg-zinc-900 rounded-lg border border-emerald-800/50 p-4">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-emerald-500" />
          <div>
            <p className="font-bold text-emerald-400">Governance Active</p>
            <p className="text-xs text-zinc-400">All safety rules enforced. Brain v{brain?.version}. {compiledConcepts} concepts compiled.</p>
          </div>
        </div>
      </div>

      {/* Rules */}
      <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-4">
        <h3 className="font-semibold mb-4">Trading Rules</h3>
        <div className="space-y-2">
          {rules.map((r, i) => (
            <div key={i} className="flex items-center justify-between p-2 rounded hover:bg-zinc-800/50">
              <div className="flex items-center gap-3">
                {r.status === "enforced" ? (
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                )}
                <span className="text-sm">{r.rule}</span>
                {r.critical && <span className="px-1.5 py-0.5 rounded text-xs bg-red-900/30 text-red-400">CRITICAL</span>}
              </div>
              <span className={`text-xs ${r.status === "enforced" ? "text-emerald-400" : "text-amber-400"}`}>
                {r.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Risk Limits */}
      <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-4">
        <h3 className="font-semibold mb-4">Risk Limits</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {riskSettings.map(s => (
            <div key={s.key} className="p-3 rounded bg-zinc-800/50">
              <p className="text-xs text-zinc-500">{s.description}</p>
              <p className="text-lg font-bold mt-1">{s.value}{s.key.includes("max_open") ? "" : "%"}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Core Principles */}
      <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-4">
        <h3 className="font-semibold mb-3">Core Governance Principles</h3>
        <div className="space-y-2 text-sm text-zinc-400">
          <p>• The system cannot invent methodology not in the Knowledge Core</p>
          <p>• The system cannot execute trades without human approval</p>
          <p>• The system cannot ignore stop losses or risk limits</p>
          <p>• The system cannot override user decisions</p>
          <p>• Every recommendation must be traceable to Knowledge Core rules</p>
          <p>• Every decision is permanently stored and auditable</p>
          <p>• NO TRADE is always a valid and rewarded decision</p>
        </div>
      </div>
    </div>
  );
}
