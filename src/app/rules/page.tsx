"use client";

import { useState } from "react";

interface Rule {
  id: string;
  name: string;
  description: string;
  platforms: string[];
  enabled: boolean;
  engagements: number;
  category: string;
}

const defaultRules: Rule[] = [
  {
    id: "auto-reply",
    name: "Auto-reply to comments",
    description: "Automatically reply to comments on your posts with personalized, AI-generated responses",
    platforms: ["Instagram", "TikTok", "LinkedIn", "Facebook"],
    enabled: true,
    engagements: 89,
    category: "Engagement",
  },
  {
    id: "like-mentions",
    name: "Like mentions",
    description: "Automatically like posts that mention or tag your account",
    platforms: ["Instagram", "LinkedIn", "Facebook"],
    enabled: true,
    engagements: 142,
    category: "Engagement",
  },
  {
    id: "dm-followers",
    name: "DM new followers",
    description: "Send a personalized welcome message to new followers",
    platforms: ["Instagram"],
    enabled: false,
    engagements: 34,
    category: "Outreach",
  },
  {
    id: "hashtag-engage",
    name: "Comment on hashtags",
    description: "Engage with posts matching your target hashtags with thoughtful comments",
    platforms: ["Instagram", "TikTok"],
    enabled: false,
    engagements: 67,
    category: "Growth",
  },
  {
    id: "repost-testimonials",
    name: "Repost testimonials",
    description: "Automatically share customer testimonials and positive mentions",
    platforms: ["LinkedIn", "Facebook"],
    enabled: true,
    engagements: 23,
    category: "Social Proof",
  },
  {
    id: "reply-dms",
    name: "Auto-reply to DMs",
    description: "Send intelligent auto-replies to incoming direct messages",
    platforms: ["Instagram", "Facebook"],
    enabled: false,
    engagements: 0,
    category: "Outreach",
  },
];

const platformColors: Record<string, string> = {
  Instagram: "#e1306c",
  TikTok: "#00f2ea",
  LinkedIn: "#0a66c2",
  Facebook: "#1877f2",
};

export default function RulesPage() {
  const [rules, setRules] = useState(defaultRules);

  const toggleRule = (id: string) => {
    setRules(rules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Engagement Rules</h1>
          <p className="text-text-secondary text-sm mt-1">Toggle automations on and off — AI handles the rest</p>
        </div>
        <button className="bg-accent hover:bg-accent-hover text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2">
          <span className="text-lg">+</span> Add Rule
        </button>
      </div>

      <div className="space-y-4">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className={`bg-card border rounded-2xl p-6 transition-all duration-200 ${
              rule.enabled ? "border-accent/30" : "border-border hover:border-border-hover"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-text-primary font-semibold">{rule.name}</h3>
                  <span className="text-xs font-medium text-text-muted bg-surface px-2 py-0.5 rounded-full">
                    {rule.category}
                  </span>
                </div>
                <p className="text-text-secondary text-sm mt-1.5">{rule.description}</p>
                <div className="flex items-center gap-2 mt-3">
                  {rule.platforms.map((p) => (
                    <span
                      key={p}
                      className="text-xs font-medium px-2 py-1 rounded-lg"
                      style={{ backgroundColor: platformColors[p] + "15", color: platformColors[p] }}
                    >
                      {p}
                    </span>
                  ))}
                </div>
                {rule.enabled && rule.engagements > 0 && (
                  <p className="text-xs text-text-muted mt-3">{rule.engagements} engagements this week</p>
                )}
              </div>
              <button
                onClick={() => toggleRule(rule.id)}
                className={`toggle-switch shrink-0 mt-1 ${rule.enabled ? "active" : ""}`}
                aria-label={`Toggle ${rule.name}`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
