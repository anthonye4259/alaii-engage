"use client";

import { useAuth } from "@/components/AuthProvider";
import { useState, useEffect } from "react";

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

const actionLabels: Record<string, string> = {
  comment_reply: "Replied to",
  hashtag_comment: "Commented on",
  like: "Liked",
  dm_welcome: "Sent DM to",
  dm_outreach: "Sent outreach DM to",
  repost: "Reposted",
};

interface DashboardData {
  stats: {
    total: number;
    today: number;
    thisWeek: number;
    byAction: Record<string, number>;
    byPlatform: Record<string, number>;
  };
  activity: Array<{
    id: string;
    platform: string;
    action: string;
    target: string;
    detail: string;
    timestamp: string;
  }>;
}

function EmptyState() {
  return (
    <div className="max-w-2xl mx-auto text-center py-20">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 mx-auto flex items-center justify-center mb-6">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4A9FD4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-text-primary mb-2">Your agent is ready</h2>
      <p className="text-text-secondary text-sm mb-8 max-w-md mx-auto">
        Connect a social account and set up engagement rules to start automating. Your AI agent will begin engaging within minutes.
      </p>
      <div className="flex items-center justify-center gap-4">
        <a href="/accounts" className="px-6 py-3 bg-gradient-to-r from-primary to-accent text-white rounded-xl text-sm font-semibold shadow-lg shadow-primary/20 hover:shadow-xl transition-all">
          Connect your first account →
        </a>
        <a href="/chat" className="px-6 py-3 border border-border text-text-secondary rounded-xl text-sm font-medium hover:border-primary hover:text-primary transition-all">
          Teach your AI
        </a>
      </div>
      <div className="mt-12 grid grid-cols-3 gap-4 text-left">
        {[
          { icon: "🎯", title: "Connect accounts", desc: "Link Instagram, TikTok, X, LinkedIn, Reddit, or Facebook" },
          { icon: "🤖", title: "Teach your AI", desc: "Tell your agent about your business, tone, and audience" },
          { icon: "⚡", title: "Set rules", desc: "Choose which actions to automate — comments, likes, DMs" },
        ].map((tip) => (
          <div key={tip.title} className="bg-card border border-border rounded-2xl p-5 hover:border-border-hover transition-colors">
            <span className="text-2xl">{tip.icon}</span>
            <h3 className="text-sm font-semibold text-text-primary mt-3 mb-1">{tip.title}</h3>
            <p className="text-xs text-text-muted">{tip.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function timeAgo(timestamp: string): string {
  const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function HomePage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) {
    return <EmptyState />;
  }

  // Paywall — free users must subscribe
  if (user.plan === "free") {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 mx-auto flex items-center justify-center mb-6">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4A9FD4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">Choose a plan to get started</h2>
        <p className="text-text-secondary text-sm mb-8 max-w-md mx-auto">
          Subscribe to unlock AI-powered engagement automation across Instagram, TikTok, X, LinkedIn, Reddit, and Facebook.
        </p>
        <a href="/pricing" className="inline-block px-8 py-3.5 bg-gradient-to-r from-primary to-accent text-white rounded-xl text-sm font-semibold shadow-lg shadow-primary/20 hover:shadow-xl transition-all">
          View Plans & Subscribe →
        </a>
        <p className="text-text-muted text-xs mt-6">All plans include a 7-day free trial. Cancel anytime.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const stats = data?.stats || { total: 0, today: 0, thisWeek: 0, byAction: {}, byPlatform: {} };
  const activity = data?.activity || [];

  const statCards = [
    { label: "Total Engagements", value: stats.total.toLocaleString() },
    { label: "Today", value: stats.today.toLocaleString() },
    { label: "This Week", value: stats.thisWeek.toLocaleString() },
    { label: "Comments", value: ((stats.byAction.comment_reply || 0) + (stats.byAction.hashtag_comment || 0)).toLocaleString() },
    { label: "DMs Sent", value: ((stats.byAction.dm_welcome || 0) + (stats.byAction.dm_outreach || 0)).toLocaleString() },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
        <p className="text-text-secondary text-sm mt-1">Your engagement automation at a glance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-5 gap-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-card border border-border rounded-2xl p-5 hover:border-border-hover transition-colors">
            <p className="text-text-secondary text-xs font-medium mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-text-primary">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Activity Feed */}
        <div className="col-span-2 bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-text-primary">Recent Activity</h2>
            <a href="/activity" className="text-xs text-accent font-medium hover:text-accent-hover">View all →</a>
          </div>

          {activity.length === 0 ? (
            <p className="text-text-muted text-sm py-8 text-center">No engagement activity yet. Connect an account to get started.</p>
          ) : (
            <div className="space-y-4">
              {activity.map((item) => (
                <div key={item.id} className="flex items-start gap-3 pb-4 border-b border-border last:border-0 last:pb-0">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                    style={{
                      backgroundColor: (platformColors[item.platform] || "#888") + "20",
                      color: platformColors[item.platform] || "#888",
                    }}
                  >
                    {platformLabels[item.platform] || item.platform.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary">
                      <span className="font-medium">{actionLabels[item.action] || item.action}</span>{" "}
                      <span className="text-text-secondary">{item.target}</span>
                    </p>
                    {item.detail && (
                      <p className="text-xs text-text-muted mt-0.5 truncate">{item.detail}</p>
                    )}
                  </div>
                  <span className="text-xs text-text-muted shrink-0">{timeAgo(item.timestamp)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Platform breakdown */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-5">By Platform</h2>
          {Object.keys(stats.byPlatform).length === 0 ? (
            <p className="text-text-muted text-sm py-8 text-center">No data yet</p>
          ) : (
            <div className="space-y-4">
              {Object.entries(stats.byPlatform).sort(([, a], [, b]) => b - a).map(([platform, count]) => (
                <div key={platform} className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                    style={{
                      backgroundColor: (platformColors[platform] || "#888") + "20",
                      color: platformColors[platform] || "#888",
                    }}
                  >
                    {platformLabels[platform] || platform.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <p className="text-sm font-medium text-text-primary capitalize">{platform}</p>
                      <p className="text-sm text-text-secondary">{count}</p>
                    </div>
                    <div className="w-full bg-surface rounded-full h-1.5 mt-1.5">
                      <div
                        className="h-1.5 rounded-full"
                        style={{
                          width: `${Math.min(100, (count / stats.total) * 100)}%`,
                          backgroundColor: platformColors[platform] || "#888",
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
