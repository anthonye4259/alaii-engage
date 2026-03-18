"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const platforms = [
  { name: "Instagram", icon: "📸", color: "#E1306C" },
  { name: "TikTok", icon: "🎵", color: "#00F2EA" },
  { name: "X", icon: "𝕏", color: "#000" },
  { name: "LinkedIn", icon: "💼", color: "#0A66C2" },
  { name: "Reddit", icon: "🟠", color: "#FF4500" },
  { name: "Facebook", icon: "📘", color: "#1877F2" },
];

const features = [
  {
    icon: "💬",
    title: "Smart Comment Replies",
    desc: "AI reads the context and responds like you would — relevant, on-brand, never generic.",
  },
  {
    icon: "🎯",
    title: "Hashtag Targeting",
    desc: "Find and engage with posts in your niche automatically. Turn strangers into followers.",
  },
  {
    icon: "📩",
    title: "Welcome DMs",
    desc: "Greet every new follower with a personalized message. Convert follows into conversations.",
  },
  {
    icon: "🛡️",
    title: "Anti-Detection",
    desc: "Platform-specific personalities, varied timing, imperfect grammar. Indistinguishable from human.",
  },
  {
    icon: "🤖",
    title: "Agent-Native API",
    desc: "Other AI agents can sign up, pay, and generate content — zero human needed. $0.01/call.",
  },
  {
    icon: "📊",
    title: "Real-Time Dashboard",
    desc: "See every action your agent takes. Stats, activity feed, platform breakdowns — all live.",
  },
];

const stats = [
  { value: "6", label: "Platforms" },
  { value: "$0.01", label: "Per API Call" },
  { value: "3", label: "Variations / Call" },
  { value: "24/7", label: "Autopilot" },
];

export default function LandingPage() {
  const { user } = useAuth();
  const router = useRouter();

  // If already logged in, go to dashboard
  useEffect(() => {
    if (user) router.replace("/dashboard");
  }, [user, router]);

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="flex items-center justify-between max-w-6xl mx-auto px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <span className="text-lg font-bold text-text-primary">Alaii Engage</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/pricing" className="text-sm text-text-secondary hover:text-text-primary transition">Pricing</Link>
          <Link href="/blog" className="text-sm text-text-secondary hover:text-text-primary transition">Blog</Link>
          <Link href="/docs" className="text-sm text-text-secondary hover:text-text-primary transition">API Docs</Link>
          <Link href="/login" className="text-sm text-text-secondary hover:text-text-primary transition">Log in</Link>
          <Link
            href="/login?signup=true"
            className="px-5 py-2.5 bg-gradient-to-r from-primary to-accent text-white rounded-xl text-sm font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:scale-[1.02] transition-all"
          >
            Start Free →
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 bg-accent/5 border border-accent/20 rounded-full px-4 py-1.5 mb-6">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="text-xs font-medium text-accent">Now with OpenAPI spec — AI agents can auto-discover us</span>
        </div>

        <h1 className="text-5xl md:text-6xl font-bold text-text-primary leading-tight mb-6">
          Your AI Engagement Team
          <br />
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Running 24/7
          </span>
        </h1>

        <p className="text-lg text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed">
          Stop spending hours replying, commenting, and DMing.
          Alaii Engage automates your social media engagement with AI that sounds
          like a real human — across Instagram, TikTok, X, LinkedIn, Reddit, and Facebook.
        </p>

        <div className="flex items-center justify-center gap-4 mb-16">
          <Link
            href="/login?signup=true"
            className="px-8 py-4 bg-gradient-to-r from-primary to-accent text-white rounded-2xl text-base font-semibold shadow-lg shadow-primary/25 hover:shadow-2xl hover:scale-[1.02] transition-all"
          >
            Start Free — 100 API Calls →
          </Link>
          <Link
            href="/docs"
            className="px-8 py-4 border border-border text-text-secondary rounded-2xl text-base font-medium hover:border-primary hover:text-primary transition-all"
          >
            View API Docs
          </Link>
        </div>

        {/* Platform pills */}
        <div className="flex items-center justify-center gap-3 flex-wrap">
          {platforms.map((p) => (
            <div
              key={p.name}
              className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-full text-sm hover:border-border-hover transition-colors"
            >
              <span>{p.icon}</span>
              <span className="font-medium text-text-primary">{p.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-border bg-surface/50">
        <div className="max-w-4xl mx-auto px-6 py-8 grid grid-cols-4 gap-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-bold text-text-primary">{s.value}</p>
              <p className="text-xs text-text-muted mt-1 uppercase tracking-wide">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-text-primary mb-3">
            Everything your engagement team would do —<br />automated.
          </h2>
          <p className="text-text-secondary text-sm max-w-lg mx-auto">
            Other tools schedule posts. We handle what happens after.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-card border border-border rounded-2xl p-6 hover:border-border-highlight hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group"
            >
              <span className="text-3xl">{f.icon}</span>
              <h3 className="text-base font-semibold text-text-primary mt-4 mb-2 group-hover:text-primary transition-colors">
                {f.title}
              </h3>
              <p className="text-sm text-text-muted leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-surface/50 border-y border-border py-24">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-text-primary text-center mb-16">
            Three steps. Five minutes.
          </h2>
          <div className="grid grid-cols-3 gap-12">
            {[
              { n: "01", title: "Paste your website", desc: "Our AI scrapes it and learns your business, tone, audience, and offerings." },
              { n: "02", title: "Connect your accounts", desc: "Instagram, TikTok, X, LinkedIn, Reddit, Facebook — we support all six." },
              { n: "03", title: "Watch it work", desc: "Your agent starts engaging within minutes. Track everything on your dashboard." },
            ].map((step) => (
              <div key={step.n} className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-primary font-bold text-lg">{step.n}</span>
                </div>
                <h3 className="text-base font-semibold text-text-primary mb-2">{step.title}</h3>
                <p className="text-sm text-text-muted">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* API Section for devs */}
      <section className="max-w-4xl mx-auto px-6 py-24">
        <div className="bg-card border border-border rounded-3xl p-10 text-center">
          <div className="inline-flex items-center gap-2 bg-accent/5 border border-accent/20 rounded-full px-4 py-1.5 mb-6">
            <span className="text-xs font-medium text-accent">For developers & AI agents</span>
          </div>
          <h2 className="text-3xl font-bold text-text-primary mb-4">
            One API call. Human-like content.
          </h2>
          <p className="text-text-secondary text-sm mb-8 max-w-lg mx-auto">
            Sign up programmatically. Get an API key. Generate engagement content at $0.01/call.
            Other AI agents can discover us via OpenAPI spec.
          </p>
          <pre className="bg-background border border-border rounded-2xl p-6 font-mono text-xs text-left text-text-secondary overflow-x-auto mb-8 max-w-2xl mx-auto">
{`curl -X POST https://alaii-engage.vercel.app/api/v1/generate \\
  -H "Authorization: Bearer ae_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "platform": "instagram",
    "type": "comment_reply",
    "context": { "originalContent": "love your work!" }
  }'`}
          </pre>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/docs"
              className="px-6 py-3 bg-gradient-to-r from-primary to-accent text-white rounded-xl text-sm font-semibold shadow-lg shadow-primary/20 hover:shadow-xl transition-all"
            >
              Read the docs →
            </Link>
            <Link
              href="/pricing"
              className="px-6 py-3 border border-border text-text-secondary rounded-xl text-sm font-medium hover:border-primary hover:text-primary transition-all"
            >
              See pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing preview */}
      <section className="bg-surface/50 border-y border-border py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-text-primary mb-4">Simple, transparent pricing</h2>
          <p className="text-text-secondary text-sm mb-12">Start free. Upgrade when you need more.</p>
          <div className="grid grid-cols-3 gap-6">
            {[
              { name: "Free", price: "$0", period: "forever", features: ["100 API calls/month", "1 connected account", "Comments + likes", "Dashboard"], cta: "Start Free" },
              { name: "Pro", price: "$40", period: "/month", features: ["10K API calls/month", "5 connected accounts", "All engagement types", "Priority support"], cta: "Go Pro", featured: true },
              { name: "Agency", price: "$99", period: "/month", features: ["50K API calls/month", "Unlimited accounts", "White-label reports", "Webhook integrations"], cta: "Go Agency" },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`bg-card border rounded-2xl p-8 text-left ${
                  plan.featured ? "border-primary shadow-lg shadow-primary/10" : "border-border"
                }`}
              >
                {plan.featured && (
                  <span className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">Popular</span>
                )}
                <h3 className="text-lg font-semibold text-text-primary mt-3">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mt-2 mb-6">
                  <span className="text-4xl font-bold text-text-primary">{plan.price}</span>
                  <span className="text-text-muted text-sm">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-text-secondary">
                      <span className="text-success text-xs">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/login?signup=true"
                  className={`block text-center py-3 rounded-xl text-sm font-semibold transition-all ${
                    plan.featured
                      ? "bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/20 hover:shadow-xl"
                      : "border border-border text-text-secondary hover:border-primary hover:text-primary"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <h2 className="text-4xl font-bold text-text-primary mb-4">
          Ready to grow on autopilot?
        </h2>
        <p className="text-text-secondary text-sm mb-8 max-w-md mx-auto">
          100 free API calls to start. No credit card required.
        </p>
        <Link
          href="/login?signup=true"
          className="inline-flex px-10 py-4 bg-gradient-to-r from-primary to-accent text-white rounded-2xl text-base font-semibold shadow-lg shadow-primary/25 hover:shadow-2xl hover:scale-[1.02] transition-all"
        >
          Get started for free →
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <p className="text-xs text-text-muted">© 2026 Alaii. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/docs" className="text-xs text-text-muted hover:text-text-secondary">API Docs</Link>
            <Link href="/pricing" className="text-xs text-text-muted hover:text-text-secondary">Pricing</Link>
            <a href="https://alaii-engage.vercel.app/openapi.json" className="text-xs text-text-muted hover:text-text-secondary">OpenAPI Spec</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
