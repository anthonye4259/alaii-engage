"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/AuthProvider";

interface QueueItem {
  id: string;
  platform: string;
  type: string;
  status: "pending" | "approved" | "posted" | "skipped";
  targetId: string;
  targetUrl: string;
  targetTitle?: string;
  targetContent?: string;
  targetAuthor?: string;
  targetSubreddit?: string;
  targetScore?: number;
  targetComments?: number;
  generatedComment: string;
  variations: string[];
  confidence: number;
  sentiment?: string;
  relevanceScore: number;
  createdAt: number;
}

const PLATFORMS = [
  { id: "reddit", label: "Reddit", icon: "🟠", color: "#FF4500" },
  { id: "x", label: "X / Twitter", icon: "𝕏", color: "#1DA1F2" },
  { id: "instagram", label: "Instagram", icon: "📸", color: "#E4405F" },
  { id: "facebook", label: "Facebook", icon: "📘", color: "#1877F2" },
  { id: "linkedin", label: "LinkedIn", icon: "💼", color: "#0A66C2" },
  { id: "tiktok", label: "TikTok", icon: "🎵", color: "#000000" },
];

export default function QueuePage() {
  const { user } = useAuth();
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);
  const [posting, setPosting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["reddit", "x", "instagram", "facebook", "linkedin", "tiktok"]);
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [subreddits, setSubreddits] = useState("SaaS,marketing,socialmedia,startups");
  const [hashtags, setHashtags] = useState("socialmedia,AImarketing,growthhacking");
  const [keywords, setKeywords] = useState("social media automation,AI engagement,marketing tool");
  const [selectedVariation, setSelectedVariation] = useState<Record<string, number>>({});
  const [scrapeResults, setScrapeResults] = useState<{ platform: string; scanned: number; queued: number }[]>([]);

  const fetchQueue = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/queue");
      const data = await res.json();
      setItems(data.items || []);
    } catch (err) {
      console.error("Failed to fetch queue:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchQueue(); }, [fetchQueue]);

  const handleScrape = async () => {
    setScraping(true);
    setScrapeResults([]);
    try {
      const res = await fetch("/api/v1/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platforms: selectedPlatforms,
          subreddits: subreddits.split(",").map(s => s.trim()).filter(Boolean),
          hashtags: hashtags.split(",").map(h => h.trim()).filter(Boolean),
          keywords: keywords.split(",").map(k => k.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setScrapeResults(data.results || []);
        await fetchQueue();
      }
    } catch (err) {
      console.error("Scrape failed:", err);
    } finally {
      setScraping(false);
    }
  };

  const handleAction = async (itemId: string, action: "approve" | "skip") => {
    await fetch("/api/v1/queue", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, action }),
    });
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, status: action === "approve" ? "approved" : "skipped" } : i));
  };

  const handlePostAll = async () => {
    setPosting(true);
    try {
      const res = await fetch("/api/v1/queue", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "post_all" }),
      });
      const data = await res.json();
      if (data.success) await fetchQueue();
    } catch (err) {
      console.error("Post failed:", err);
    } finally {
      setPosting(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getVariation = (item: QueueItem) => item.variations[selectedVariation[item.id] || 0] || item.generatedComment;
  const cycleVariation = (item: QueueItem) => {
    const next = ((selectedVariation[item.id] || 0) + 1) % item.variations.length;
    setSelectedVariation(prev => ({ ...prev, [item.id]: next }));
  };

  const togglePlatform = (id: string) => {
    setSelectedPlatforms(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  const sentimentEmoji: Record<string, string> = {
    positive: "😊", negative: "😤", question: "❓", complaint: "⚠️", excited: "🔥", neutral: "💬",
  };

  const platformMeta = Object.fromEntries(PLATFORMS.map(p => [p.id, p]));

  const filteredItems = items.filter(i => i.status !== "skipped" && (platformFilter === "all" || i.platform === platformFilter));
  const pendingCount = items.filter(i => i.status === "pending").length;
  const approvedCount = items.filter(i => i.status === "approved").length;
  const postedCount = items.filter(i => i.status === "posted").length;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Content Queue</h1>
        <p style={{ color: "var(--text-muted)" }}>Scan all platforms for opportunities. Review AI comments. Copy or auto-post.</p>
      </div>

      {/* Scan Controls */}
      <div className="rounded-2xl p-6 mb-6" style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)" }}>
        <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>🔍 Scan for Opportunities</h2>

        {/* Platform toggles */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>Platforms</label>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map(p => (
              <button
                key={p.id}
                onClick={() => togglePlatform(p.id)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: selectedPlatforms.includes(p.id) ? p.color : "var(--bg-secondary, #f1f5f9)",
                  color: selectedPlatforms.includes(p.id) ? "white" : "var(--text-muted)",
                  opacity: selectedPlatforms.includes(p.id) ? 1 : 0.5,
                }}
              >
                {p.icon} {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Subreddits</label>
            <input value={subreddits} onChange={e => setSubreddits(e.target.value)} placeholder="SaaS, marketing"
              className="w-full px-4 py-2.5 rounded-xl text-sm" style={{ background: "var(--input-bg, #f8fafc)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Hashtags</label>
            <input value={hashtags} onChange={e => setHashtags(e.target.value)} placeholder="socialmedia, AI"
              className="w-full px-4 py-2.5 rounded-xl text-sm" style={{ background: "var(--input-bg, #f8fafc)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Keywords</label>
            <input value={keywords} onChange={e => setKeywords(e.target.value)} placeholder="automation, AI tool"
              className="w-full px-4 py-2.5 rounded-xl text-sm" style={{ background: "var(--input-bg, #f8fafc)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }} />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={handleScrape} disabled={scraping || selectedPlatforms.length === 0}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
            style={{ background: scraping ? "#94a3b8" : "linear-gradient(135deg, #4A9FD4, #63B3E4)", cursor: scraping ? "not-allowed" : "pointer" }}>
            {scraping ? "⏳ Scanning all platforms..." : `🚀 Scan ${selectedPlatforms.length} Platform${selectedPlatforms.length > 1 ? "s" : ""}`}
          </button>
          {approvedCount > 0 && (
            <button onClick={handlePostAll} disabled={posting}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
              style={{ background: posting ? "#94a3b8" : "linear-gradient(135deg, #10b981, #059669)" }}>
              {posting ? "⏳ Posting..." : `📤 Post ${approvedCount} Approved`}
            </button>
          )}
        </div>

        {/* Scrape results summary */}
        {scrapeResults.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {scrapeResults.map(r => (
              <span key={r.platform} className="text-xs px-3 py-1 rounded-full" style={{
                background: `${platformMeta[r.platform]?.color || "#888"}20`,
                color: platformMeta[r.platform]?.color || "#888",
              }}>
                {platformMeta[r.platform]?.icon} {r.queued} queued / {r.scanned} scanned
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Stats + Filter */}
      <div className="flex items-center gap-4 mb-6">
        <div className="grid grid-cols-3 gap-3 flex-1">
          {[
            { label: "Pending", count: pendingCount, color: "#f59e0b" },
            { label: "Approved", count: approvedCount, color: "#10b981" },
            { label: "Posted", count: postedCount, color: "#4A9FD4" },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)" }}>
              <div className="text-xl font-bold" style={{ color: s.color }}>{s.count}</div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-1">
          <button onClick={() => setPlatformFilter("all")} className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{ background: platformFilter === "all" ? "var(--primary, #4A9FD4)" : "var(--bg-secondary)", color: platformFilter === "all" ? "white" : "var(--text-muted)" }}>
            All
          </button>
          {PLATFORMS.map(p => (
            <button key={p.id} onClick={() => setPlatformFilter(p.id)} className="px-2 py-1.5 rounded-lg text-xs transition-all"
              style={{ background: platformFilter === p.id ? p.color : "var(--bg-secondary)", color: platformFilter === p.id ? "white" : "var(--text-muted)" }}>
              {p.icon}
            </button>
          ))}
        </div>
      </div>

      {/* Queue Items */}
      {loading ? (
        <div className="text-center py-20" style={{ color: "var(--text-muted)" }}>Loading queue...</div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-20 rounded-2xl" style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)" }}>
          <div className="text-4xl mb-4">📭</div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--text-primary)" }}>Queue is empty</h3>
          <p style={{ color: "var(--text-muted)" }}>Select platforms and hit &quot;Scan&quot; to find posts and generate AI comments.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredItems.map(item => {
            const pm = platformMeta[item.platform];
            return (
              <div key={item.id} className="rounded-2xl p-5 transition-all" style={{
                background: "var(--card-bg)",
                border: `1px solid ${item.status === "approved" ? "#10b981" : item.status === "posted" ? "#4A9FD4" : "var(--border-color)"}`,
                opacity: item.status === "posted" ? 0.7 : 1,
              }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: `${pm?.color || "#888"}15`, color: pm?.color }}>
                        {pm?.icon} {item.platform === "reddit" ? `r/${item.targetSubreddit}` : pm?.label || item.platform}
                      </span>
                      {item.targetAuthor && <span className="text-xs" style={{ color: "var(--text-muted)" }}>by {item.targetAuthor}</span>}
                      {item.sentiment && <span title={item.sentiment}>{sentimentEmoji[item.sentiment] || "💬"}</span>}
                      {(item.targetScore || 0) > 0 && <span className="text-xs" style={{ color: "var(--text-muted)" }}>⬆️ {item.targetScore}</span>}
                      {(item.targetComments || 0) > 0 && <span className="text-xs" style={{ color: "var(--text-muted)" }}>💬 {item.targetComments}</span>}
                    </div>
                    <a href={item.targetUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold hover:underline" style={{ color: "var(--text-primary)" }}>
                      {item.targetTitle || item.targetContent?.slice(0, 80) || "View post"}
                    </a>
                    {item.targetContent && item.targetContent !== item.targetTitle && (
                      <p className="text-xs mt-1 line-clamp-2" style={{ color: "var(--text-muted)" }}>{item.targetContent}</p>
                    )}
                  </div>
                  <span className="text-xs px-2 py-1 rounded-lg font-medium ml-3" style={{
                    background: item.status === "approved" ? "rgba(16,185,129,0.1)" : item.status === "posted" ? "rgba(74,159,212,0.1)" : "rgba(245,158,11,0.1)",
                    color: item.status === "approved" ? "#10b981" : item.status === "posted" ? "#4A9FD4" : "#f59e0b",
                  }}>
                    {item.status}
                  </span>
                </div>

                {/* Generated comment */}
                <div className="rounded-xl p-4 mb-3" style={{ background: "var(--bg-secondary, #f1f5f9)" }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                      AI Comment ({(selectedVariation[item.id] || 0) + 1}/{item.variations.length})
                    </span>
                    {item.variations.length > 1 && (
                      <button onClick={() => cycleVariation(item)} className="text-xs px-2 py-1 rounded-lg hover:opacity-80"
                        style={{ background: "rgba(74,159,212,0.1)", color: "#4A9FD4" }}>
                        🔄 Next
                      </button>
                    )}
                  </div>
                  <p className="text-sm" style={{ color: "var(--text-primary)" }}>{getVariation(item)}</p>
                </div>

                {/* Actions */}
                {item.status === "pending" && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <button onClick={() => copyToClipboard(getVariation(item), item.id)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:scale-105"
                      style={{ background: copiedId === item.id ? "#10b981" : "linear-gradient(135deg, #4A9FD4, #63B3E4)", color: "white" }}>
                      {copiedId === item.id ? "✅ Copied!" : "📋 Copy"}
                    </button>
                    <a href={item.targetUrl} target="_blank" rel="noopener noreferrer"
                      className="px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:scale-105"
                      style={{ background: "var(--bg-secondary, #f1f5f9)", color: "var(--text-primary)" }}>
                      🔗 Open Post
                    </a>
                    <button onClick={() => handleAction(item.id, "approve")}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:scale-105"
                      style={{ background: "#10b981" }}>
                      ✅ Approve
                    </button>
                    <button onClick={() => handleAction(item.id, "skip")}
                      className="px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-80"
                      style={{ color: "var(--text-muted)" }}>
                      Skip
                    </button>
                    <span className="ml-auto text-xs" style={{ color: "var(--text-muted)" }}>
                      Score: {item.relevanceScore}
                    </span>
                  </div>
                )}
                {item.status === "approved" && (
                  <span className="text-xs" style={{ color: "#10b981" }}>✅ Approved — will be posted when you click &quot;Post Approved&quot;</span>
                )}
                {item.status === "posted" && (
                  <span className="text-xs" style={{ color: "#4A9FD4" }}>📤 Posted to {pm?.label}</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
