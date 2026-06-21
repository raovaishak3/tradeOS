import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Trading Brain OS</h1>
          <p className="text-zinc-400 text-lg">
            Cognitive Trading System
          </p>
        </div>
        <div className="flex gap-4 justify-center">
          <Link
            href="/dashboard"
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-medium transition-colors"
          >
            Open Dashboard
          </Link>
          <Link
            href="/dashboard/knowledge"
            className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-medium transition-colors"
          >
            Knowledge Core
          </Link>
        </div>
        <p className="text-zinc-500 text-sm max-w-md mx-auto">
          An AI that does not merely read a Trading Bible but becomes it.
        </p>
      </div>
    </div>
  );
}
