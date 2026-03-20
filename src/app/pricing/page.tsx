"use client";

import { useState } from "react";

type PricingMode = "subscription" | "api";

const subscriptionPlans = [
  {
    id: "pro",
    name: "Pro",
    price: "$40",
    period: "/month",
    description: "Full engagement automation for growing businesses",
    features: [
      "4 social accounts",
      "500 engagements/month",
      "All automation rules",
      "Comment, like, reply, DM, repost",
      "AI chat — teach your agent your brand",
      "AI-powered personalization",
      "Activity analytics",
      "Priority support",
    ],
    cta: "Start Pro — 7 days free",
    popular: true,
    priceId: "price_1TC9w006I3eFkRUmnJbQyWtT",
  },
];

export default function PricingPage() {
  const [mode, setMode] = useState<PricingMode>("subscription");
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (priceId: string | null, planId: string) => {
    if (!priceId) return;
    setLoading(planId);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (err) {
      console.error("Checkout error:", err);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-text-primary">Pricing</h1>
        <p className="text-text-secondary text-sm mt-2">
          Subscriptions for teams. Pay-per-call for developers and agents.
        </p>
      </div>

      {/* Mode Toggle */}
      <div className="flex justify-center">
        <div className="flex bg-surface rounded-xl p-1 border border-border">
          <button
            onClick={() => setMode("subscription")}
            className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
              mode === "subscription" ? "bg-white text-text-primary shadow-sm" : "text-text-muted hover:text-text-secondary"
            }`}
          >
            📊 Subscription
          </button>
          <button
            onClick={() => setMode("api")}
            className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
              mode === "api" ? "bg-white text-text-primary shadow-sm" : "text-text-muted hover:text-text-secondary"
            }`}
          >
            🤖 API / Pay-per-call
          </button>
        </div>
      </div>

      {/* Subscription Plans */}
      {mode === "subscription" && (
        <div className="grid grid-cols-2 gap-6 animate-fade-in">
          {subscriptionPlans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-card border rounded-2xl p-8 flex flex-col relative ${
                plan.popular
                  ? "border-accent shadow-[0_0_30px_rgba(99,102,241,0.12)]"
                  : "border-border card-hover"
              } transition-all duration-200`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-white text-xs font-semibold px-4 py-1 rounded-full">
                  Most Popular
                </span>
              )}
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-text-primary">{plan.name}</h3>
                <p className="text-text-muted text-sm mt-1">{plan.description}</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-5xl font-bold text-text-primary">{plan.price}</span>
                  <span className="text-text-muted text-sm">{plan.period}</span>
                </div>
              </div>
              <ul className="space-y-3 flex-1 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm text-text-secondary">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4A9FD4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleSubscribe(plan.priceId, plan.id)}
                disabled={loading === plan.id}
                className={`w-full py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  plan.popular
                    ? "gradient-primary text-white shadow-[0_4px_20px_rgba(99,102,241,0.25)]"
                    : "border border-border text-text-primary hover:border-accent hover:text-accent"
                } ${loading === plan.id ? "opacity-50 cursor-wait" : ""}`}
              >
                {loading === plan.id ? "Loading..." : plan.cta}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* API Pay-per-call */}
      {mode === "api" && (
        <div className="animate-fade-in space-y-6">
          {/* Pricing card */}
          <div className="bg-card border border-accent rounded-2xl p-8 shadow-[0_0_30px_rgba(99,102,241,0.08)] max-w-xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-text-primary">API Access</h3>
                <p className="text-text-muted text-xs">Pay only for what you use</p>
              </div>
            </div>

            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-5xl font-bold text-text-primary">$0.01</span>
              <span className="text-text-muted text-sm">/ API call</span>
            </div>

            <ul className="space-y-3 mb-8">
              {[
                "AI content generation (3 variations per call)",
                "6 platforms — Instagram, TikTok, X, LinkedIn, Reddit, Facebook",
                "Anti-detection responses built in",
                "Platform-specific tone adaptation",
                "No monthly minimum",
                "Pay at end of each billing period",
                "Usage dashboard in real-time",
              ].map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm text-text-secondary">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4A9FD4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSubscribe("price_1TCAQR06I3eFkRUmqqsBTDV8", "api")}
              disabled={loading === "api"}
              className={`block w-full py-3.5 rounded-xl text-sm font-semibold text-white gradient-primary text-center shadow-[0_4px_20px_rgba(99,102,241,0.25)] ${loading === "api" ? "opacity-50 cursor-wait" : ""}`}
            >
              {loading === "api" ? "Loading..." : "Get your API key — free to start →"}
            </button>
          </div>

          {/* Cost calculator */}
          <div className="bg-surface border border-border rounded-2xl p-6 max-w-xl mx-auto">
            <h4 className="text-sm font-semibold text-text-primary mb-4">💰 Cost calculator</h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              {[
                { calls: "1,000", cost: "$10", label: "Hobby" },
                { calls: "10,000", cost: "$100", label: "Growth" },
                { calls: "100,000", cost: "$1,000", label: "Scale" },
              ].map((tier) => (
                <div key={tier.calls} className="bg-card border border-border rounded-xl p-4">
                  <p className="text-xs text-text-muted">{tier.label}</p>
                  <p className="text-lg font-bold text-text-primary mt-1">{tier.cost}</p>
                  <p className="text-xs text-text-secondary">{tier.calls} calls/mo</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick start */}
          <div className="bg-card border border-border rounded-2xl p-6 max-w-xl mx-auto">
            <h4 className="text-sm font-semibold text-text-primary mb-3">⚡ Get started in 30 seconds</h4>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-text-muted mb-1.5">1. Sign up and get your API key</p>
                <pre className="bg-background border border-border rounded-xl p-3 text-xs text-text-secondary overflow-x-auto font-mono">
{`curl -X POST https://alaii-engage.vercel.app/api/auth/signup \\
  -H "Content-Type: application/json" \\
  -d '{"email":"dev@app.com","password":"yourpass"}'

# Returns: { "apiKey": "ae_abc123..." }`}
                </pre>
              </div>
              <div>
                <p className="text-xs text-text-muted mb-1.5">2. Generate engagement content</p>
                <pre className="bg-background border border-border rounded-xl p-3 text-xs text-text-secondary overflow-x-auto font-mono">
{`curl -X POST https://alaii-engage.vercel.app/api/v1/generate \\
  -H "Authorization: Bearer ae_abc123..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "platform": "instagram",
    "type": "comment_reply",
    "context": {
      "originalContent": "love your service!",
      "authorName": "sarah_fitness"
    }
  }'`}
                </pre>
              </div>
              <div>
                <p className="text-xs text-text-muted mb-1.5">3. Check your usage</p>
                <pre className="bg-background border border-border rounded-xl p-3 text-xs text-text-secondary overflow-x-auto font-mono">
{`curl https://alaii-engage.vercel.app/api/v1/usage \\
  -H "Authorization: Bearer ae_abc123..."`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      <p className="text-center text-text-muted text-xs">
        {mode === "subscription"
          ? "All plans include a 7-day free trial. Cancel anytime — no questions asked."
          : "No credit card required to start. Billed monthly based on usage."}
      </p>
    </div>
  );
}
