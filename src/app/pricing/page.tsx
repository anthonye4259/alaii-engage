"use client";

import { useState } from "react";

const plans = [
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
    priceId: "price_pro_monthly",
  },
  {
    id: "agency",
    name: "Agency",
    price: "$99",
    period: "/month",
    description: "For agencies managing multiple brands",
    features: [
      "Unlimited social accounts",
      "2,000 engagements/month",
      "All Pro features",
      "MCP / API access",
      "White-label responses",
      "Multi-brand management",
      "Dedicated support",
    ],
    cta: "Start Agency — 7 days free",
    popular: false,
    priceId: "price_agency_monthly",
  },
];

export default function PricingPage() {
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
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Checkout error:", err);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-text-primary">Simple Pricing</h1>
        <p className="text-text-secondary text-sm mt-2">Automate your social engagement. Cancel anytime.</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {plans.map((plan) => (
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
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
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

      <p className="text-center text-text-muted text-xs">
        All plans include a 7-day free trial. Cancel anytime — no questions asked.
      </p>
    </div>
  );
}
