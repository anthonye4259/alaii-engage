"use client";

import { useState, useEffect, useCallback } from "react";

interface ActivityItem {
  id: string;
  platform: string;
  action: string;
  target: string;
  detail: string;
  timestamp: string;
}

const platformColors: Record<string, string> = {
  instagram: "#e1306c",
  tiktok: "#00f2ea",
  linkedin: "#0a66c2",
  facebook: "#1877f2",
  x: "#000000",
  reddit: "#ff4500",
};

const platformLabels: Record<string, string> = {
  instagram: "IG",
  tiktok: "TK",
  linkedin: "LI",
  facebook: "FB",
  x: "X",
  reddit: "RD",
};

const filters = ["All", "Instagram", "TikTok", "LinkedIn", "Facebook", "X", "Reddit"];

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function ActivityPage() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{ total: number; today: number; thisWeek: number } | null>(null);

  const fetchActivity = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard");
      if (res.ok) {
        const data = await res.json();
        setActivity(data.recentActivity || []);
        setStats(data.stats || null);
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  const filtered = activeFilter === "All"
    ? activity
    : activity.filter((a) => a.platform.toLowerCase() === activeFilter.toLowerCase());

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Activity</h1>
        <p className="text-text-secondary text-sm mt-1">Everything your AI engagement agent has done</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Total engagements" value={stats.total} />
          <StatCard label="Today" value={stats.today} />
          <StatCard label="This week" value={stats.thisWeek} />
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {filters.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              activeFilter === filter
                ? "bg-primary text-white"
                : "bg-card border border-border text-text-secondary hover:text-text-primary hover:border-border-hover"
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Activity List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center">
          <p className="text-3xl mb-3">🤖</p>
          <p className="text-text-primary font-medium">No activity yet</p>
          <p className="text-text-muted text-sm mt-1">
            Connect an account and enable some rules — your agent will start engaging automatically.
          </p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl divide-y divide-border">
          {filtered.map((item) => {
            const color = platformColors[item.platform] || "#64748B";
            return (
              <div key={item.id} className="p-5 hover:bg-surface-hover transition-colors">
                <div className="flex items-start gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ backgroundColor: color + "15", color }}
                  >
                    {platformLabels[item.platform] || item.platform.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary">
                      <span className="font-medium capitalize">{item.action}</span>{" "}
                      <span className="text-text-secondary">{item.target}</span>
                    </p>
                    {item.detail && (
                      <p className="text-sm text-text-muted mt-1 truncate">&quot;{item.detail}&quot;</p>
                    )}
                    <span className="text-xs text-text-muted mt-2 inline-block">{timeAgo(item.timestamp)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 text-center">
      <p className="text-2xl font-bold text-text-primary">{value.toLocaleString()}</p>
      <p className="text-xs text-text-muted mt-1">{label}</p>
    </div>
  );
}
