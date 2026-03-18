import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog — AI Social Media Engagement Guides",
  description: "Learn how to automate social media engagement with AI. Guides for Instagram, TikTok, LinkedIn, Reddit, and more.",
};

const articles = [
  {
    slug: "automate-instagram-engagement",
    title: "How to Automate Instagram Engagement Without Getting Banned",
    excerpt: "Most automation tools get accounts flagged within days. Here's how AI-powered engagement avoids detection by using varied timing, imperfect grammar, and platform-specific personalities.",
    category: "Instagram",
    readTime: "8 min",
    date: "Mar 2026",
  },
  {
    slug: "ai-agent-social-media-api",
    title: "Build an AI Agent That Manages Your Social Media (API Tutorial)",
    excerpt: "Step-by-step guide to building an autonomous social media agent using Alaii Engage's API. Sign up programmatically, generate content, and track engagement — all with curl commands.",
    category: "Developers",
    readTime: "12 min",
    date: "Mar 2026",
  },
  {
    slug: "tiktok-growth-automation",
    title: "TikTok Growth on Autopilot: Comment Strategy That Gets Followers",
    excerpt: "The comment section is TikTok's discovery engine. Learn how strategic, AI-generated comments on trending posts drive followers to your profile without spending on ads.",
    category: "TikTok",
    readTime: "6 min",
    date: "Mar 2026",
  },
  {
    slug: "linkedin-engagement-strategy",
    title: "LinkedIn Engagement Strategy: AI Comments That Build Authority",
    excerpt: "Generic 'Great post!' comments hurt your brand. Here's how AI writes thoughtful, industry-specific LinkedIn comments that make people visit your profile.",
    category: "LinkedIn",
    readTime: "7 min",
    date: "Mar 2026",
  },
  {
    slug: "zapier-social-media-automation",
    title: "Connect Alaii Engage to Zapier, n8n, and Make.com",
    excerpt: "Set up webhooks so every engagement triggers a Zapier Zap. Log to Sheets, notify on Slack, update your CRM — all automatically when your AI engages.",
    category: "Integrations",
    readTime: "5 min",
    date: "Mar 2026",
  },
  {
    slug: "reddit-growth-organic",
    title: "Reddit Organic Growth: How to Build a Community Without Getting Downvoted",
    excerpt: "Reddit hates marketers. But AI that genuinely contributes to conversations can build brand awareness without triggering the community's BS detector.",
    category: "Reddit",
    readTime: "9 min",
    date: "Mar 2026",
  },
];

const categoryColors: Record<string, string> = {
  Instagram: "#e1306c",
  TikTok: "#00f2ea",
  LinkedIn: "#0a66c2",
  Reddit: "#ff4500",
  Developers: "#10b981",
  Integrations: "#8b5cf6",
};

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="flex items-center justify-between max-w-6xl mx-auto px-6 py-5">
        <Link href="/landing" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#4A9FD4] to-[#63B3E4] flex items-center justify-center">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <span className="text-lg font-bold" style={{ color: "var(--text-primary, #1e293b)" }}>Alaii Engage</span>
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/pricing" className="text-sm hover:opacity-80 transition" style={{ color: "var(--text-secondary, #64748b)" }}>Pricing</Link>
          <Link href="/docs" className="text-sm hover:opacity-80 transition" style={{ color: "var(--text-secondary, #64748b)" }}>API Docs</Link>
          <Link href="/login?signup=true" className="px-5 py-2.5 bg-gradient-to-r from-[#4A9FD4] to-[#63B3E4] text-white rounded-xl text-sm font-semibold shadow-lg hover:shadow-xl transition-all">
            Start Free →
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-16 pb-12 text-center">
        <h1 className="text-4xl font-bold mb-4" style={{ color: "var(--text-primary, #1e293b)" }}>
          Learn to grow with AI engagement
        </h1>
        <p className="text-lg max-w-xl mx-auto" style={{ color: "var(--text-secondary, #64748b)" }}>
          Guides on automating social media engagement across every platform — without getting flagged.
        </p>
      </section>

      {/* Articles */}
      <section className="max-w-4xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {articles.map((article) => (
            <article
              key={article.slug}
              className="border rounded-2xl p-6 hover:shadow-lg transition-all duration-300 group"
              style={{
                backgroundColor: "var(--card, #fff)",
                borderColor: "var(--border, #e2e8f0)",
              }}
            >
              <div className="flex items-center gap-3 mb-4">
                <span
                  className="text-xs font-semibold px-3 py-1 rounded-full"
                  style={{
                    backgroundColor: (categoryColors[article.category] || "#64748B") + "15",
                    color: categoryColors[article.category] || "#64748B",
                  }}
                >
                  {article.category}
                </span>
                <span className="text-xs" style={{ color: "var(--text-muted, #94a3b8)" }}>
                  {article.readTime} · {article.date}
                </span>
              </div>
              <h2
                className="text-lg font-semibold mb-2 group-hover:text-[#4A9FD4] transition-colors"
                style={{ color: "var(--text-primary, #1e293b)" }}
              >
                {article.title}
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary, #64748b)" }}>
                {article.excerpt}
              </p>
              <p className="mt-4 text-sm font-medium text-[#4A9FD4]">
                Read more →
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 text-center" style={{ borderTop: "1px solid var(--border, #e2e8f0)" }}>
        <h2 className="text-2xl font-bold mb-3" style={{ color: "var(--text-primary, #1e293b)" }}>
          Ready to automate your engagement?
        </h2>
        <p className="text-sm mb-6" style={{ color: "var(--text-secondary, #64748b)" }}>100 free API calls. No credit card required.</p>
        <Link href="/login?signup=true" className="inline-flex px-8 py-4 bg-gradient-to-r from-[#4A9FD4] to-[#63B3E4] text-white rounded-2xl text-base font-semibold shadow-lg hover:shadow-2xl transition-all">
          Get started for free →
        </Link>
      </section>
    </div>
  );
}
