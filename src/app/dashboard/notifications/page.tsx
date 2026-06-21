"use client";

import { useState, useEffect } from "react";
import { Bell, CheckCircle, AlertTriangle, Info, XCircle, Shield } from "lucide-react";

interface Notification {
  id: string;
  category: string;
  priority: string;
  title: string;
  summary: string;
  description: string;
  subsystem: string;
  market: string | null;
  action_required: boolean;
  status: string;
  created_at: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/notifications");
    const data = await res.json();
    setNotifications(data.notifications || []);
    setUnread(data.unread || 0);
    setLoading(false);
  }

  async function acknowledge(id: string) {
    await fetch("/api/notifications", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "acknowledged" }),
    });
    load();
  }

  const priorityIcon: Record<string, any> = {
    critical: XCircle,
    high: AlertTriangle,
    medium: Bell,
    low: Info,
    info: Info,
  };
  const priorityColor: Record<string, string> = {
    critical: "text-red-400 bg-red-900/20 border-red-800",
    high: "text-amber-400 bg-amber-900/20 border-amber-800",
    medium: "text-blue-400 bg-blue-900/20 border-blue-800",
    low: "text-zinc-400 bg-zinc-800 border-zinc-700",
    info: "text-zinc-400 bg-zinc-800 border-zinc-700",
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-zinc-400 text-sm">
            {unread > 0 ? `${unread} unread` : "All caught up"}
          </p>
        </div>
      </div>

      {loading ? <p className="text-zinc-500">Loading...</p> : notifications.length === 0 ? (
        <div className="text-center py-12 text-zinc-500">
          <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => {
            const Icon = priorityIcon[n.priority] || Bell;
            const color = priorityColor[n.priority] || priorityColor.low;
            const isUnread = n.status !== "acknowledged" && n.status !== "archived";
            return (
              <div key={n.id} className={`rounded-lg border p-4 ${color} ${isUnread ? "opacity-100" : "opacity-60"}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <Icon className="h-4 w-4 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">{n.title}</p>
                      <p className="text-xs opacity-80 mt-0.5">{n.summary}</p>
                      <div className="flex gap-2 mt-2 text-xs opacity-60">
                        <span>{n.subsystem}</span>
                        {n.market && <><span>•</span><span>{n.market}</span></>}
                        <span>•</span>
                        <span>{new Date(n.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  {isUnread && (
                    <button onClick={() => acknowledge(n.id)}
                      className="px-2 py-1 bg-zinc-700 hover:bg-zinc-600 rounded text-xs">
                      Dismiss
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
