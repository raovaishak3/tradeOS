import { BookOpen, Database, GitBranch, Layers } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function getKnowledgeData() {
  const db = createAdminClient();
  const [conceptsRes, rulesRes, relsRes, domainsRes] = await Promise.all([
    db.from("concepts").select("id, knowledge_id, name, domain_id, status, graph_level, priority, confidence_impact, category, definition", { count: "exact" }),
    db.from("rules").select("id", { count: "exact", head: true }),
    db.from("relationships").select("id", { count: "exact", head: true }),
    db.from("knowledge_domains").select("id, name, display_name, description, graph_level"),
  ]);

  // Count concepts per domain
  const concepts = conceptsRes.data || [];
  const domainCounts: Record<string, number> = {};
  concepts.forEach(c => {
    domainCounts[c.domain_id] = (domainCounts[c.domain_id] || 0) + 1;
  });

  return {
    concepts,
    conceptCount: conceptsRes.count || 0,
    ruleCount: rulesRes.count || 0,
    relCount: relsRes.count || 0,
    domains: (domainsRes.data || []).map(d => ({
      ...d,
      concept_count: domainCounts[d.id] || 0,
    })),
  };
}

export default async function KnowledgePage() {
  const { concepts, conceptCount, ruleCount, relCount, domains } = await getKnowledgeData();
  const coverage = Math.round((conceptCount / 100) * 100); // rough estimate

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Knowledge Core</h1>
        <p className="text-zinc-400 text-sm">
          Your Trading Bible compiled into machine reasoning — {conceptCount} concepts across {domains.length} domains
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-4">
          <div className="flex items-center gap-2 text-zinc-400 mb-2">
            <BookOpen className="h-4 w-4" />
            <span className="text-sm">Concepts</span>
          </div>
          <p className="text-2xl font-bold">{conceptCount}</p>
          <p className="text-xs text-zinc-500">across {domains.length} domains</p>
        </div>
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-4">
          <div className="flex items-center gap-2 text-zinc-400 mb-2">
            <Layers className="h-4 w-4" />
            <span className="text-sm">Rules</span>
          </div>
          <p className="text-2xl font-bold">{ruleCount}</p>
          <p className="text-xs text-zinc-500">deterministic logic</p>
        </div>
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-4">
          <div className="flex items-center gap-2 text-zinc-400 mb-2">
            <GitBranch className="h-4 w-4" />
            <span className="text-sm">Relationships</span>
          </div>
          <p className="text-2xl font-bold">{relCount}</p>
          <p className="text-xs text-zinc-500">graph edges</p>
        </div>
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-4">
          <div className="flex items-center gap-2 text-zinc-400 mb-2">
            <Database className="h-4 w-4" />
            <span className="text-sm">Coverage</span>
          </div>
          <p className="text-2xl font-bold">{coverage}%</p>
          <p className="text-xs text-zinc-500">target: 95%</p>
        </div>
      </div>

      {/* Domain Grid */}
      <div>
        <h2 className="font-semibold mb-3">Knowledge Domains</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {domains.map((domain) => (
            <div key={domain.id} className="bg-zinc-900 rounded-lg border border-zinc-800 p-4 hover:border-zinc-700 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-sm">{domain.display_name}</h3>
                <span className="text-xs text-zinc-500">L{domain.graph_level}</span>
              </div>
              <p className="text-xs text-zinc-500 mb-3">{domain.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">{domain.concept_count} concepts</span>
                <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${domain.concept_count > 0 ? 100 : 0}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Concepts List */}
      <div>
        <h2 className="font-semibold mb-3">All Concepts</h2>
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-zinc-800/50">
              <tr>
                <th className="text-left p-3 text-zinc-400 font-medium">ID</th>
                <th className="text-left p-3 text-zinc-400 font-medium">Name</th>
                <th className="text-left p-3 text-zinc-400 font-medium">Category</th>
                <th className="text-left p-3 text-zinc-400 font-medium">Level</th>
                <th className="text-left p-3 text-zinc-400 font-medium">Priority</th>
                <th className="text-left p-3 text-zinc-400 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {concepts.map((c) => (
                <tr key={c.id} className="hover:bg-zinc-800/30">
                  <td className="p-3 font-mono text-xs text-emerald-400">{c.knowledge_id}</td>
                  <td className="p-3 font-medium">{c.name}</td>
                  <td className="p-3 text-zinc-400">{c.category}</td>
                  <td className="p-3 text-zinc-500">{c.graph_level}</td>
                  <td className="p-3">
                    <span className={`px-1.5 py-0.5 rounded text-xs ${c.priority === "critical" ? "bg-red-900/30 text-red-400" : "bg-zinc-700 text-zinc-400"}`}>
                      {c.priority}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="px-1.5 py-0.5 rounded text-xs bg-emerald-900/30 text-emerald-400">
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
