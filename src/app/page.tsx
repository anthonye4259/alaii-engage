"use client";

import { useAuth } from "@/components/AuthProvider";

const stats = [
  { label: "Total Engagements", value: "1,247", change: "+18%", up: true },
  { label: "Comments", value: "342", change: "+24%", up: true },
  { label: "Likes", value: "589", change: "+12%", up: true },
  { label: "Replies", value: "198", change: "+31%", up: true },
  { label: "DMs Sent", value: "118", change: "-5%", up: false },
];

const recentActivity = [
  { platform: "instagram", action: "Commented on", target: "@fitnessstudio's post", detail: "\"Great transformation! 🔥\"", time: "2m ago", color: "#e1306c" },
  { platform: "linkedin", action: "Liked", target: "12 posts matching #smallbusiness", detail: "", time: "5m ago", color: "#0a66c2" },
  { platform: "tiktok", action: "Replied to", target: "3 comments on your latest reel", detail: "Personalized responses sent", time: "12m ago", color: "#00f2ea" },
  { platform: "instagram", action: "Sent DM to", target: "@newlead", detail: "\"Hey! Thanks for following...\"", time: "18m ago", color: "#e1306c" },
  { platform: "facebook", action: "Reposted", target: "customer testimonial from Mike's Barbershop", detail: "", time: "24m ago", color: "#1877f2" },
  { platform: "linkedin", action: "Commented on", target: "@marketingguru's article", detail: "\"Insightful take on AI marketing!\"", time: "35m ago", color: "#0a66c2" },
  { platform: "tiktok", action: "Liked", target: "8 posts matching #barbershoptok", detail: "", time: "42m ago", color: "#00f2ea" },
];

const activeRules = [
  { name: "Auto-reply to comments", platform: "All", engagements: 89, status: "active" },
  { name: "Like mentions", platform: "Instagram, LinkedIn", engagements: 142, status: "active" },
  { name: "Comment on hashtags", platform: "TikTok, Instagram", engagements: 67, status: "active" },
  { name: "DM new followers", platform: "Instagram", engagements: 34, status: "paused" },
];

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
        <a
          href="/accounts"
          className="px-6 py-3 bg-gradient-to-r from-primary to-accent text-white rounded-xl text-sm font-semibold shadow-lg shadow-primary/20 hover:shadow-xl transition-all"
        >
          Connect your first account →
        </a>
        <a
          href="/chat"
          className="px-6 py-3 border border-border text-text-secondary rounded-xl text-sm font-medium hover:border-primary hover:text-primary transition-all"
        >
          Teach your AI
        </a>
      </div>

      {/* Quick tips */}
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

export default function HomePage() {
  const { user } = useAuth();
  const isNewUser = user?.plan === "free"; // Simple heuristic — adjust with real data later

  if (isNewUser) {
    return <EmptyState />;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
        <p className="text-text-secondary text-sm mt-1">Your engagement automation at a glance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-5 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-card border border-border rounded-2xl p-5 hover:border-border-hover transition-colors">
            <p className="text-text-secondary text-xs font-medium mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-text-primary">{stat.value}</p>
            <span className={`text-xs font-medium ${stat.up ? "text-success" : "text-error"}`}>
              {stat.change} this week
            </span>
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
          <div className="space-y-4">
            {recentActivity.map((item, i) => (
              <div key={i} className="flex items-start gap-3 pb-4 border-b border-border last:border-0 last:pb-0">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5"
                  style={{ backgroundColor: item.color + "20", color: item.color }}
                >
                  {item.platform === "instagram" ? "IG" : item.platform === "tiktok" ? "TK" : item.platform === "linkedin" ? "LI" : "FB"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary">
                    <span className="font-medium">{item.action}</span>{" "}
                    <span className="text-text-secondary">{item.target}</span>
                  </p>
                  {item.detail && (
                    <p className="text-xs text-text-muted mt-0.5 truncate">{item.detail}</p>
                  )}
                </div>
                <span className="text-xs text-text-muted shrink-0">{item.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Active Rules */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-text-primary">Active Rules</h2>
            <a href="/rules" className="text-xs text-accent font-medium hover:text-accent-hover">Manage →</a>
          </div>
          <div className="space-y-4">
            {activeRules.map((rule, i) => (
              <div key={i} className="pb-4 border-b border-border last:border-0 last:pb-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-text-primary">{rule.name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    rule.status === "active"
                      ? "bg-success/10 text-success"
                      : "bg-warning/10 text-warning"
                  }`}>
                    {rule.status}
                  </span>
                </div>
                <p className="text-xs text-text-muted mt-1">{rule.platform}</p>
                <p className="text-xs text-text-secondary mt-1">{rule.engagements} engagements this week</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
