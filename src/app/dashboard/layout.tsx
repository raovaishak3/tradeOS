"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Brain,
  BarChart3,
  Target,
  Bell,
  BookOpen,
  Activity,
  Shield,
  Settings,
  Zap,
  History,
  Briefcase,
  Menu,
  X,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: Activity },
  { href: "/dashboard/analyze", label: "Analyze", icon: Zap },
  { href: "/dashboard/trades", label: "Trades", icon: Briefcase },
  { href: "/dashboard/watchlist", label: "Watchlist", icon: Target },
  { href: "/dashboard/history", label: "History", icon: History },
  { href: "/dashboard/knowledge", label: "Knowledge", icon: BookOpen },
  { href: "/dashboard/brain", label: "Brain", icon: Brain },
  { href: "/dashboard/performance", label: "Performance", icon: BarChart3 },
  { href: "/dashboard/notifications", label: "Alerts", icon: Bell },
  { href: "/dashboard/governance", label: "Governance", icon: Shield },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 bg-zinc-900 border-b border-zinc-800">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-emerald-500" />
          <span className="font-bold">Trading Brain</span>
        </Link>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-md hover:bg-zinc-800">
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* Mobile Nav Overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-zinc-950/90" onClick={() => setSidebarOpen(false)}>
          <nav className="w-64 h-full bg-zinc-900 border-r border-zinc-800 p-4 space-y-1" onClick={e => e.stopPropagation()}>
            <div className="pb-3 mb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-emerald-500" />
                <span className="font-bold">Trading Brain</span>
              </div>
            </div>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
                  pathname === item.href ? "bg-zinc-800 text-emerald-400" : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-zinc-900 border-r border-zinc-800 flex-col shrink-0">
        <div className="p-4 border-b border-zinc-800">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-emerald-500" />
            <span className="font-bold text-lg">Trading Brain</span>
          </Link>
          <p className="text-xs text-zinc-500 mt-1">v0.1.0 · Draft</p>
        </div>

        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                pathname === item.href ? "bg-zinc-800 text-emerald-400" : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-zinc-500">System Online</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto min-h-0">
        {children}
      </main>
    </div>
  );
}
