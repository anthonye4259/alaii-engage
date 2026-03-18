"use client";

import { useState } from "react";
import { InstagramIcon, TikTokIcon, LinkedInIcon, FacebookIcon, XIcon, RedditIcon } from "@/components/SocialIcons";

type Step = 1 | 2 | 3;

interface BusinessData {
  businessName: string;
  websiteUrl: string;
  industry: string;
  description: string;
  tone: string;
  targetAudience: string;
  alwaysMention: string;
  neverSay: string;
}

const platforms = [
  { id: "instagram", name: "Instagram", Icon: InstagramIcon, color: "#E1306C" },
  { id: "tiktok", name: "TikTok", Icon: TikTokIcon, color: "#000000" },
  { id: "linkedin", name: "LinkedIn", Icon: LinkedInIcon, color: "#0A66C2" },
  { id: "facebook", name: "Facebook", Icon: FacebookIcon, color: "#1877F2" },
  { id: "x", name: "X (Twitter)", Icon: XIcon, color: "#000000" },
  { id: "reddit", name: "Reddit", Icon: RedditIcon, color: "#FF4500" },
];

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>(1);
  const [scraping, setScraping] = useState(false);
  const [scraped, setScraped] = useState(false);
  const [biz, setBiz] = useState<BusinessData>({
    businessName: "", websiteUrl: "", industry: "", description: "",
    tone: "casual and friendly", targetAudience: "", alwaysMention: "", neverSay: "",
  });

  const updateBiz = (field: keyof BusinessData, value: string) => {
    setBiz((prev) => ({ ...prev, [field]: value }));
  };

  const handleScrape = async () => {
    if (!biz.websiteUrl) return;
    setScraping(true);
    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: biz.websiteUrl }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        const d = data.data;
        setBiz((prev) => ({
          ...prev,
          businessName: d.businessName || prev.businessName,
          industry: d.industry || prev.industry,
          description: d.description || prev.description,
          tone: d.tone || prev.tone,
          targetAudience: d.targetAudience || prev.targetAudience,
          alwaysMention: Array.isArray(d.alwaysMention) ? d.alwaysMention.join(", ") : prev.alwaysMention,
          neverSay: Array.isArray(d.neverSay) ? d.neverSay.join(", ") : prev.neverSay,
        }));
        setScraped(true);
      }
    } catch {
      // Silently fail — user can fill in manually
    } finally {
      setScraping(false);
    }
  };

  const handleFinish = async () => {
    try {
      // Save business context and mark as onboarded
      await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboarded: true, businessContext: biz }),
      });
    } catch {
      // Continue anyway
    }
    window.location.href = "/dashboard";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0f7ff] via-white to-[#e8f4fd] relative overflow-hidden">
      {/* Background */}
      <div className="absolute top-[-200px] left-[-100px] w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute bottom-[-200px] right-[-100px] w-[600px] h-[600px] rounded-full bg-accent/5 blur-3xl" />

      <div className="relative z-10 max-w-2xl mx-auto py-12 px-6">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent mx-auto flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Let&apos;s set up your agent</h1>
          <p className="text-text-secondary text-sm mt-1">3 quick steps and you&apos;re live</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-3 mb-10">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                step >= s ? "bg-gradient-to-r from-primary to-accent text-white shadow-md shadow-primary/20" : "bg-surface border border-border text-text-muted"
              }`}>
                {step > s ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : s}
              </div>
              {s < 3 && <div className={`w-16 h-0.5 rounded-full ${step > s ? "bg-primary" : "bg-border"}`} />}
            </div>
          ))}
        </div>

        {/* Step 1 — Business info */}
        {step === 1 && (
          <div className="bg-white/80 backdrop-blur-xl border border-border rounded-3xl p-8 shadow-xl shadow-black/[0.03] space-y-5 animate-fade-in">
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Tell us about your business</h2>
              <p className="text-text-muted text-sm mt-1">This helps your AI engage authentically on your behalf</p>
            </div>

            {/* Website scraper */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Website URL</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={biz.websiteUrl}
                  onChange={(e) => updateBiz("websiteUrl", e.target.value)}
                  placeholder="https://yourbusiness.com"
                  className="flex-1 bg-surface border border-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-all"
                />
                <button
                  onClick={handleScrape}
                  disabled={scraping || !biz.websiteUrl}
                  className="px-5 py-3 bg-gradient-to-r from-primary to-accent text-white rounded-xl text-sm font-medium transition-all hover:shadow-lg hover:shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                >
                  {scraping ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Scanning...
                    </span>
                  ) : scraped ? "✓ Scanned" : "Scan with AI"}
                </button>
              </div>
              {scraped && (
                <p className="text-success text-xs mt-2 flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  AI analyzed your website and filled in the fields below. Review and adjust as needed.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Business name</label>
                <input
                  type="text"
                  value={biz.businessName}
                  onChange={(e) => updateBiz("businessName", e.target.value)}
                  placeholder="Mike's Cuts"
                  className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Industry</label>
                <input
                  type="text"
                  value={biz.industry}
                  onChange={(e) => updateBiz("industry", e.target.value)}
                  placeholder="Barbershop, Fitness, SaaS..."
                  className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">What do you do?</label>
              <textarea
                value={biz.description}
                onChange={(e) => updateBiz("description", e.target.value)}
                placeholder="We offer premium fades, beard trims, and hot towel shaves in Brooklyn..."
                rows={2}
                className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-all resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Brand tone</label>
                <select
                  value={biz.tone}
                  onChange={(e) => updateBiz("tone", e.target.value)}
                  className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-primary transition-all"
                >
                  <option>casual and friendly</option>
                  <option>professional and warm</option>
                  <option>enthusiastic and energetic</option>
                  <option>witty and conversational</option>
                  <option>minimal and clean</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Target audience</label>
                <input
                  type="text"
                  value={biz.targetAudience}
                  onChange={(e) => updateBiz("targetAudience", e.target.value)}
                  placeholder="Men 18-35 who care about style"
                  className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Always mention (comma-separated)</label>
              <input
                type="text"
                value={biz.alwaysMention}
                onChange={(e) => updateBiz("alwaysMention", e.target.value)}
                placeholder="mikescuts.com, Book online"
                className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Never say (comma-separated)</label>
              <input
                type="text"
                value={biz.neverSay}
                onChange={(e) => updateBiz("neverSay", e.target.value)}
                placeholder="competitor names, discounts"
                className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-all"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setStep(2)}
                disabled={!biz.businessName}
                className="px-8 py-3 bg-gradient-to-r from-primary to-accent text-white rounded-xl text-sm font-semibold transition-all hover:shadow-lg hover:shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next: Connect platforms →
              </button>
            </div>
          </div>
        )}

        {/* Step 2 — Connect platforms */}
        {step === 2 && (
          <div className="bg-white/80 backdrop-blur-xl border border-border rounded-3xl p-8 shadow-xl shadow-black/[0.03] space-y-5 animate-fade-in">
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Connect your first platform</h2>
              <p className="text-text-muted text-sm mt-1">Choose at least one platform to start engaging</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {platforms.map((p) => (
                <a
                  key={p.id}
                  href={`/api/auth/${p.id}`}
                  className="flex items-center gap-3 p-4 bg-surface border border-border rounded-2xl hover:border-primary hover:bg-primary/[0.02] transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: p.color + "12" }}>
                    <p.Icon size={20} className="opacity-80" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-text-primary">{p.name}</p>
                    <p className="text-xs text-text-muted">Click to connect</p>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-muted group-hover:text-primary transition-colors">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </a>
              ))}
            </div>

            <div className="flex justify-between pt-2">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-3 border border-border text-text-secondary rounded-xl text-sm font-medium hover:border-primary hover:text-primary transition-all"
              >
                ← Back
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(3)}
                  className="px-6 py-3 text-text-muted text-sm hover:text-text-secondary transition-colors"
                >
                  Skip for now
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="px-8 py-3 bg-gradient-to-r from-primary to-accent text-white rounded-xl text-sm font-semibold transition-all hover:shadow-lg hover:shadow-primary/20"
                >
                  Next: Choose plan →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3 — Choose plan */}
        {step === 3 && (
          <div className="bg-white/80 backdrop-blur-xl border border-border rounded-3xl p-8 shadow-xl shadow-black/[0.03] space-y-6 animate-fade-in">
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Choose your plan</h2>
              <p className="text-text-muted text-sm mt-1">Start with a 7-day free trial — cancel anytime</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Pro */}
              <div className="border-2 border-primary rounded-2xl p-6 relative bg-primary/[0.02]">
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-semibold px-3 py-0.5 rounded-full">
                  Most Popular
                </span>
                <h3 className="text-lg font-semibold text-text-primary">Pro</h3>
                <p className="text-text-muted text-xs mt-1">For growing businesses</p>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-text-primary">$40</span>
                  <span className="text-text-muted text-sm">/month</span>
                </div>
                <ul className="mt-4 space-y-2">
                  {["4 social accounts", "500 engagements/month", "AI-powered replies", "All platforms", "Activity analytics"].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-text-secondary">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4A9FD4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={handleFinish}
                  className="w-full mt-5 py-3 bg-gradient-to-r from-primary to-accent text-white rounded-xl text-sm font-semibold shadow-lg shadow-primary/20 hover:shadow-xl transition-all"
                >
                  Start Pro — 7 days free
                </button>
              </div>

              {/* Agency */}
              <div className="border border-border rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-text-primary">Agency</h3>
                <p className="text-text-muted text-xs mt-1">For teams and agencies</p>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-text-primary">$99</span>
                  <span className="text-text-muted text-sm">/month</span>
                </div>
                <ul className="mt-4 space-y-2">
                  {["Unlimited accounts", "2,000 engagements/month", "API / MCP access", "White-label", "Dedicated support"].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-text-secondary">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4A9FD4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={handleFinish}
                  className="w-full mt-5 py-3 border border-border text-text-primary rounded-xl text-sm font-semibold hover:border-primary hover:text-primary transition-all"
                >
                  Start Agency — 7 days free
                </button>
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-3 border border-border text-text-secondary rounded-xl text-sm font-medium hover:border-primary hover:text-primary transition-all"
              >
                ← Back
              </button>
              <button
                onClick={handleFinish}
                className="text-text-muted text-sm hover:text-text-secondary transition-colors"
              >
                Skip — start free
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
