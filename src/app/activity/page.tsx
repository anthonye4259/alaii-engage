"use client";

import { useState } from "react";

interface ActivityItem {
  id: string;
  platform: string;
  action: string;
  target: string;
  detail: string;
  time: string;
  color: string;
  ruleName: string;
}

const allActivity: ActivityItem[] = [
  { id: "1", platform: "instagram", action: "Commented on", target: "@fitnessstudio's post", detail: "\"Great transformation! Keep up the amazing work! 🔥\"", time: "2m ago", color: "#e1306c", ruleName: "Comment on hashtags" },
  { id: "2", platform: "linkedin", action: "Liked", target: "12 posts matching #smallbusiness", detail: "", time: "5m ago", color: "#0a66c2", ruleName: "Like mentions" },
  { id: "3", platform: "tiktok", action: "Replied to", target: "comment by @clientjane", detail: "\"Thanks for visiting! Can't wait to see you again 💈\"", time: "12m ago", color: "#00f2ea", ruleName: "Auto-reply to comments" },
  { id: "4", platform: "instagram", action: "Sent DM to", target: "@newlead", detail: "\"Hey! Thanks for following Mike's Barbershop! We'd love to...\"", time: "18m ago", color: "#e1306c", ruleName: "DM new followers" },
  { id: "5", platform: "facebook", action: "Reposted", target: "customer testimonial", detail: "Shared 5-star review from Sarah M.", time: "24m ago", color: "#1877f2", ruleName: "Repost testimonials" },
  { id: "6", platform: "linkedin", action: "Commented on", target: "@marketingguru's article", detail: "\"Really insightful take on AI in small business marketing!\"", time: "35m ago", color: "#0a66c2", ruleName: "Comment on hashtags" },
  { id: "7", platform: "tiktok", action: "Liked", target: "8 posts matching #barbershoptok", detail: "", time: "42m ago", color: "#00f2ea", ruleName: "Like mentions" },
  { id: "8", platform: "instagram", action: "Replied to", target: "comment by @regularclient", detail: "\"See you next Thursday! Same time works perfectly 🙌\"", time: "1h ago", color: "#e1306c", ruleName: "Auto-reply to comments" },
  { id: "9", platform: "linkedin", action: "Liked", target: "post by @bizconsultant", detail: "", time: "1h ago", color: "#0a66c2", ruleName: "Like mentions" },
  { id: "10", platform: "instagram", action: "Commented on", target: "@localbusiness's grand opening post", detail: "\"Congrats on the opening! Love seeing new businesses in the area! 🎉\"", time: "2h ago", color: "#e1306c", ruleName: "Comment on hashtags" },
  { id: "11", platform: "facebook", action: "Replied to", target: "question on your page", detail: "\"Yes we're open until 8pm on Fridays! Book online anytime.\"", time: "2h ago", color: "#1877f2", ruleName: "Auto-reply to comments" },
  { id: "12", platform: "tiktok", action: "Replied to", target: "comment by @tiktokuser123", detail: "\"Thanks! We use a combination of fading techniques...\"", time: "3h ago", color: "#00f2ea", ruleName: "Auto-reply to comments" },
];

const filters = ["All", "Instagram", "TikTok", "LinkedIn", "Facebook"];

export default function ActivityPage() {
  const [activeFilter, setActiveFilter] = useState("All");

  const filtered = activeFilter === "All"
    ? allActivity
    : allActivity.filter(a => a.platform.toLowerCase() === activeFilter.toLowerCase());

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Activity</h1>
        <p className="text-text-secondary text-sm mt-1">Everything your AI engagement agent has done</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {filters.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              activeFilter === filter
                ? "bg-accent text-white"
                : "bg-card border border-border text-text-secondary hover:text-text-primary hover:border-border-hover"
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Activity List */}
      <div className="bg-card border border-border rounded-2xl divide-y divide-border">
        {filtered.map((item) => (
          <div key={item.id} className="p-5 hover:bg-surface-hover transition-colors">
            <div className="flex items-start gap-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold shrink-0"
                style={{ backgroundColor: item.color + "15", color: item.color }}
              >
                {item.platform === "instagram" ? "IG" : item.platform === "tiktok" ? "TK" : item.platform === "linkedin" ? "LI" : "FB"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text-primary">
                  <span className="font-medium">{item.action}</span>{" "}
                  <span className="text-text-secondary">{item.target}</span>
                </p>
                {item.detail && (
                  <p className="text-sm text-text-muted mt-1">{item.detail}</p>
                )}
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs text-text-muted">{item.time}</span>
                  <span className="text-xs text-text-muted">·</span>
                  <span className="text-xs text-accent">{item.ruleName}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
