import Link from "next/link";

export default function DocsIntroduction() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-text-primary mb-3">Introduction</h1>
        <p className="text-text-secondary leading-relaxed">
          Alaii Engage is an <strong>open-source AI engagement engine</strong> for social media.
          It automates replies, comments, DMs, and growth across Instagram, TikTok, X, LinkedIn, Reddit, and Facebook —
          with AI that sounds genuinely human.
        </p>
      </div>

      {/* What is Alaii Engage */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-3">What is Alaii Engage?</h2>
        <p className="text-sm text-text-secondary leading-relaxed mb-4">
          Most social media tools handle <strong>publishing</strong> — scheduling posts, managing calendars.
          Alaii Engage handles what happens <strong>after you post</strong>: replying to comments, engaging with
          your niche, welcoming new followers, and learning what works over time.
        </p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: "🤖", title: "AI-Powered Replies", desc: "Context-aware responses, never generic" },
            { icon: "🎭", title: "Platform Personalities", desc: "Different tone per platform" },
            { icon: "🛡️", title: "Anti-Detection", desc: "Indistinguishable from human" },
            { icon: "📊", title: "Performance Learning", desc: "Gets smarter over time" },
            { icon: "⚡", title: "Real-Time Webhooks", desc: "Instant replies via Meta" },
            { icon: "🔑", title: "Developer API", desc: "$0.01/call for AI agents" },
          ].map((f) => (
            <div key={f.title} className="bg-surface border border-border rounded-xl p-3">
              <span className="text-lg">{f.icon}</span>
              <p className="text-sm font-medium text-text-primary mt-1">{f.title}</p>
              <p className="text-xs text-text-muted">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Architecture */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-3">Architecture</h2>
        <pre className="bg-background border border-border rounded-xl p-4 font-mono text-xs text-text-secondary overflow-x-auto">
{`┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Cron Job   │────▶│    Agent     │────▶│  AI Content  │
│  (10 min)    │     │  Orchestrator│     │  Generator   │
└──────────────┘     └──────┬───────┘     └──────────────┘
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
      ┌──────────┐  ┌──────────┐  ┌──────────┐
      │ Instagram│  │    X     │  │  Reddit  │
      │ Facebook │  │ LinkedIn │  │  TikTok  │
      └──────────┘  └──────────┘  └──────────┘
              │             │             │
              └─────────────┼─────────────┘
                            ▼
                    ┌──────────────┐
                    │ Performance  │
                    │  Learning    │
                    └──────────────┘`}
        </pre>
      </div>

      {/* Platform support */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-3">Platform Support</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 text-text-muted font-medium">Platform</th>
              <th className="text-center py-2 text-text-muted font-medium">Comments</th>
              <th className="text-center py-2 text-text-muted font-medium">DMs</th>
              <th className="text-center py-2 text-text-muted font-medium">Likes</th>
              <th className="text-center py-2 text-text-muted font-medium">Publish</th>
            </tr>
          </thead>
          <tbody>
            {[
              { name: "Instagram", comments: true, dms: true, likes: false, publish: true },
              { name: "Facebook", comments: true, dms: true, likes: true, publish: true },
              { name: "X / Twitter", comments: true, dms: true, likes: true, publish: true },
              { name: "LinkedIn", comments: true, dms: false, likes: true, publish: true },
              { name: "Reddit", comments: true, dms: true, likes: true, publish: true },
              { name: "TikTok", comments: true, dms: false, likes: true, publish: true },
            ].map((p) => (
              <tr key={p.name} className="border-b border-border">
                <td className="py-2.5 font-medium text-text-primary">{p.name}</td>
                <td className="py-2.5 text-center">{p.comments ? "✅" : "❌"}</td>
                <td className="py-2.5 text-center">{p.dms ? "✅" : "❌"}</td>
                <td className="py-2.5 text-center">{p.likes ? "✅" : "❌"}</td>
                <td className="py-2.5 text-center">{p.publish ? "✅" : "❌"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Self-hosted vs managed */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-3">Self-Hosted vs Managed</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 text-text-muted font-medium"></th>
              <th className="text-left py-2 text-text-muted font-medium">Self-Hosted (Free)</th>
              <th className="text-left py-2 text-text-muted font-medium">Managed (alaii.app)</th>
            </tr>
          </thead>
          <tbody>
            {[
              { label: "Price", self: "Free forever", managed: "$40/mo or $0.01/call" },
              { label: "Setup", self: "You manage infra", managed: "One-click" },
              { label: "Cron jobs", self: "You configure", managed: "Built-in" },
              { label: "Webhooks", self: "You set up SSL", managed: "Pre-configured" },
              { label: "Support", self: "Community (Discord)", managed: "Priority" },
              { label: "Updates", self: "git pull", managed: "Automatic" },
            ].map((r) => (
              <tr key={r.label} className="border-b border-border">
                <td className="py-2.5 font-medium text-text-primary">{r.label}</td>
                <td className="py-2.5 text-text-secondary">{r.self}</td>
                <td className="py-2.5 text-text-secondary">{r.managed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Next steps */}
      <div className="flex gap-4">
        <Link
          href="/docs/how-it-works"
          className="flex-1 bg-card border border-border rounded-2xl p-5 hover:border-primary transition-colors group"
        >
          <p className="text-sm font-semibold text-text-primary group-hover:text-primary transition-colors">How It Works →</p>
          <p className="text-xs text-text-muted mt-1">Understand the agent loop</p>
        </Link>
        <Link
          href="/docs/quickstart"
          className="flex-1 bg-card border border-border rounded-2xl p-5 hover:border-primary transition-colors group"
        >
          <p className="text-sm font-semibold text-text-primary group-hover:text-primary transition-colors">Quickstart →</p>
          <p className="text-xs text-text-muted mt-1">Up and running in 5 minutes</p>
        </Link>
      </div>
    </div>
  );
}
