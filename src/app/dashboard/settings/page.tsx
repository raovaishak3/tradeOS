"use client";

import { useState, useEffect } from "react";
import { Settings, Key, Plug, Shield, TrendingUp } from "lucide-react";

interface Setting {
  id: string;
  key: string;
  value: string;
  description: string;
  category: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});

  useEffect(() => { loadSettings(); }, []);

  async function loadSettings() {
    const res = await fetch("/api/settings");
    const data = await res.json();
    setSettings(data.settings || []);
    const vals: Record<string, string> = {};
    (data.settings || []).forEach((s: Setting) => { vals[s.key] = s.value; });
    setEditValues(vals);
    setLoading(false);
  }

  async function saveSetting(key: string) {
    setSaving(key);
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value: editValues[key] }),
    });
    setSaving(null);
    loadSettings();
  }

  const categories = [
    { key: "ai", label: "AI & LLM", icon: Key, description: "Configure your language model for reasoning" },
    { key: "integrations", label: "Integrations", icon: Plug, description: "Connect TradingView and MT5" },
    { key: "risk", label: "Risk Management", icon: Shield, description: "Set risk limits and rules" },
    { key: "trading", label: "Trading", icon: TrendingUp, description: "Trading preferences" },
  ];

  if (loading) return <div className="p-6 text-zinc-400">Loading settings...</div>;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-zinc-400 text-sm">Configure your Trading Brain</p>
      </div>

      {categories.map(cat => {
        const catSettings = settings.filter(s => s.category === cat.key);
        if (catSettings.length === 0) return null;
        return (
          <div key={cat.key} className="bg-zinc-900 rounded-lg border border-zinc-800 p-5">
            <div className="flex items-center gap-3 mb-4">
              <cat.icon className="h-5 w-5 text-emerald-500" />
              <div>
                <h2 className="font-semibold">{cat.label}</h2>
                <p className="text-xs text-zinc-500">{cat.description}</p>
              </div>
            </div>
            <div className="space-y-4">
              {catSettings.map(s => (
                <div key={s.key} className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="text-sm text-zinc-300 block mb-1">{s.description || s.key}</label>
                    <input
                      type={s.key.includes("api_key") ? "password" : "text"}
                      value={editValues[s.key] || ""}
                      onChange={e => setEditValues({ ...editValues, [s.key]: e.target.value })}
                      placeholder={s.key.includes("api_key") ? "Enter API key..." : "Enter value..."}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <button
                    onClick={() => saveSetting(s.key)}
                    disabled={saving === s.key}
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-md text-xs font-medium mt-5"
                  >
                    {saving === s.key ? "Saving..." : "Save"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
