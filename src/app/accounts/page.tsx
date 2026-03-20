"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { InstagramIcon, TikTokIcon, LinkedInIcon, FacebookIcon, XIcon, RedditIcon } from "@/components/SocialIcons";

interface Account {
  platform: string;
  handle: string;
  connectedAt: string;
}

const platformMeta: Record<string, { name: string; Icon: React.ComponentType<{ size?: number; className?: string }>; color: string }> = {
  instagram: { name: "Instagram", Icon: InstagramIcon, color: "#E1306C" },
  tiktok: { name: "TikTok", Icon: TikTokIcon, color: "#000000" },
  linkedin: { name: "LinkedIn", Icon: LinkedInIcon, color: "#0A66C2" },
  facebook: { name: "Facebook", Icon: FacebookIcon, color: "#1877F2" },
  x: { name: "X (Twitter)", Icon: XIcon, color: "#000000" },
  reddit: { name: "Reddit", Icon: RedditIcon, color: "#FF4500" },
};

const allPlatforms = ["instagram", "tiktok", "linkedin", "facebook", "x", "reddit"];

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get("connected");
    const error = params.get("error");

    if (connected) {
      setMessage({ type: "success", text: `Successfully connected ${platformMeta[connected]?.name || connected}!` });
      window.history.replaceState({}, "", "/accounts");
    } else if (error) {
      setMessage({ type: "error", text: `Connection failed: ${error.replace(/_/g, " ")}` });
      window.history.replaceState({}, "", "/accounts");
    }

    fetch("/api/accounts")
      .then((r) => r.json())
      .then((data) => { setAccounts(data.accounts || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const connectedIds = new Set(accounts.map((a) => a.platform));

  return (
    <div className="max-w-2xl mx-auto py-10 px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Connected Accounts</h1>
        <p className="text-text-secondary text-sm mt-1">Manage your social media connections</p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-2xl text-sm font-medium ${
          message.type === "success"
            ? "bg-green-50 text-green-700 border border-green-200"
            : "bg-red-50 text-red-700 border border-red-200"
        }`}>
          {message.text}
        </div>
      )}

      {accounts.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-3">Connected</h2>
          <div className="space-y-3">
            {accounts.map((a) => {
              const meta = platformMeta[a.platform];
              if (!meta) return null;
              return (
                <div key={a.platform} className="flex items-center gap-4 p-4 bg-card border border-border rounded-2xl">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: meta.color + "12" }}>
                    <meta.Icon size={20} className="opacity-80" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-text-primary">{meta.name}</p>
                    <p className="text-xs text-text-muted">@{a.handle} · Connected {new Date(a.connectedAt).toLocaleDateString()}</p>
                  </div>
                  <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full font-medium">Active</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {allPlatforms.filter((p) => !connectedIds.has(p)).length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-3">Available</h2>
          <div className="grid grid-cols-2 gap-3">
            {allPlatforms.filter((p) => !connectedIds.has(p)).map((p) => {
              const meta = platformMeta[p];
              return (
                <a key={p} href={`/api/auth/${p}`}
                  className="flex items-center gap-3 p-4 bg-surface border border-border rounded-2xl hover:border-primary hover:bg-primary/[0.02] transition-all group">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: meta.color + "12" }}>
                    <meta.Icon size={20} className="opacity-80" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-text-primary">{meta.name}</p>
                    <p className="text-xs text-text-muted">Click to connect</p>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-muted group-hover:text-primary transition-colors"><polyline points="9 18 15 12 9 6" /></svg>
                </a>
              );
            })}
          </div>
        </div>
      )}

      {loading && <div className="text-center py-10 text-text-muted text-sm">Loading accounts...</div>}

      <div className="mt-8 flex gap-3">
        <Link href="/dashboard" className="px-6 py-3 bg-gradient-to-r from-primary to-accent text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-primary/20 transition-all">
          Go to Dashboard
        </Link>
        <Link href="/settings" className="px-6 py-3 border border-border text-text-secondary rounded-xl text-sm font-medium hover:border-primary hover:text-primary transition-all">
          Settings
        </Link>
      </div>
    </div>
  );
}
