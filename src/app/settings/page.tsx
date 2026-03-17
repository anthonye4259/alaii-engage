"use client";

import { useState } from "react";

export default function SettingsPage() {
  const [showApiKey, setShowApiKey] = useState(false);
  const [devMode, setDevMode] = useState(false);
  const apiKey = "ae_sk_live_7f3k9x2m1p4q8r5t0w6y";

  const copyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    alert("API key copied to clipboard");
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
        <p className="text-text-secondary text-sm mt-1">Manage your account and preferences</p>
      </div>

      {/* Account */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Account</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <p className="text-sm font-medium text-text-primary">Email</p>
              <p className="text-sm text-text-secondary">mike@barbershop.com</p>
            </div>
            <button className="text-xs text-accent hover:text-accent-hover font-medium">Change</button>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <p className="text-sm font-medium text-text-primary">Plan</p>
              <p className="text-sm text-text-secondary">Pro — $40/month</p>
            </div>
            <button className="text-xs text-accent hover:text-accent-hover font-medium">Manage billing</button>
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-text-primary">Engagement quota</p>
              <p className="text-sm text-text-secondary">156 / 250 this month</p>
            </div>
            <button className="text-xs text-accent hover:text-accent-hover font-medium">Upgrade</button>
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Preferences</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <p className="text-sm font-medium text-text-primary">Email notifications</p>
              <p className="text-xs text-text-muted">Get a daily digest of engagement activity</p>
            </div>
            <button className="toggle-switch active" />
          </div>
          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <p className="text-sm font-medium text-text-primary">AI tone</p>
              <p className="text-xs text-text-muted">How your AI writes comments and replies</p>
            </div>
            <select className="bg-surface border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-accent">
              <option>Casual & Friendly</option>
              <option>Professional</option>
              <option>Enthusiastic</option>
              <option>Minimal</option>
            </select>
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-text-primary">Engagement speed</p>
              <p className="text-xs text-text-muted">How quickly the AI engages (slower = more natural)</p>
            </div>
            <select className="bg-surface border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-accent">
              <option>Natural (recommended)</option>
              <option>Moderate</option>
              <option>Fast</option>
            </select>
          </div>
        </div>
      </div>

      {/* Developer Mode */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text-primary">Developer Mode</h2>
          <button
            onClick={() => setDevMode(!devMode)}
            className={`toggle-switch ${devMode ? "active" : ""}`}
          />
        </div>
        <p className="text-text-muted text-xs mb-4">Enable API and MCP access for agent integrations</p>

        {devMode && (
          <div className="space-y-5 pt-4 border-t border-border">
            {/* API Key */}
            <div>
              <p className="text-sm font-medium text-text-primary mb-2">API Key</p>
              <div className="flex gap-2">
                <div className="flex-1 bg-surface border border-border rounded-xl px-4 py-2.5 font-mono text-sm text-text-secondary">
                  {showApiKey ? apiKey : "ae_sk_live_••••••••••••••••"}
                </div>
                <button
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="px-4 py-2.5 border border-border rounded-xl text-sm text-text-secondary hover:text-text-primary transition-colors"
                >
                  {showApiKey ? "Hide" : "Show"}
                </button>
                <button
                  onClick={copyApiKey}
                  className="px-4 py-2.5 bg-accent hover:bg-accent-hover text-white rounded-xl text-sm font-medium transition-colors"
                >
                  Copy
                </button>
              </div>
            </div>

            {/* MCP Config */}
            <div>
              <p className="text-sm font-medium text-text-primary mb-2">MCP Server URL</p>
              <div className="bg-surface border border-border rounded-xl px-4 py-2.5 font-mono text-sm text-text-secondary">
                https://engage.alaii.app/mcp
              </div>
            </div>

            {/* Quick Start */}
            <div>
              <p className="text-sm font-medium text-text-primary mb-2">Quick start (add to your agent config)</p>
              <pre className="bg-background border border-border rounded-xl p-4 text-xs text-text-secondary overflow-x-auto font-mono">
{`{
  "mcpServers": {
    "alaii-engage": {
      "url": "https://engage.alaii.app/mcp",
      "headers": {
        "Authorization": "Bearer ${showApiKey ? apiKey : "YOUR_API_KEY"}"
      }
    }
  }
}`}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Danger Zone */}
      <div className="bg-card border border-error/20 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-error mb-2">Danger Zone</h2>
        <p className="text-text-muted text-xs mb-4">These actions are irreversible</p>
        <div className="flex gap-3">
          <button className="px-4 py-2 border border-error/30 text-error rounded-xl text-sm font-medium hover:bg-error/10 transition-colors">
            Disconnect all accounts
          </button>
          <button className="px-4 py-2 border border-error/30 text-error rounded-xl text-sm font-medium hover:bg-error/10 transition-colors">
            Delete account
          </button>
        </div>
      </div>
    </div>
  );
}
