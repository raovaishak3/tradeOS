import Link from "next/link";
import {
  Brain,
  BarChart3,
  Target,
  Bell,
  BookOpen,
  Activity,
  Shield,
  Settings,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: Activity },
  { href: "/dashboard/watchlist", label: "Watchlist", icon: Target },
  { href: "/dashboard/knowledge", label: "Knowledge", icon: BookOpen },
  { href: "/dashboard/brain", label: "Brain", icon: Brain },
  { href: "/dashboard/performance", label: "Performance", icon: BarChart3 },
  { href: "/dashboard/notifications", label: "Alerts", icon: Bell },
  { href: "/dashboard/governance", label: "Governance", icon: Shield },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col">
        <div className="p-4 border-b border-zinc-800">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-emerald-500" />
            <span className="font-bold text-lg">Trading Brain</span>
          </Link>
          <p className="text-xs text-zinc-500 mt-1">v0.1.0 · Draft</p>
        </div>

        <nav className="flex-1 p-2 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs text-zinc-500">System Online</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
