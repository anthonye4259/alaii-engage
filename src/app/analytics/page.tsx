"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";

interface Insights {
  totalTracked: number;
  avgEngagement: number;
  bestTone: { tone: string; avgEngagement: number } | null;
  bestLength: { range: string; avgEngagement: number } | null;
  bestPlatform: { platform: string; avgEngagement: number } | null;
  bestTimeOfDay: { hour: number; avgEngagement: number } | null;
  questionBoost: number;
  emojiBoost: number;
  ctaBoost: number;
  topComments: { content: string; platform: string; engagement: number }[];
  promptGuidance: string;
}

const toneEmoji: Record<string, string> = {
  helpful: "🧠", witty: "😏", empathetic: "💛", professional: "👔",
  casual: "😎", enthusiastic: "🔥", contrarian: "🤔",
};

const platformColors: Record<string, string> = {
  reddit: "#FF4500", x: "#1DA1F2", instagram: "#E4405F",
  facebook: "#1877F2", linkedin: "#0A66C2", tiktok: "#000",
};

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [insights, setInsights] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/analytics")
      .then(r => r.json())
      .then(setInsights)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 text-center" style={{ color: "var(--text-muted)" }}>Loading insights...</div>;

  const d = insights;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Performance Learning
        </h1>
        <p style={{ color: "var(--text-muted)" }}>
          Your AI learns what works and auto-optimizes. Insights improve with every comment.
        </p>
      </div>

      {!d || d.totalTracked < 5 ? (
        // Not enough data
        <div className="rounded-2xl p-8 text-center" style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)" }}>
          <div className="text-5xl mb-4">🧪</div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
            Learning in Progress
          </h3>
          <p className="mb-4" style={{ color: "var(--text-muted)" }}>
            The AI needs at least 5 tracked comments to generate insights.
            Currently tracking: <strong>{d?.totalTracked || 0}</strong> comments.
          </p>
          <div className="w-full max-w-xs mx-auto rounded-full h-3" style={{ background: "var(--bg-secondary)" }}>
            <div
              className="h-3 rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, ((d?.totalTracked || 0) / 5) * 100)}%`,
                background: "linear-gradient(135deg, #4A9FD4, #63B3E4)",
              }}
            />
          </div>
          <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
            {d?.totalTracked || 0}/5 comments needed
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Comments Tracked" value={d.totalTracked} color="#4A9FD4" />
            <StatCard label="Avg Engagement" value={d.avgEngagement.toFixed(1)} color="#10b981" />
            <StatCard label="Best Tone" value={d.bestTone ? `${toneEmoji[d.bestTone.tone] || ""} ${d.bestTone.tone}` : "—"} color="#8b5cf6" />
            <StatCard label="Best Platform" value={d.bestPlatform?.platform || "—"} color={platformColors[d.bestPlatform?.platform || ""] || "#6b7280"} />
          </div>

          {/* Feature boosts */}
          <div className="rounded-2xl p-6" style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)" }}>
            <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
              📊 What Works (and What Doesn&apos;t)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <BoostCard
                label="Questions"
                boost={d.questionBoost}
                detail={d.questionBoost > 0 ? "Ending with a question drives replies" : "Statements outperform questions"}
                icon="❓"
              />
              <BoostCard
                label="Emojis"
                boost={d.emojiBoost}
                detail={d.emojiBoost > 0 ? "Emojis make your comments stand out" : "Text-only comments perform better"}
                icon="😊"
              />
              <BoostCard
                label="Call-to-Action"
                boost={d.ctaBoost}
                detail={d.ctaBoost > 0 ? "Soft CTAs drive engagement" : "Be helpful first, sell later"}
                icon="📢"
              />
            </div>
          </div>

          {/* Optimal settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Best length */}
            {d.bestLength && (
              <div className="rounded-2xl p-6" style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)" }}>
                <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-secondary)" }}>📏 Optimal Length</h3>
                <p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{d.bestLength.range}</p>
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                  Avg engagement: {d.bestLength.avgEngagement.toFixed(1)}
                </p>
              </div>
            )}

            {/* Best time */}
            {d.bestTimeOfDay && (
              <div className="rounded-2xl p-6" style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)" }}>
                <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-secondary)" }}>🕐 Best Time to Post</h3>
                <p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                  {d.bestTimeOfDay.hour === 0 ? "12 AM" : d.bestTimeOfDay.hour < 12 ? `${d.bestTimeOfDay.hour} AM` : d.bestTimeOfDay.hour === 12 ? "12 PM" : `${d.bestTimeOfDay.hour - 12} PM`}
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                  Comments posted around this time get the most engagement
                </p>
              </div>
            )}
          </div>

          {/* Top performing comments */}
          {d.topComments.length > 0 && (
            <div className="rounded-2xl p-6" style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)" }}>
              <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
                🏆 Top Performing Comments
              </h2>
              <div className="space-y-3">
                {d.topComments.map((tc, i) => (
                  <div key={i} className="rounded-xl p-4 flex items-start gap-3" style={{ background: "var(--bg-secondary, #f1f5f9)" }}>
                    <div className="text-lg font-bold" style={{ color: i === 0 ? "#f59e0b" : i === 1 ? "#94a3b8" : "#cd7f32" }}>
                      #{i + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm" style={{ color: "var(--text-primary)" }}>{tc.content}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${platformColors[tc.platform] || "#888"}15`, color: platformColors[tc.platform] || "#888" }}>
                          {tc.platform}
                        </span>
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                          Engagement: {tc.engagement.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Raw AI guidance */}
          <div className="rounded-2xl p-6" style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)" }}>
            <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
              🤖 What the AI Sees
            </h2>
            <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>
              This is the guidance injected into every AI prompt, automatically updated as more data comes in:
            </p>
            <pre className="text-xs p-4 rounded-xl whitespace-pre-wrap" style={{
              background: "var(--bg-secondary, #f1f5f9)",
              color: "var(--text-primary)",
              fontFamily: "monospace",
            }}>
              {d.promptGuidance}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="rounded-xl p-4 text-center" style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)" }}>
      <div className="text-xl font-bold" style={{ color }}>{value}</div>
      <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{label}</div>
    </div>
  );
}

function BoostCard({ label, boost, detail, icon }: { label: string; boost: number; detail: string; icon: string }) {
  const positive = boost > 0;
  return (
    <div className="rounded-xl p-4" style={{ background: "var(--bg-secondary, #f1f5f9)" }}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{icon}</span>
        <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{label}</span>
      </div>
      <div className="text-2xl font-bold mb-1" style={{ color: positive ? "#10b981" : boost === 0 ? "var(--text-muted)" : "#ef4444" }}>
        {boost === 0 ? "—" : `${positive ? "+" : ""}${boost}%`}
      </div>
      <p className="text-xs" style={{ color: "var(--text-muted)" }}>{detail}</p>
    </div>
  );
}
