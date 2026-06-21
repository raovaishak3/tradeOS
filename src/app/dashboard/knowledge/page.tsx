import { BookOpen, Database, GitBranch, Layers } from "lucide-react";

export default function KnowledgePage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Knowledge Core</h1>
        <p className="text-zinc-400 text-sm">
          The permanent knowledge base — your Trading Bible compiled into machine reasoning
        </p>
      </div>

      {/* Knowledge Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-4">
          <div className="flex items-center gap-2 text-zinc-400 mb-2">
            <BookOpen className="h-4 w-4" />
            <span className="text-sm">Concepts</span>
          </div>
          <p className="text-2xl font-bold">0</p>
          <p className="text-xs text-zinc-500">across 19 domains</p>
        </div>
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-4">
          <div className="flex items-center gap-2 text-zinc-400 mb-2">
            <Layers className="h-4 w-4" />
            <span className="text-sm">Rules</span>
          </div>
          <p className="text-2xl font-bold">0</p>
          <p className="text-xs text-zinc-500">deterministic logic</p>
        </div>
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-4">
          <div className="flex items-center gap-2 text-zinc-400 mb-2">
            <GitBranch className="h-4 w-4" />
            <span className="text-sm">Relationships</span>
          </div>
          <p className="text-2xl font-bold">0</p>
          <p className="text-xs text-zinc-500">graph edges</p>
        </div>
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-4">
          <div className="flex items-center gap-2 text-zinc-400 mb-2">
            <Database className="h-4 w-4" />
            <span className="text-sm">Coverage</span>
          </div>
          <p className="text-2xl font-bold">0%</p>
          <p className="text-xs text-zinc-500">production threshold: 95%</p>
        </div>
      </div>

      {/* Domain Grid */}
      <div>
        <h2 className="font-semibold mb-3">Knowledge Domains</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {domains.map((domain) => (
            <div
              key={domain.name}
              className="bg-zinc-900 rounded-lg border border-zinc-800 p-4 hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-sm">{domain.displayName}</h3>
                <span className="text-xs text-zinc-500">L{domain.level}</span>
              </div>
              <p className="text-xs text-zinc-500 mb-3">{domain.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">0 concepts</span>
                <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: "0%" }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Import CTA */}
      <div className="bg-zinc-900 rounded-lg border border-zinc-800 border-dashed p-8 text-center">
        <BookOpen className="h-8 w-8 text-zinc-600 mx-auto mb-3" />
        <h3 className="font-medium mb-1">Import Trading Bible</h3>
        <p className="text-sm text-zinc-500 mb-4">
          Upload your methodology documents to compile the Knowledge Core
        </p>
        <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-md text-sm font-medium transition-colors">
          Import Knowledge
        </button>
      </div>
    </div>
  );
}

const domains = [
  { name: "foundations", displayName: "Foundations", level: 1, description: "Price, participants, auctions, order flow" },
  { name: "market_structure", displayName: "Market Structure", level: 2, description: "Trend, swings, BOS, CHOCH, MSS" },
  { name: "liquidity", displayName: "Liquidity", level: 3, description: "Pools, sweeps, engineering, narratives" },
  { name: "order_flow", displayName: "Order Flow", level: 2, description: "Institutional order flow analysis" },
  { name: "institutional_behaviour", displayName: "Institutional Behaviour", level: 3, description: "Institutional execution patterns" },
  { name: "aois", displayName: "Areas of Interest", level: 4, description: "OBs, FVGs, breakers, supply/demand" },
  { name: "confirmation", displayName: "Confirmation", level: 5, description: "Signals and sequences" },
  { name: "entry", displayName: "Entry", level: 6, description: "Execution and precision" },
  { name: "trade_management", displayName: "Trade Management", level: 6, description: "Stops, partials, scaling" },
  { name: "exit", displayName: "Exit", level: 6, description: "Exit strategies" },
  { name: "risk", displayName: "Risk", level: 5, description: "Position sizing and limits" },
  { name: "portfolio", displayName: "Portfolio", level: 5, description: "Exposure and correlation" },
  { name: "macro", displayName: "Macro", level: 1, description: "World knowledge and economics" },
  { name: "sessions", displayName: "Sessions", level: 2, description: "Trading session behaviour" },
  { name: "psychology", displayName: "Psychology", level: 1, description: "Discipline and mindset" },
  { name: "execution", displayName: "Execution", level: 6, description: "Trade execution mechanics" },
  { name: "governance", displayName: "Governance", level: 0, description: "Safety and validation" },
  { name: "learning", displayName: "Learning", level: 7, description: "Improvement and evolution" },
  { name: "experience", displayName: "Experience", level: 7, description: "Memory and retrieval" },
];
