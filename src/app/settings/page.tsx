"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/AuthProvider";

interface ReferralData {
  referralCode: string;
  referralUrl: string;
  totalReferrals: number;
  bonusCallsEarned: number;
  currentBonusCalls: number;
}

interface WebhookData {
  webhookUrl: string | null;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [showApiKey, setShowApiKey] = useState(false);
  const [referral, setReferral] = useState<ReferralData | null>(null);
  const [webhook, setWebhook] = useState<WebhookData | null>(null);
  const [webhookInput, setWebhookInput] = useState("");
  const [copied, setCopied] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchReferral = useCallback(async () => {
    try {
      const res = await fetch("/api/referral");
      if (res.ok) setReferral(await res.json());
    } catch {}
  }, []);

  const fetchWebhook = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/webhooks");
      if (res.ok) {
        const data = await res.json();
        setWebhook(data);
        if (data.webhookUrl) setWebhookInput(data.webhookUrl);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchReferral();
    fetchWebhook();
  }, [fetchReferral, fetchWebhook]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(""), 2000);
  };

  const saveWebhook = async () => {
    setSaving(true);
    try {
      if (webhookInput) {
        await fetch("/api/v1/webhooks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: webhookInput }),
        });
      } else {
        await fetch("/api/v1/webhooks", { method: "DELETE" });
      }
      await fetchWebhook();
    } catch {}
    setSaving(false);
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/landing";
  };

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
        <p className="text-text-secondary text-sm mt-1">Manage your account, integrations, and referrals</p>
      </div>

      {/* Account */}
      <Section title="Account">
        <Row label="Email" value={user.email} />
        <Row label="Plan" value={planLabel(user.plan)} action={user.plan === "free" ? { label: "Upgrade", href: "/pricing" } : undefined} />
        <Row label="Member since" value={new Date(user.createdAt).toLocaleDateString()} />
      </Section>

      {/* API Key */}
      <Section title="API Key">
        <div className="flex gap-2">
          <div className="flex-1 bg-surface border border-border rounded-xl px-4 py-2.5 font-mono text-sm text-text-secondary truncate">
            {showApiKey ? user.apiKey : "ae_••••••••••••••••••••••••"}
          </div>
          <button
            onClick={() => setShowApiKey(!showApiKey)}
            className="px-4 py-2.5 border border-border rounded-xl text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            {showApiKey ? "Hide" : "Show"}
          </button>
          <button
            onClick={() => copyToClipboard(user.apiKey || "", "apikey")}
            className="px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-dark transition-colors"
          >
            {copied === "apikey" ? "✓ Copied" : "Copy"}
          </button>
        </div>
        <p className="text-text-muted text-xs mt-2">Use this key in the <code className="text-accent">Authorization: Bearer</code> header for API calls.</p>
      </Section>

      {/* Referral */}
      <Section title="Referrals">
        {referral ? (
          <>
            <div className="flex gap-2 mb-4">
              <div className="flex-1 bg-surface border border-border rounded-xl px-4 py-2.5 font-mono text-sm text-text-secondary truncate">
                {referral.referralUrl}
              </div>
              <button
                onClick={() => copyToClipboard(referral.referralUrl, "ref")}
                className="px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-dark transition-colors shrink-0"
              >
                {copied === "ref" ? "✓ Copied" : "Copy link"}
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Stat label="Referrals" value={referral.totalReferrals} />
              <Stat label="Bonus calls earned" value={referral.bonusCallsEarned} />
              <Stat label="Current bonus" value={referral.currentBonusCalls} />
            </div>
            <p className="text-text-muted text-xs mt-3">Share your link — both you and your friend get 100 bonus API calls.</p>
          </>
        ) : (
          <p className="text-text-muted text-sm">Loading referral data...</p>
        )}
      </Section>

      {/* Webhooks */}
      <Section title="Webhook (Zapier / n8n / Make.com)">
        <p className="text-text-muted text-xs mb-3">Receive a POST request on every engagement event. HTTPS URLs only.</p>
        <div className="flex gap-2">
          <input
            type="url"
            value={webhookInput}
            onChange={(e) => setWebhookInput(e.target.value)}
            placeholder="https://hooks.zapier.com/hooks/catch/..."
            className="flex-1 bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-all"
          />
          <button
            onClick={saveWebhook}
            disabled={saving}
            className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 shrink-0"
          >
            {saving ? "Saving..." : webhook?.webhookUrl ? "Update" : "Save"}
          </button>
        </div>
        {webhook?.webhookUrl && (
          <p className="text-success text-xs mt-2 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-success" />
            Active — receiving events at {webhook.webhookUrl}
          </p>
        )}
      </Section>

      {/* Danger Zone */}
      <div className="bg-card border border-error/20 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-error mb-2">Danger Zone</h2>
        <p className="text-text-muted text-xs mb-4">These actions are irreversible</p>
        <div className="flex gap-3">
          <button
            onClick={handleLogout}
            className="px-4 py-2 border border-border text-text-secondary rounded-xl text-sm font-medium hover:border-error hover:text-error transition-colors"
          >
            Log out
          </button>
          <button className="px-4 py-2 border border-error/30 text-error rounded-xl text-sm font-medium hover:bg-error/10 transition-colors">
            Delete account
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Helpers ---------- */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <h2 className="text-lg font-semibold text-text-primary mb-4">{title}</h2>
      {children}
    </div>
  );
}

function Row({ label, value, action }: { label: string; value: string; action?: { label: string; href: string } }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-b-0">
      <div>
        <p className="text-sm font-medium text-text-primary">{label}</p>
        <p className="text-sm text-text-secondary">{value}</p>
      </div>
      {action && (
        <a href={action.href} className="text-xs text-primary hover:text-primary-dark font-medium">
          {action.label}
        </a>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-surface rounded-xl p-3 text-center">
      <p className="text-lg font-bold text-text-primary">{value}</p>
      <p className="text-xs text-text-muted">{label}</p>
    </div>
  );
}

function planLabel(plan: string): string {
  const labels: Record<string, string> = {
    free: "Free",
    pro: "Pro — $40/mo",
    agency: "Agency — $99/mo",
    developer: "Developer",
  };
  return labels[plan] || plan;
}
