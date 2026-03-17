"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { InstagramIcon, TikTokIcon, LinkedInIcon, FacebookIcon, XIcon, RedditIcon } from "@/components/SocialIcons";

interface Account {
  id: string;
  name: string;
  IconComponent: React.FC<{ size?: number; className?: string }>;
  connected: boolean;
  handle: string;
  followers: string;
  authUrl: string;
}

const initialAccounts: Account[] = [
  { id: "instagram", name: "Instagram", IconComponent: InstagramIcon, connected: false, handle: "", followers: "", authUrl: "/api/auth/instagram" },
  { id: "tiktok", name: "TikTok", IconComponent: TikTokIcon, connected: false, handle: "", followers: "", authUrl: "/api/auth/tiktok" },
  { id: "linkedin", name: "LinkedIn", IconComponent: LinkedInIcon, connected: false, handle: "", followers: "", authUrl: "/api/auth/linkedin" },
  { id: "facebook", name: "Facebook", IconComponent: FacebookIcon, connected: false, handle: "", followers: "", authUrl: "/api/auth/facebook" },
  { id: "x", name: "X (Twitter)", IconComponent: XIcon, connected: false, handle: "", followers: "", authUrl: "/api/auth/x" },
  { id: "reddit", name: "Reddit", IconComponent: RedditIcon, connected: false, handle: "", followers: "", authUrl: "/api/auth/reddit" },
];

export default function AccountsPage() {
  return (
    <Suspense fallback={<div className="max-w-3xl mx-auto p-8 text-text-muted">Loading accounts...</div>}>
      <AccountsContent />
    </Suspense>
  );
}

function AccountsContent() {
  const [accounts, setAccounts] = useState(initialAccounts);
  const searchParams = useSearchParams();

  // Handle OAuth callback success/error
  useEffect(() => {
    const connected = searchParams.get("connected");
    const error = searchParams.get("error");

    if (connected) {
      setAccounts((prev) =>
        prev.map((a) =>
          a.id === connected
            ? { ...a, connected: true, handle: `@${connected}_user`, followers: "—" }
            : a
        )
      );
    }

    if (error) {
      console.error("OAuth error:", error);
    }
  }, [searchParams]);

  const handleConnect = (account: Account) => {
    // Redirect to OAuth flow
    window.location.href = account.authUrl;
  };

  const handleDisconnect = (id: string) => {
    setAccounts(accounts.map((a) =>
      a.id === id ? { ...a, connected: false, handle: "", followers: "" } : a
    ));
  };

  const connectedCount = accounts.filter((a) => a.connected).length;

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Connect Your Accounts</h1>
        <p className="text-text-secondary text-sm mt-1">
          {connectedCount === 0
            ? "Sign in to your social accounts to start automating engagement"
            : `${connectedCount} account${connectedCount > 1 ? "s" : ""} connected`}
        </p>
      </div>

      <div className="space-y-3">
        {accounts.map((account) => (
          <div
            key={account.id}
            className="bg-card border border-border rounded-xl overflow-hidden card-hover"
          >
            {account.connected ? (
              <div className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-surface flex items-center justify-center">
                    <account.IconComponent size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-text-primary font-semibold text-sm">{account.name}</h3>
                      <span className="flex items-center gap-1 text-success text-xs font-medium">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Connected
                      </span>
                    </div>
                    <p className="text-text-muted text-xs mt-0.5">{account.handle} · {account.followers} followers</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDisconnect(account.id)}
                  className="text-xs text-text-muted hover:text-error transition-colors font-medium"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleConnect(account)}
                className="w-full p-5 flex items-center gap-4 hover:bg-surface-hover transition-all duration-200 cursor-pointer text-left"
              >
                <div className="w-11 h-11 rounded-xl bg-surface flex items-center justify-center">
                  <account.IconComponent size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-text-primary font-semibold text-sm">Sign in with {account.name}</h3>
                  <p className="text-text-muted text-xs mt-0.5">Connect via official OAuth</p>
                </div>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="bg-surface border border-border rounded-xl p-5">
        <div className="flex items-start gap-3">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#66A3D1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <div>
            <p className="text-sm font-medium text-text-primary">Your accounts are secure</p>
            <p className="text-xs text-text-muted mt-1">
              We use official platform APIs with OAuth. We never see or store your passwords. You can disconnect at any time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
