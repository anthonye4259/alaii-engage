"use client";

import { useState } from "react";

interface Account {
  id: string;
  name: string;
  icon: string;
  color: string;
  bgColor: string;
  connected: boolean;
  handle: string;
  followers: string;
  avatar: string;
}

const initialAccounts: Account[] = [
  {
    id: "instagram",
    name: "Instagram",
    icon: "📷",
    color: "#e1306c",
    bgColor: "linear-gradient(135deg, #833AB4, #E1306C, #F77737)",
    connected: false,
    handle: "",
    followers: "",
    avatar: "",
  },
  {
    id: "tiktok",
    name: "TikTok",
    icon: "🎵",
    color: "#00f2ea",
    bgColor: "linear-gradient(135deg, #00f2ea, #ff0050)",
    connected: false,
    handle: "",
    followers: "",
    avatar: "",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: "💼",
    color: "#0a66c2",
    bgColor: "linear-gradient(135deg, #0a66c2, #004182)",
    connected: false,
    handle: "",
    followers: "",
    avatar: "",
  },
  {
    id: "facebook",
    name: "Facebook",
    icon: "👤",
    color: "#1877f2",
    bgColor: "linear-gradient(135deg, #1877f2, #0d5bbd)",
    connected: false,
    handle: "",
    followers: "",
    avatar: "",
  },
  {
    id: "x",
    name: "X (Twitter)",
    icon: "✖",
    color: "#ffffff",
    bgColor: "linear-gradient(135deg, #1a1a2e, #000000)",
    connected: false,
    handle: "",
    followers: "",
    avatar: "",
  },
  {
    id: "reddit",
    name: "Reddit",
    icon: "🤖",
    color: "#ff4500",
    bgColor: "linear-gradient(135deg, #ff4500, #cc3700)",
    connected: false,
    handle: "",
    followers: "",
    avatar: "",
  },
];

export default function AccountsPage() {
  const [accounts, setAccounts] = useState(initialAccounts);

  const handleConnect = (id: string) => {
    // Simulates OAuth — in production this opens the real OAuth popup
    const platform = accounts.find(a => a.id === id);
    if (!platform) return;

    // Simulate successful connection
    setAccounts(accounts.map(a =>
      a.id === id
        ? { ...a, connected: true, handle: "@mikesbarber", followers: "1.2k" }
        : a
    ));
  };

  const handleDisconnect = (id: string) => {
    setAccounts(accounts.map(a =>
      a.id === id
        ? { ...a, connected: false, handle: "", followers: "" }
        : a
    ));
  };

  const connectedCount = accounts.filter(a => a.connected).length;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Connect Your Accounts</h1>
        <p className="text-text-secondary text-sm mt-1">
          {connectedCount === 0
            ? "Sign in to your social accounts to start automating engagement"
            : `${connectedCount} account${connectedCount > 1 ? "s" : ""} connected`
          }
        </p>
      </div>

      <div className="space-y-3">
        {accounts.map((account) => (
          <div
            key={account.id}
            className="bg-bg-card border border-border rounded-2xl overflow-hidden hover:border-border-hover transition-all duration-200"
          >
            {account.connected ? (
              /* Connected State */
              <div className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-lg"
                    style={{ background: account.bgColor }}
                  >
                    {account.icon}
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
                  className="text-xs text-text-muted hover:text-danger transition-colors font-medium"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              /* Connect Button */
              <button
                onClick={() => handleConnect(account.id)}
                className="w-full p-5 flex items-center gap-4 hover:bg-bg-card-hover transition-all duration-200 cursor-pointer text-left"
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-lg"
                  style={{ background: account.bgColor }}
                >
                  {account.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-text-primary font-semibold text-sm">Sign in with {account.name}</h3>
                  <p className="text-text-muted text-xs mt-0.5">Click to connect your account</p>
                </div>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Helper text */}
      <div className="bg-bg-secondary border border-border rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <span className="text-lg">🔒</span>
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
