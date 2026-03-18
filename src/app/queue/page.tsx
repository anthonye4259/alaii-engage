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

export default function QueuePage() {
  const { user } = useAuth();
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);
  const [posting, setPosting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [subreddits, setSubreddits] = useState("SaaS,marketing,socialmedia,startups");
  const [keywords, setKeywords] = useState("social media automation,AI engagement,marketing tool");
  const [selectedVariation, setSelectedVariation] = useState<Record<string, number>>({});

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
    try {
      const res = await fetch("/api/v1/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platforms: ["reddit"],
          subreddits: subreddits.split(",").map(s => s.trim()).filter(Boolean),
          keywords: keywords.split(",").map(k => k.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (data.success) {
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
      if (data.success) {
        await fetchQueue();
      }
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

  const getVariation = (item: QueueItem) => {
    const idx = selectedVariation[item.id] || 0;
    return item.variations[idx] || item.generatedComment;
  };

  const cycleVariation = (item: QueueItem) => {
    const current = selectedVariation[item.id] || 0;
    const next = (current + 1) % item.variations.length;
    setSelectedVariation(prev => ({ ...prev, [item.id]: next }));
  };

  const sentimentEmoji: Record<string, string> = {
    positive: "😊", negative: "😤", question: "❓", complaint: "⚠️",
    excited: "🔥", neutral: "💬",
  };

  const pendingItems = items.filter(i => i.status === "pending");
  const approvedItems = items.filter(i => i.status === "approved");
  const postedItems = items.filter(i => i.status === "posted");

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Content Queue
        </h1>
        <p style={{ color: "var(--text-muted)" }}>
          AI-generated comments ready to post. Review, edit, and deploy.
        </p>
      </div>

      {/* Scrape Controls */}
      <div className="rounded-2xl p-6 mb-6" style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)" }}>
        <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
          🔍 Scan Reddit for Opportunities
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
              Subreddits (comma-separated)
            </label>
            <input
              value={subreddits}
              onChange={(e) => setSubreddits(e.target.value)}
              placeholder="SaaS, marketing, startups"
              className="w-full px-4 py-2.5 rounded-xl text-sm"
              style={{
                background: "var(--input-bg, #f8fafc)",
                border: "1px solid var(--border-color)",
                color: "var(--text-primary)",
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
              Keywords (comma-separated)
            </label>
            <input
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="social media, AI, automation"
              className="w-full px-4 py-2.5 rounded-xl text-sm"
              style={{
                background: "var(--input-bg, #f8fafc)",
                border: "1px solid var(--border-color)",
                color: "var(--text-primary)",
              }}
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleScrape}
            disabled={scraping}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
            style={{
              background: scraping ? "#94a3b8" : "linear-gradient(135deg, #4A9FD4, #63B3E4)",
              cursor: scraping ? "not-allowed" : "pointer",
            }}
          >
            {scraping ? "⏳ Scanning..." : "🚀 Scan Now"}
          </button>
          {approvedItems.length > 0 && (
            <button
              onClick={handlePostAll}
              disabled={posting}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
              style={{
                background: posting ? "#94a3b8" : "linear-gradient(135deg, #10b981, #059669)",
                cursor: posting ? "not-allowed" : "pointer",
              }}
            >
              {posting ? "⏳ Posting..." : `📤 Post ${approvedItems.length} Approved`}
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Pending Review", count: pendingItems.length, color: "#f59e0b" },
          { label: "Approved", count: approvedItems.length, color: "#10b981" },
          { label: "Posted", count: postedItems.length, color: "#4A9FD4" },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-4 text-center" style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)" }}>
            <div className="text-2xl font-bold" style={{ color: s.color }}>{s.count}</div>
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Queue Items */}
      {loading ? (
        <div className="text-center py-20" style={{ color: "var(--text-muted)" }}>Loading queue...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 rounded-2xl" style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)" }}>
          <div className="text-4xl mb-4">📭</div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--text-primary)" }}>Queue is empty</h3>
          <p style={{ color: "var(--text-muted)" }}>
            Hit &quot;Scan Now&quot; to find Reddit posts and generate AI comments.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.filter(i => i.status !== "skipped").map(item => (
            <div
              key={item.id}
              className="rounded-2xl p-5 transition-all"
              style={{
                background: "var(--card-bg)",
                border: `1px solid ${item.status === "approved" ? "#10b981" : item.status === "posted" ? "#4A9FD4" : "var(--border-color)"}`,
                opacity: item.status === "posted" ? 0.7 : 1,
              }}
            >
              {/* Post header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{
                      background: "rgba(74, 159, 212, 0.1)", color: "#4A9FD4",
                    }}>
                      r/{item.targetSubreddit}
                    </span>
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                      by u/{item.targetAuthor}
                    </span>
                    {item.sentiment && (
                      <span title={item.sentiment}>{sentimentEmoji[item.sentiment] || "💬"}</span>
                    )}
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                       ⬆️ {item.targetScore} · 💬 {item.targetComments}
                    </span>
                  </div>
                  <a
                    href={item.targetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold hover:underline"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {item.targetTitle}
                  </a>
                  {item.targetContent && (
                    <p className="text-xs mt-1 line-clamp-2" style={{ color: "var(--text-muted)" }}>
                      {item.targetContent}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 ml-4">
                  <span className="text-xs px-2 py-1 rounded-lg font-medium" style={{
                    background: item.status === "approved" ? "rgba(16,185,129,0.1)" : item.status === "posted" ? "rgba(74,159,212,0.1)" : "rgba(245,158,11,0.1)",
                    color: item.status === "approved" ? "#10b981" : item.status === "posted" ? "#4A9FD4" : "#f59e0b",
                  }}>
                    {item.status}
                  </span>
                </div>
              </div>

              {/* Generated comment */}
              <div className="rounded-xl p-4 mb-3" style={{ background: "var(--bg-secondary, #f1f5f9)" }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                    AI Comment (variation {(selectedVariation[item.id] || 0) + 1}/{item.variations.length})
                  </span>
                  {item.variations.length > 1 && (
                    <button
                      onClick={() => cycleVariation(item)}
                      className="text-xs px-2 py-1 rounded-lg hover:opacity-80"
                      style={{ background: "rgba(74,159,212,0.1)", color: "#4A9FD4" }}
                    >
                      🔄 Next variation
                    </button>
                  )}
                </div>
                <p className="text-sm" style={{ color: "var(--text-primary)" }}>
                  {getVariation(item)}
                </p>
              </div>

              {/* Actions */}
              {item.status === "pending" && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyToClipboard(getVariation(item), item.id)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:scale-105"
                    style={{
                      background: copiedId === item.id ? "#10b981" : "linear-gradient(135deg, #4A9FD4, #63B3E4)",
                      color: "white",
                    }}
                  >
                    {copiedId === item.id ? "✅ Copied!" : "📋 Copy"}
                  </button>
                  <a
                    href={item.targetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:scale-105"
                    style={{ background: "var(--bg-secondary, #f1f5f9)", color: "var(--text-primary)" }}
                  >
                    🔗 Open Post
                  </a>
                  <button
                    onClick={() => handleAction(item.id, "approve")}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:scale-105"
                    style={{ background: "#10b981" }}
                  >
                    ✅ Approve
                  </button>
                  <button
                    onClick={() => handleAction(item.id, "skip")}
                    className="px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-80"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Skip
                  </button>
                  <span className="ml-auto text-xs" style={{ color: "var(--text-muted)" }}>
                    Relevance: {item.relevanceScore}/100
                  </span>
                </div>
              )}
              {item.status === "approved" && (
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: "#10b981" }}>
                    ✅ Approved — will be posted when you click &quot;Post Approved&quot;
                  </span>
                </div>
              )}
              {item.status === "posted" && (
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: "#4A9FD4" }}>
                    📤 Posted to Reddit
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
