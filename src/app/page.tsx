"use client";

import { useState } from "react";

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

export default function HomePage() {
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
          <div key={stat.label} className="bg-bg-card border border-border rounded-2xl p-5 hover:border-border-hover transition-colors">
            <p className="text-text-secondary text-xs font-medium mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-text-primary">{stat.value}</p>
            <span className={`text-xs font-medium ${stat.up ? "text-success" : "text-danger"}`}>
              {stat.change} this week
            </span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Activity Feed */}
        <div className="col-span-2 bg-bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-text-primary">Recent Activity</h2>
            <span className="text-xs text-accent font-medium cursor-pointer hover:text-accent-hover">View all →</span>
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
        <div className="bg-bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-text-primary">Active Rules</h2>
            <span className="text-xs text-accent font-medium cursor-pointer hover:text-accent-hover">Manage →</span>
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
