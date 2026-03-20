import Link from "next/link";

export default function EnvConfigPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-text-primary mb-3">Environment Variables</h1>
        <p className="text-text-secondary leading-relaxed">
          All configuration is done through environment variables. Copy <code className="text-accent">.env.example</code> to <code className="text-accent">.env</code> and fill in the values.
        </p>
      </div>

      <EnvGroup title="Required" vars={[
        { name: "OPENAI_API_KEY", desc: "Powers AI content generation", example: "sk-..." },
        { name: "UPSTASH_REDIS_REST_URL", desc: "Redis storage URL (auto-configured with Docker)", example: "http://redis-rest:8079" },
        { name: "UPSTASH_REDIS_REST_TOKEN", desc: "Redis auth token", example: "local_dev_token" },
      ]} />

      <EnvGroup title="Meta (Instagram + Facebook)" vars={[
        { name: "META_APP_ID", desc: "Meta developer app ID", example: "123456789" },
        { name: "META_APP_SECRET", desc: "Meta app secret key", example: "abc123..." },
      ]} />

      <EnvGroup title="X / Twitter" vars={[
        { name: "X_CLIENT_ID", desc: "Twitter developer app client ID", example: "abc..." },
        { name: "X_CLIENT_SECRET", desc: "Twitter app client secret", example: "xyz..." },
        { name: "X_BEARER_TOKEN", desc: "Twitter bearer token for read operations", example: "AAA..." },
      ]} />

      <EnvGroup title="LinkedIn" vars={[
        { name: "LINKEDIN_CLIENT_ID", desc: "LinkedIn app client ID", example: "77abc..." },
        { name: "LINKEDIN_CLIENT_SECRET", desc: "LinkedIn app secret", example: "xyz..." },
      ]} />

      <EnvGroup title="Reddit" vars={[
        { name: "REDDIT_CLIENT_ID", desc: "Reddit app ID", example: "abc123" },
        { name: "REDDIT_CLIENT_SECRET", desc: "Reddit app secret", example: "xyz..." },
      ]} />

      <EnvGroup title="TikTok" vars={[
        { name: "TIKTOK_CLIENT_KEY", desc: "TikTok app client key", example: "abc..." },
        { name: "TIKTOK_CLIENT_SECRET", desc: "TikTok app secret", example: "xyz..." },
      ]} />

      <EnvGroup title="App Config" vars={[
        { name: "NEXT_PUBLIC_APP_URL", desc: "Your app URL for OAuth callbacks", example: "http://localhost:3000" },
        { name: "CRON_SECRET", desc: "Secret for securing cron endpoints", example: "change-me" },
        { name: "META_WEBHOOK_VERIFY_TOKEN", desc: "Token for Meta webhook verification", example: "alaii_engage_verify" },
      ]} />

      <EnvGroup title="Payments (Optional)" vars={[
        { name: "STRIPE_SECRET_KEY", desc: "Stripe API key for payments", example: "sk_live_..." },
        { name: "STRIPE_WEBHOOK_SECRET", desc: "Stripe webhook signing secret", example: "whsec_..." },
      ]} />

      <div className="flex gap-4">
        <Link href="/docs/configuration/platforms" className="flex-1 bg-card border border-border rounded-2xl p-5 hover:border-primary transition-colors group">
          <p className="text-sm font-semibold text-text-primary group-hover:text-primary transition-colors">Platform Setup →</p>
          <p className="text-xs text-text-muted mt-1">Connect your social accounts</p>
        </Link>
        <Link href="/docs/configuration/webhooks" className="flex-1 bg-card border border-border rounded-2xl p-5 hover:border-primary transition-colors group">
          <p className="text-sm font-semibold text-text-primary group-hover:text-primary transition-colors">Webhooks →</p>
          <p className="text-xs text-text-muted mt-1">Real-time engagement</p>
        </Link>
      </div>
    </div>
  );
}

function EnvGroup({ title, vars }: { title: string; vars: { name: string; desc: string; example: string }[] }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <h2 className="text-lg font-semibold text-text-primary mb-4">{title}</h2>
      <div className="space-y-3">
        {vars.map((v) => (
          <div key={v.name} className="bg-surface border border-border rounded-xl p-3">
            <div className="flex items-center justify-between mb-1">
              <code className="text-sm text-accent font-mono font-semibold">{v.name}</code>
            </div>
            <p className="text-xs text-text-muted">{v.desc}</p>
            <p className="text-xs text-text-muted mt-1 font-mono opacity-60">Example: {v.example}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
