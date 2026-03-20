import Link from "next/link";

export default function HowItWorksPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-text-primary mb-3">How It Works</h1>
        <p className="text-text-secondary leading-relaxed">
          Alaii Engage runs an autonomous engagement loop that scans, generates, and executes social media actions — learning what works and improving over time.
        </p>
      </div>

      {/* The Loop */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">The Engagement Loop</h2>
        <div className="space-y-6">
          <LoopStep n={1} title="Scan" icon="🔍">
            <p>Every 10 minutes (or instantly via webhooks), the <strong>Agent</strong> scans all connected accounts for new comments, mentions, DMs, and hashtag posts.</p>
          </LoopStep>
          <LoopStep n={2} title="Decide" icon="🧠">
            <p>The agent evaluates each opportunity against <strong>rate limits</strong>, <strong>content safety rules</strong>, and <strong>account health</strong>. High-risk or spammy content is filtered out automatically.</p>
          </LoopStep>
          <LoopStep n={3} title="Generate" icon="⚡">
            <p>The <strong>AI Content Generator</strong> crafts platform-specific responses using anti-detection measures — varied grammar, imperfect emoji usage, casual tone. Each platform gets a different personality.</p>
          </LoopStep>
          <LoopStep n={4} title="Execute" icon="🚀">
            <p>The <strong>Engagement Engine</strong> posts replies using official platform APIs with human-like timing delays (3-8 seconds between actions, never instant).</p>
          </LoopStep>
          <LoopStep n={5} title="Learn" icon="📊">
            <p>Every 6 hours, the <strong>Performance Learning</strong> system checks which replies got the most engagement. It feeds this data back to improve future generations.</p>
          </LoopStep>
        </div>
      </div>

      {/* Key Components */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Key Components</h2>
        <div className="space-y-3">
          {[
            { file: "agent.ts", desc: "Core orchestrator — coordinates scanning, generation, and execution across all platforms" },
            { file: "ai-generator.ts", desc: "AI content generation with platform-specific personality layers and anti-detection rules" },
            { file: "engage.ts", desc: "Executes platform actions with rate limiting, content safety, and account health checks" },
            { file: "rate-limiter.ts", desc: "Per-platform, per-action rate limiting to stay within API quotas and avoid flags" },
            { file: "content-safety.ts", desc: "Screens AI output for sensitive topics, profanity, and brand-unsafe content" },
            { file: "performance-learning.ts", desc: "Tracks engagement outcomes, learns which reply styles perform best" },
            { file: "conversation-memory.ts", desc: "Remembers past interactions with users for natural follow-up conversations" },
          ].map((c) => (
            <div key={c.file} className="flex gap-3 bg-surface border border-border rounded-xl p-3">
              <code className="text-xs text-accent font-mono whitespace-nowrap">{c.file}</code>
              <p className="text-xs text-text-muted">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Anti-detection */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-3">Anti-Detection</h2>
        <p className="text-sm text-text-secondary mb-4">
          Alaii Engage is designed to be indistinguishable from human engagement:
        </p>
        <ul className="space-y-2 text-sm text-text-secondary">
          <li className="flex items-start gap-2">
            <span className="text-success mt-0.5">✔</span>
            <span><strong>Varied timing</strong> — random 3-8 second delays between actions, never robotic precision</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-success mt-0.5">✔</span>
            <span><strong>Imperfect grammar</strong> — occasional lowercase starts, missing periods, natural typo patterns</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-success mt-0.5">✔</span>
            <span><strong>Mixed emoji</strong> — platform-appropriate emoji usage (more on IG, fewer on LinkedIn)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-success mt-0.5">✔</span>
            <span><strong>Context awareness</strong> — references specific post content, never sends template replies</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-success mt-0.5">✔</span>
            <span><strong>Rate limiting</strong> — respects platform-specific daily limits to avoid account flags</span>
          </li>
        </ul>
      </div>

      <div className="flex gap-4">
        <Link
          href="/docs/quickstart"
          className="flex-1 bg-card border border-border rounded-2xl p-5 hover:border-primary transition-colors group"
        >
          <p className="text-sm font-semibold text-text-primary group-hover:text-primary transition-colors">Quickstart →</p>
          <p className="text-xs text-text-muted mt-1">Get running in 5 minutes</p>
        </Link>
        <Link
          href="/docs/installation/docker"
          className="flex-1 bg-card border border-border rounded-2xl p-5 hover:border-primary transition-colors group"
        >
          <p className="text-sm font-semibold text-text-primary group-hover:text-primary transition-colors">Install with Docker →</p>
          <p className="text-xs text-text-muted mt-1">Self-host the full stack</p>
        </Link>
      </div>
    </div>
  );
}

function LoopStep({ n, title, icon, children }: { n: number; title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center shrink-0">
          {icon}
        </div>
        {n < 5 && <div className="w-px h-full bg-border mt-2" />}
      </div>
      <div className="pb-2">
        <h3 className="text-sm font-semibold text-text-primary mb-1">{title}</h3>
        <div className="text-sm text-text-secondary">{children}</div>
      </div>
    </div>
  );
}
