"use client";

import { useState, useEffect, useCallback } from "react";

interface Rule {
  id: string;
  name: string;
  description: string;
  platforms: string[];
  enabled: boolean;
  category: string;
}

const defaultRules: Rule[] = [
  { id: "auto-reply", name: "Auto-reply to comments", description: "Automatically reply to comments on your posts with personalized, AI-generated responses", platforms: ["Instagram", "TikTok", "LinkedIn", "Facebook"], enabled: true, category: "Engagement" },
  { id: "like-mentions", name: "Like mentions", description: "Automatically like posts that mention or tag your account", platforms: ["Instagram", "LinkedIn", "Facebook"], enabled: true, category: "Engagement" },
  { id: "dm-followers", name: "DM new followers", description: "Send a personalized welcome message to new followers", platforms: ["Instagram"], enabled: false, category: "Outreach" },
  { id: "hashtag-engage", name: "Comment on hashtags", description: "Engage with posts matching your target hashtags with thoughtful comments", platforms: ["Instagram", "TikTok"], enabled: false, category: "Growth" },
  { id: "repost-testimonials", name: "Repost testimonials", description: "Automatically share customer testimonials and positive mentions", platforms: ["LinkedIn", "Facebook"], enabled: true, category: "Social Proof" },
  { id: "reply-dms", name: "Auto-reply to DMs", description: "Send intelligent auto-replies to incoming direct messages", platforms: ["Instagram", "Facebook"], enabled: false, category: "Outreach" },
];

const platformColors: Record<string, string> = {
  Instagram: "#e1306c", TikTok: "#00f2ea", LinkedIn: "#0a66c2", Facebook: "#1877f2",
};

export default function RulesPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [saving, setSaving] = useState<string | null>(null);

  // Load saved rules from API or use defaults
  const loadRules = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        const savedRules = data.user?.rules;
        if (savedRules && Array.isArray(savedRules)) {
          setRules(savedRules);
          return;
        }
      }
    } catch {}
    setRules(defaultRules);
  }, []);

  useEffect(() => {
    loadRules();
  }, [loadRules]);

  const toggleRule = async (id: string) => {
    const updated = rules.map((r) => r.id === id ? { ...r, enabled: !r.enabled } : r);
    setRules(updated);
    setSaving(id);

    try {
      await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rules: updated }),
      });
    } catch {}
    setTimeout(() => setSaving(null), 500);
  };

  const enabledCount = rules.filter((r) => r.enabled).length;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Engagement Rules</h1>
          <p className="text-text-secondary text-sm mt-1">
            {enabledCount} of {rules.length} rules active — AI handles the rest
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className={`bg-card border rounded-2xl p-6 transition-all duration-200 ${
              rule.enabled ? "border-primary/30" : "border-border hover:border-border-hover"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-text-primary font-semibold">{rule.name}</h3>
                  <span className="text-xs font-medium text-text-muted bg-surface px-2 py-0.5 rounded-full">
                    {rule.category}
                  </span>
                  {saving === rule.id && (
                    <span className="text-xs text-success animate-fade-in">✓ saved</span>
                  )}
                </div>
                <p className="text-text-secondary text-sm mt-1.5">{rule.description}</p>
                <div className="flex items-center gap-2 mt-3">
                  {rule.platforms.map((p) => (
                    <span
                      key={p}
                      className="text-xs font-medium px-2 py-1 rounded-lg"
                      style={{ backgroundColor: (platformColors[p] || "#64748B") + "15", color: platformColors[p] || "#64748B" }}
                    >
                      {p}
                    </span>
                  ))}
                </div>
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
